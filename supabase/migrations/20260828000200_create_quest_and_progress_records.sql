-- SQ-0004: auditable searches, Quest Instances, proof metadata, immutable
-- completions/ledger, and cached progress. Workflow RPCs and RLS are deferred.

create type public.quest_status as enum (
  'candidate',
  'active',
  'rerolled',
  'completed',
  'abandoned',
  'expired'
);

create function public.protect_quest_instance_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.search_id is distinct from old.search_id
    or new.template_id is distinct from old.template_id
    or new.snapshot_version is distinct from old.snapshot_version
    or new.snapshot is distinct from old.snapshot
    or new.category_id is distinct from old.category_id
    or new.base_xp is distinct from old.base_xp
    or new.location_id is distinct from old.location_id then
    raise exception 'Quest Instance identity and snapshot fields are immutable';
  end if;

  return new;
end;
$$;

create function public.validate_quest_proof_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.quest_instances
    where id = new.quest_instance_id
      and user_id = new.user_id
  ) then
    raise exception 'Quest proof owner must match Quest Instance owner';
  end if;

  return new;
end;
$$;

create function public.prevent_immutable_record_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% records are immutable', tg_table_name;
end;
$$;

create table public.quest_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  time_filter text not null,
  budget_filter text not null,
  mood_filter text not null,
  distance_filter text not null,
  area_code text,
  matching_cell text,
  result_reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint quest_searches_id_user_key unique (id, user_id),
  constraint quest_searches_time_filter_check
    check (time_filter in ('30_minutes', '1_hour', '2_hours', 'half_day')),
  constraint quest_searches_budget_filter_check
    check (budget_filter in ('free', 'under_50000', 'under_100000', 'flexible')),
  constraint quest_searches_mood_filter_check
    check (mood_filter in ('chill', 'food', 'explore', 'active', 'creative', 'random')),
  constraint quest_searches_distance_filter_check
    check (distance_filter in ('walking', 'under_3_km', 'under_10_km', 'flexible')),
  constraint quest_searches_area_code_check
    check (area_code is null or (area_code = btrim(area_code) and area_code <> '')),
  constraint quest_searches_matching_cell_check
    check (matching_cell is null or (matching_cell = btrim(matching_cell) and matching_cell <> '')),
  constraint quest_searches_result_reason_check
    check (result_reason is null or (result_reason = btrim(result_reason) and result_reason <> '')),
  constraint quest_searches_expiry_check check (expires_at > created_at)
);

comment on column public.quest_searches.matching_cell is
  'Optional coarse privacy-preserving matching cell; never a raw coordinate.';

create table public.quest_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  search_id uuid not null,
  template_id uuid not null references public.quest_templates (id) on delete restrict,
  status public.quest_status not null,
  status_reason text,
  snapshot_version smallint not null default 1,
  snapshot jsonb not null,
  category_id smallint not null references public.categories (id) on delete restrict,
  base_xp integer not null,
  location_id uuid references public.locations (id) on delete restrict,
  candidate_expires_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  abandoned_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quest_instances_id_user_key unique (id, user_id),
  constraint quest_instances_search_owner_fk
    foreign key (search_id, user_id) references public.quest_searches (id, user_id)
    on delete cascade,
  constraint quest_instances_status_reason_check
    check (
      (status in ('candidate', 'active', 'completed') and status_reason is null)
      or (status = 'rerolled' and status_reason = 'rerolled')
      or (status = 'abandoned' and status_reason = 'user_abandoned')
      or (status = 'expired' and status_reason in (
        'candidate_expired', 'availability_expired', 'safety_disabled'
      ))
    ),
  constraint quest_instances_snapshot_version_check check (snapshot_version > 0),
  constraint quest_instances_snapshot_check check (jsonb_typeof(snapshot) = 'object'),
  constraint quest_instances_base_xp_check check (base_xp between 50 and 200),
  constraint quest_instances_active_timestamp_check check (status <> 'active' or accepted_at is not null),
  constraint quest_instances_completed_timestamp_check check (status <> 'completed' or completed_at is not null),
  constraint quest_instances_abandoned_timestamp_check check (status <> 'abandoned' or abandoned_at is not null),
  constraint quest_instances_expired_timestamp_check check (status <> 'expired' or expired_at is not null)
);

comment on column public.quest_instances.snapshot is
  'Immutable execution snapshot populated by later server-authoritative matching logic.';

