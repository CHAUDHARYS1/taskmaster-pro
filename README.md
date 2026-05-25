# Taskmaster Pro

A real-time collaborative Kanban board with multi-user team workspaces, built with React + Supabase.

---

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Drag & Drop | dnd-kit |
| Backend / DB | Supabase (Postgres) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Dates | dayjs |
| Styling | CSS custom properties (design system tokens — no Bootstrap) |
| Hosting | Netlify (frontend) + Supabase (backend) |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your Supabase credentials
cp .env.example .env

# 3. Start dev server
npm run dev
```

### Supabase setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Run `supabase/migrations/002_phase2_teams.sql` in the SQL Editor
4. Enable Realtime on the `tasks` table: Database → Replication → toggle `tasks`
5. Copy Project URL + anon key into `.env`

---

## Architecture

```
src/
├── lib/supabase.js              Supabase client (reads from .env)
├── contexts/
│   ├── AuthContext.jsx          Session state, signUp/signIn/signOut
│   └── WorkspaceContext.jsx     Active workspace, workspace list, userRole
├── hooks/
│   ├── useTasks.js              Real-time CRUD + Realtime subscription
│   └── useMembers.js            Members list, invite, remove
└── components/
    ├── auth/AuthPage.jsx        Login + signup
    ├── board/                   Board, Column, TaskCard, AddTaskModal
    ├── layout/Sidebar.jsx       Workspace switcher, members, invite, sign out
    └── workspace/               WorkspaceSwitcher, CreateWorkspaceModal,
                                 InviteModal, MembersList, AcceptInvitePage
```

**Data model**
- `workspaces` — personal or team boards. Personal workspace `id = user.id` (auto-created on signup).
- `workspace_members` — join table with `role` (`owner` | `member` | `viewer`).
- `tasks` — belong to a workspace, not a user. Fields: `text`, `due_date`, `status`, `position`.
- `invitations` — token-based invite links with 7-day expiry.
- `profiles` — public email store for displaying member info.

**Real-time flow**
```
User action → optimistic UI update → Supabase write
                                           ↓
                              Realtime broadcasts change
                                           ↓
                         All connected clients update instantly
```

**Role enforcement**
- `viewer` — read-only board, no drag/edit/delete, sees a banner
- `member` — full task CRUD within the workspace
- `owner` — member permissions + can invite/remove members, rename workspace

---

## Design System

Tokens live in `design-system/tokens.md`. All colors, spacing, typography, radius, and shadows are CSS custom properties defined in `src/index.css`. **Never hard-code a value that isn't in the token file.**

Key tokens: `--accent` (#2563EB), `--font-body` (IBM Plex Sans), `--font-mono` (IBM Plex Mono), `--bg` (#f5f5f7), `--card` (#fff).

---

## Roadmap

### ✅ Done

**Design system** (`feature/design-system`)
- IBM Plex Sans + Mono fonts, full CSS token system
- Light theme: white sidebar, warm gray board, accent-blue buttons
- Replaced Bootstrap gradients with flat design system components

**Phase 1 — Foundation** (`feature/phase1-react-supabase`)
- React + Vite replacing vanilla JS / jQuery / Bootstrap
- Supabase auth (sign up, sign in, sign out)
- Personal workspace auto-created on signup
- Real-time task board (INSERT / UPDATE / DELETE sync across tabs)
- dnd-kit drag-and-drop between columns
- Inline task editing, due date urgency (overdue → red, due soon → amber)

**Phase 2 — Teams** (`feature/phase2-teams`)
- Create team workspaces, switch between them in sidebar
- Invite members via shareable token link (7-day expiry)
- Accept invite page (`/invite/:token`) with auth redirect
- Members list with roles; owner can remove members
- Role enforcement: viewers get read-only board
- Fixed RLS infinite recursion via `get_my_workspace_ids()` security definer fn

---

### ✅ Phase 3 — Ship it + Notifications

**Goal:** make the app publicly accessible and add a communication layer.

- **Netlify deployment** — connect GitHub repo, set env vars in Netlify dashboard, auto-deploy on push to `main`
- **Real invite emails** — Supabase Edge Function + Resend (free 100 emails/day) so invites arrive in inbox instead of requiring copy-paste
- **Due date reminders** — scheduled Edge Function checks tasks due in 24 hours, emails workspace members
- **Presence indicators** — show avatar bubbles of who's currently viewing the board using Supabase Broadcast/Presence

---

### ✅ Phase 4 — Richer Tasks

**Goal:** make individual tasks actually useful beyond text + due date.

- **Task detail panel** — click a task to open a side panel with full description, comments thread, and activity log
- **Assignees** — assign tasks to specific workspace members
- **Labels / tags** — colour-coded labels (Bug, Feature, Design, etc.)
- **Priority** — Low / Medium / High / Urgent with visual indicators
- **Within-column ordering** — persist drag-and-drop position inside a column using fractional indexing
- **Filter + search** — filter board by assignee, label, priority, or due date; full-text search across tasks

---

### ✅ Phase 5 — Refinement

**Goal:** polish the app into something genuinely pleasant to use every day.

- **Toast notifications** — success/error feedback for actions (currently silent)
- **Status + due date editing in panel** — change a task's column and due date from the detail panel, not just the board
- **Empty states** — helpful UI for empty columns and new workspaces
- **Keyboard shortcuts** — `N` new task, `Esc` close, `/` focus search, `?` cheatsheet
- **Loading skeletons** — shimmer skeleton matching full board layout
- **Mobile responsiveness** — off-canvas sidebar drawer, scroll-snap column carousel, bottom-sheet panel
- **Dark mode** — full token set, system preference detection, flash-prevention script, sidebar toggle

---

### 🔜 Phase 6 — Go Live

**Goal:** get the app fully working in production, end-to-end.

#### A. Netlify (frontend hosting)
1. Go to [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git → pick this repo
2. Build command: `npm run build` · Publish directory: `dist` (auto-detected from `netlify.toml`)
3. **Environment variables** (Site settings → Environment variables):
   - `VITE_SUPABASE_URL` = `https://ugejeysmqqkyeefdqwao.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(your anon key from `.env`)*
