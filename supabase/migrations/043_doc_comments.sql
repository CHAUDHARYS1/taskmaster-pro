-- ─────────────────────────────────────────────────────────────────────────────
-- 043_doc_comments
-- Inline document comments with threaded replies (Google Docs-style)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Comment threads ──────────────────────────────────────────────────────────

create table if not exists public.doc_comments (
  id           uuid        primary key default gen_random_uuid(),
  doc_id       uuid        not null references public.documents(id) on delete cascade,
  created_by   uuid        not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  quote        text,                                     -- text snapshot at comment time
  resolved     boolean     not null default false,
  resolved_by  uuid        references auth.users(id),
  resolved_at  timestamptz
);

create index if not exists doc_comments_doc_id on public.doc_comments(doc_id);

alter table public.doc_comments enable row level security;

-- Any workspace member who has access to the doc may read comments
create policy "doc_comments_select" on public.doc_comments
  for select using (
    exists (
      select 1 from public.documents d
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = doc_comments.doc_id and wm.user_id = auth.uid()
    )
  );

create policy "doc_comments_insert" on public.doc_comments
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.documents d
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = doc_id and wm.user_id = auth.uid()
    )
  );

-- Any workspace member may resolve comments (not just the author)
create policy "doc_comments_update" on public.doc_comments
  for update using (
    exists (
      select 1 from public.documents d
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = doc_comments.doc_id and wm.user_id = auth.uid()
    )
  );

-- ── Comment messages (first post + replies) ──────────────────────────────────

create table if not exists public.comment_messages (
  id           uuid        primary key default gen_random_uuid(),
  comment_id   uuid        not null references public.doc_comments(id) on delete cascade,
  created_by   uuid        not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  body         text        not null
);

create index if not exists comment_messages_comment_id on public.comment_messages(comment_id);

alter table public.comment_messages enable row level security;

create policy "comment_messages_select" on public.comment_messages
  for select using (
    exists (
      select 1 from public.doc_comments dc
      join public.documents d on d.id = dc.doc_id
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where dc.id = comment_messages.comment_id and wm.user_id = auth.uid()
    )
  );

create policy "comment_messages_insert" on public.comment_messages
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.doc_comments dc
      join public.documents d on d.id = dc.doc_id
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where dc.id = comment_id and wm.user_id = auth.uid()
    )
  );

-- ── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.doc_comments;
alter publication supabase_realtime add table public.comment_messages;
