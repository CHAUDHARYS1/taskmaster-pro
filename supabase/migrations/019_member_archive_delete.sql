-- Allow members (not just owners) to permanently delete individual archived tasks.
-- Bulk archive operations (archive_workspace_done RPC) remain owner-only.

drop policy if exists "owners can delete archives" on public.archived_tasks;

create policy "members can delete archives"
  on public.archived_tasks for delete
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = archived_tasks.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'member')
    )
  );