4. Deploy — live at **https://taskmaster12.netlify.app**

#### B. Supabase auth redirect URLs
1. Supabase dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**: `https://taskmaster12.netlify.app/**`
3. Set **Site URL** to `https://taskmaster12.netlify.app`

#### C. Database migrations (if not yet applied)
Run in Supabase dashboard → SQL Editor in order:
- `supabase/migrations/004_phase4_task_detail.sql`
- `supabase/migrations/005_phase4_assignees.sql`
- `supabase/migrations/006_phase4_labels.sql`
- `supabase/migrations/007_phase4_priority.sql`

*(Skip any already applied — they use `if not exists` guards.)*

#### D. Edge Functions + email (Resend)
1. Sign up at [resend.com](https://resend.com), create an API key
2. Install CLI and link project:
   ```
   npm install -g supabase
   supabase login
   supabase link --project-ref ugejeysmqqkyeefdqwao
   ```
3. Set secrets (replace values):
   ```
   supabase secrets set RESEND_API_KEY=re_your_key
   supabase secrets set CRON_SECRET=any-random-string
   supabase secrets set APP_URL=https://taskmaster12.netlify.app
   ```
4. Deploy functions:
   ```
   supabase functions deploy send-invite-email
   supabase functions deploy send-due-reminders
   ```
5. For sending to non-owner emails: verify a custom domain in Resend and update `from` in `supabase/functions/send-invite-email/index.ts`

#### E. Activate due-date reminders (pg_cron)
1. Open `supabase/migrations/003_phase3_cron.sql`
2. Replace `<your-cron-secret>` with the `CRON_SECRET` value from step D
3. Run the file in Supabase SQL Editor

#### F. Smoke test checklist
- [ ] Sign up with a new account
- [ ] Create a workspace, add tasks, drag between columns
- [ ] Invite a second user — check invite email arrives
- [ ] Accept invite, verify role enforcement (viewer vs member)
- [ ] Open board in two browser tabs — confirm real-time sync
- [ ] Toggle dark mode, reload — confirm preference is remembered

---

### 🔜 Phase 7 — Scale & Monetise

- **Stripe integration** — paid team plan (unlimited workspaces, more members)
- **Supabase Pro** — upgrade at $25/mo as user base grows
- **Workspace analytics** — task throughput, cycle time, member activity dashboard for owners
