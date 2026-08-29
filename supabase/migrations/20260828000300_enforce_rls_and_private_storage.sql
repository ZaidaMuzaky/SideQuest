-- SQ-0005: server-authoritative row ownership, approved catalog access,
-- and private proof/avatar Storage boundaries. Workflow RPCs are deferred.

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.quest_templates enable row level security;
alter table public.quest_searches enable row level security;
alter table public.quest_instances enable row level security;
alter table public.quest_proofs enable row level security;
alter table public.quest_completions enable row level security;
alter table public.user_progress enable row level security;
alter table public.xp_ledger enable row level security;

revoke all on table
  public.profiles,
  public.user_preferences,
  public.categories,
  public.locations,
  public.quest_templates,
  public.quest_searches,
  public.quest_instances,
  public.quest_proofs,
  public.quest_completions,
  public.user_progress,
  public.xp_ledger
from public, anon, authenticated;

grant select on table
  public.profiles,
  public.user_preferences,
  public.quest_searches,
  public.quest_instances,
  public.quest_proofs,
  public.quest_completions,
  public.user_progress,
  public.xp_ledger
to authenticated;

grant update (display_name, avatar_path, onboarding_completed_at)
  on table public.profiles to authenticated;

grant update (
  default_time,
  default_budget,
  default_mood,
  default_distance,
  theme
) on table public.user_preferences to authenticated;

create policy profiles_owner_select
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_owner_update
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    avatar_path is null
    or avatar_path ~ ('^' || (select auth.uid())::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
      || '\.(jpg|jpeg|png|webp|heic|heif)$')
  )
);

create policy user_preferences_owner_select
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_preferences_owner_update
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy quest_searches_owner_select
on public.quest_searches
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy quest_instances_owner_select
on public.quest_instances
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy quest_proofs_owner_select
on public.quest_proofs
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy quest_completions_owner_select
on public.quest_completions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_progress_owner_select
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy xp_ledger_owner_select
on public.xp_ledger
for select
to authenticated
using ((select auth.uid()) = user_id);

-- The client receives only safe catalog columns. Base-table column grants are
-- required because this security-invoker view evaluates permissions and RLS as
-- the caller rather than as the migration owner.
grant select (id, slug, name_key, is_enabled)
  on table public.categories to authenticated;

grant select (
  id,
  name,
  area_code,
  latitude,
  longitude,
  address,
  external_map_url,
  timezone,
  availability_json,
  is_enabled
) on table public.locations to authenticated;

grant select (
  id,
  template_family_id,
  version,
  category_id,
  title,
  description,
  instructions,
  duration_min,
  duration_max,
  estimated_cost_min,
  estimated_cost_max,
  currency_code,
  difficulty,
  base_xp,
  location_mode,
  area_codes,
  location_id,
  physical_demand,
  safety_notes,
  availability_json,
  moderation_status,
  enabled_at,
  disabled_at
) on table public.quest_templates to authenticated;

create policy categories_enabled_select
on public.categories
for select
to authenticated
using (is_enabled);

create policy locations_enabled_select
on public.locations
for select
to authenticated
using (is_enabled);

create policy quest_templates_approved_enabled_select
on public.quest_templates
for select
to authenticated
using (
  moderation_status = 'approved'
  and enabled_at is not null
  and enabled_at <= now()
  and (disabled_at is null or disabled_at > now())
  and exists (
    select 1
    from public.categories as category
    where category.id = quest_templates.category_id
      and category.is_enabled
  )
  and (
    location_id is null
    or exists (
      select 1
      from public.locations as location
      where location.id = quest_templates.location_id
        and location.is_enabled
    )
  )
);

create view public.approved_quest_catalog
with (security_invoker = true, security_barrier = true)
as
select
  template.id,
  template.template_family_id,
  template.version,
  category.slug as category_slug,
  category.name_key as category_name_key,
  template.title,
  template.description,
  template.instructions,
  template.duration_min,
  template.duration_max,
  template.estimated_cost_min,
  template.estimated_cost_max,
  template.currency_code,
  template.difficulty,
  template.base_xp,
  template.location_mode,
  template.area_codes,
  template.physical_demand,
  template.safety_notes,
  template.availability_json,
  location.id as location_id,
  location.name as location_name,
  location.area_code as location_area_code,
  location.latitude as location_latitude,
  location.longitude as location_longitude,
  location.address as location_address,
  location.external_map_url,
  location.timezone as location_timezone,
  location.availability_json as location_availability_json
from public.quest_templates as template
join public.categories as category on category.id = template.category_id
left join public.locations as location on location.id = template.location_id;

revoke all on table public.approved_quest_catalog from public, anon;
grant select on table public.approved_quest_catalog to authenticated;

comment on view public.approved_quest_catalog is
  'SQ-0005 security-invoker view exposing approved, currently enabled catalog content only.';

-- Trigger helpers are not client APIs. PostgreSQL grants function execution to
-- PUBLIC by default, so remove that implicit capability before later RPC work.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.protect_quest_template_content() from public, anon, authenticated;
revoke execute on function public.protect_quest_instance_snapshot() from public, anon, authenticated;
revoke execute on function public.validate_quest_proof_owner() from public, anon, authenticated;
revoke execute on function public.prevent_immutable_record_update() from public, anon, authenticated;

revoke all on table storage.objects, storage.buckets from public, anon, authenticated;
grant select, insert on table storage.objects to authenticated;

insert into storage.buckets (id, name, public)
values
  ('quest-proofs', 'quest-proofs', false),
  ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

create policy quest_proofs_owner_active_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quest-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ ('^' || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
    || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
    || '\.(jpg|jpeg|png|webp|heic|heif)$')
  and exists (
    select 1
    from public.quest_instances as instance
    where instance.id::text = (storage.foldername(name))[2]
      and instance.user_id = (select auth.uid())
      and instance.status = 'active'
  )
);

create policy quest_proofs_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'quest-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    exists (
      select 1
      from public.quest_proofs as proof
      where proof.user_id = (select auth.uid())
        and proof.storage_path = name
        and proof.status = 'uploaded'
    )
    or (
      name ~ ('^' || (select auth.uid())::text
        || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
        || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
        || '\.(jpg|jpeg|png|webp|heic|heif)$')
      and exists (
        select 1
        from public.quest_instances as instance
        where instance.id::text = (storage.foldername(name))[2]
          and instance.user_id = (select auth.uid())
          and instance.status = 'active'
      )
    )
  )
);

create policy avatars_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ ('^' || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
    || '\.(jpg|jpeg|png|webp|heic|heif)$')
);

create policy avatars_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
