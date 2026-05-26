-- Migration 012: allow owners to delete team workspaces
-- Personal workspaces (id = owner_id) are protected and cannot be deleted.

create policy "owners can delete team workspaces"
  on public.workspaces for delete
  using (
    owner_id = auth.uid()
    and id != owner_id   -- block personal workspace deletion
  );
