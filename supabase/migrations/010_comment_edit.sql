-- Migration 010: allow comment editing
-- Adds updated_at to comments, an auto-update trigger, and an RLS update policy.

alter table public.comments
  add column if not exists updated_at timestamptz default now();

-- Keep updated_at current on every edit
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger comments_updated_at
    before update on public.comments
    for each row execute procedure public.set_updated_at();
exception when duplicate_object then null;
end $$;

-- RLS: authors can update their own comments
do $$ begin
  create policy "users can update their own comments"
    on public.comments for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;
