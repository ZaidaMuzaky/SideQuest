-- SQ-0005: make the private Storage authorization boundary explicit using
-- supported grants. Supabase owns storage.objects and manages its RLS state;
-- migrations must not alter that table's ownership or RLS flag.
-- Deny direct object mutations and anonymous reads by privilege. Owner
-- upload/read behavior remains governed by the existing Storage policies.
revoke update, delete, select on table storage.objects from public, anon;
revoke update, delete on table storage.objects from authenticated;