create table public.quest_proofs (
  id uuid primary key default gen_random_uuid(),
  quest_instance_id uuid not null unique,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  byte_size integer not null,
  note text,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quest_proofs_id_instance_user_key unique (id, quest_instance_id, user_id),
  constraint quest_proofs_instance_owner_fk
    foreign key (quest_instance_id, user_id) references public.quest_instances (id, user_id)
    on delete cascade,
  constraint quest_proofs_storage_path_check
    check (storage_path = btrim(storage_path) and storage_path <> ''),
  constraint quest_proofs_mime_type_check
    check (mime_type = btrim(mime_type) and mime_type <> ''),
  constraint quest_proofs_byte_size_check check (byte_size > 0),
  constraint quest_proofs_note_check check (note is null or char_length(note) <= 500),
  constraint quest_proofs_status_check check (status in ('uploaded', 'pending_delete'))
);

comment on table public.quest_proofs is
  'Metadata only. Object deletion is an explicit storage workflow, never implied by deleting this row.';

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_instance_id uuid not null unique,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  proof_id uuid not null unique,
  xp_awarded integer not null,
  level_before integer not null,
  level_after integer not null,
  idempotency_key uuid not null,
  completed_at timestamptz not null default now(),
  constraint quest_completions_id_user_xp_key unique (id, user_id, xp_awarded),
  constraint quest_completions_instance_fk
    foreign key (quest_instance_id, user_id) references public.quest_instances (id, user_id)
    on delete no action deferrable initially deferred,
  constraint quest_completions_proof_fk
    foreign key (proof_id, quest_instance_id, user_id)
    references public.quest_proofs (id, quest_instance_id, user_id)
    on delete no action deferrable initially deferred,
  constraint quest_completions_user_idempotency_key unique (user_id, idempotency_key),
  constraint quest_completions_xp_check check (xp_awarded > 0),
  constraint quest_completions_levels_check
    check (level_before >= 1 and level_after >= level_before)
);

comment on table public.quest_completions is
  'Immutable completion evidence. Inserts are performed only by the later atomic completion transaction.';

create table public.user_progress (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  lifetime_xp bigint not null default 0,
  level integer not null default 1,
  completed_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_progress_lifetime_xp_check check (lifetime_xp >= 0),
  constraint user_progress_level_check check (level >= 1),
  constraint user_progress_completed_count_check check (completed_count >= 0)
);

create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  quest_completion_id uuid not null unique,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint xp_ledger_completion_fk
    foreign key (quest_completion_id, user_id, amount)
    references public.quest_completions (id, user_id, xp_awarded)
    on delete no action deferrable initially deferred,
  constraint xp_ledger_amount_check check (amount > 0),
  constraint xp_ledger_reason_check check (reason = 'quest_completion')
);

comment on table public.xp_ledger is
  'Immutable audit: exactly one total award row per Quest Completion.';

create index quest_searches_user_created_idx
  on public.quest_searches (user_id, created_at desc);

create unique index one_active_quest_per_user
  on public.quest_instances (user_id)
  where status = 'active';

create index quest_instances_user_created_idx
  on public.quest_instances (user_id, created_at desc);

create index quest_instances_search_status_idx
  on public.quest_instances (search_id, status);

create index quest_instances_template_user_created_idx
  on public.quest_instances (template_id, user_id, created_at desc);

create index quest_proofs_user_created_idx
  on public.quest_proofs (user_id, created_at desc);

create index quest_completions_user_completed_idx
  on public.quest_completions (user_id, completed_at desc);

create trigger quest_instances_set_updated_at
before update on public.quest_instances
for each row execute function public.set_updated_at();

create trigger quest_instances_protect_snapshot
before update on public.quest_instances
for each row execute function public.protect_quest_instance_snapshot();

create trigger quest_proofs_set_updated_at
before update on public.quest_proofs
for each row execute function public.set_updated_at();

create trigger quest_proofs_validate_owner
before insert or update of quest_instance_id, user_id on public.quest_proofs
for each row execute function public.validate_quest_proof_owner();

create trigger user_progress_set_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

create trigger quest_completions_prevent_update
before update on public.quest_completions
for each row execute function public.prevent_immutable_record_update();

create trigger xp_ledger_prevent_update
before update on public.xp_ledger
for each row execute function public.prevent_immutable_record_update();
