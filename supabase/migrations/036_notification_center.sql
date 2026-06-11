-- ─────────────────────────────────────────────────────────────────────────────
-- 036_notification_center
-- notifications table + per-user preferences
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Notifications ─────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  workspace_id uuid        references public.workspaces(id) on delete cascade,
  type         text        not null,
  title        text        not null,
  body         text,
  task_id      uuid        references public.tasks(id) on delete set null,
  actor_id     uuid        references auth.users(id) on delete set null,
  read         boolean     not null default false,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_created
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- Users read / update / delete only their own rows
create policy "notif_select" on public.notifications
  for select using (auth.uid() = user_id);

-- Any authenticated user may insert (to notify teammates)
create policy "notif_insert" on public.notifications
  for insert with check (auth.uid() is not null);

create policy "notif_update" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notif_delete" on public.notifications
  for delete using (auth.uid() = user_id);

-- ── Notification preferences ───────────────────────────────────────────────────

create table if not exists public.notification_preferences (
  user_id            uuid    primary key references auth.users(id) on delete cascade,
  task_assigned      boolean not null default true,
  task_moved         boolean not null default true,
  task_completed     boolean not null default false,
  comment_added      boolean not null default true,
  mention            boolean not null default true,
  due_soon           boolean not null default true,
  overdue            boolean not null default true,
  member_joined      boolean not null default true,
  member_removed     boolean not null default true,
  workspace_renamed  boolean not null default false
);

alter table public.notification_preferences enable row level security;

create policy "notif_prefs_all" on public.notification_preferences
  for all using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table public.notifications;
