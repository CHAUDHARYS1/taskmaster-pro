-- ─────────────────────────────────────────────────────────────────
-- Migration 008 · User names on profiles
-- Adds first_name / last_name to profiles so the app can show real
-- names instead of email addresses throughout the UI.
-- ─────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name  text;

-- Allow users to update their own profile
do $$ begin
  create policy "users can update own profile"
    on public.profiles for update
    using (id = auth.uid())
    with check (id = auth.uid());
exception when duplicate_object then null;
end $$;

-- Update the signup trigger to pull names from user_metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.workspaces (id, name, owner_id)
  values (new.id, 'My Workspace', new.id);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.id, 'owner');

  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Rebuild the members view to expose names alongside email
create or replace view public.workspace_members_view as
select
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.joined_at,
  p.email,
  p.first_name,
  p.last_name
from public.workspace_members wm
join public.profiles p on p.id = wm.user_id;
