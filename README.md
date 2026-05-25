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
| Hosting (planned) | Netlify (frontend) + Supabase (backend) |

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

### 🔜 Phase 6 — Scale & Monetise

- **Stripe integration** — paid team plan (unlimited workspaces, more members)
- **Supabase Pro** — upgrade at $25/mo as user base grows
- **Workspace analytics** — task throughput, cycle time, member activity dashboard for owners
