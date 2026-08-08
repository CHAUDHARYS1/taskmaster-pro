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
- **Keyboard shortcuts** — full cheatsheet below; press `?` in-app to view
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

## Quality of Life Updates

### QoL 1
- **Collaborative editing lock** — task cards glow in the editing user's unique color with their initials badge while another user has the panel open; the card is unclickable and un-draggable for others; lock clears instantly via Supabase Broadcast (no page reload required)
- **List view** — toggle between Kanban board (⊞) and flat table view (☰) from the board header; editing lock indicators appear in both views
- **Bug report / feature request** — bell icon in the header opens a bottom sheet that submits directly to GitHub Issues via a Netlify function (`netlify/functions/create-github-issue.js`); requires `GITHUB_TOKEN` env var in Netlify and a `user-report` label in the repo
- **Signup name capture** — first and last name fields on registration; stored in `profiles` via Supabase trigger; used throughout the UI instead of email addresses
- **Expanded keyboard shortcuts** — `D` dark mode, `F` filter bar, `B`/`L` view toggle, `←`/`→` prev/next task in panel, `Del` delete open task (owners)

### QoL 2
- **Assignee avatar color** — the assignee bubble on task cards uses the same deterministic color as that user's presence avatar (derived from `src/lib/userColor.js`)
- **Sidebar user identity** — logged-in user's avatar (in their unique color) and display name shown above the sign-out button in the sidebar footer
- **Quick-complete button** — a ✓ button appears on task card hover (board and list view) to instantly move a task to Done without opening the detail panel; shows a toast confirmation

### QoL 3
- **Drag glow fix** — editing lock glow now persists correctly on task cards while dragging to a new column; the DragOverlay card receives the live `editingUser` prop and the dragging ghost stays fully opaque when locked
- **Drag handle indicator** — a 6-dot grip icon appears on the left edge of task cards on hover, giving clear affordance that cards are draggable; automatically hidden on locked cards
- **Color-coded column counts** — the task count badge in each column header is color-coded: blue for In Progress, amber for In Review, green for Done
- **Profile settings** — click the user row in the sidebar footer to open a Profile Settings modal; edit first and last name inline without leaving the board; changes persist to Supabase and update the display name everywhere immediately

### QoL 4
- **Calendar** — full calendar view (month / week / day) accessible from the sidebar and the board header view toggle; tasks with due dates appear as color-coded event chips; click any chip to open the task detail panel
- **Dashboard** — analytics page per workspace: current streak, activity heatmap (with year selector), status breakdown bar, recent completions list, and a quick-add form to create tasks without leaving the dashboard
- **Writes** — lightweight per-workspace document editor built on Tiptap; supports rich text (bold, italic, lists, headings, blockquotes, links); auto-saves, per-doc shareable URLs (`/writes/:id`), and PDF export
- **Doc linking** — link any Writes document to a task from the detail panel; linked docs appear as chips and open in an inline drawer without navigating away from the board
- **Quick links** — pin any URL as a favicon shortcut in the sidebar footer for fast one-click access to external tools; tooltips show title and URL on hover
- **Auto-logout** — idle session timeout after inactivity with an amber warning banner before signing out automatically
- **Print board** — print the current board state (with filters applied) directly from the board header toolbar; generates a clean print-optimised HTML page

### QoL 5
- **Task checklist** — add sub-tasks as a checklist inside the task detail panel; a thin progress bar and `x/y` count badge appear on the card when items exist
- **Task reminders** — set a specific due time alongside the due date; a toast fires at the exact moment with snooze (15 min / 1 hr), Move to Done, and dismiss actions, plus a chime sound on completion
- **Inline quick-add** — type-and-submit form pinned to the top of the To Do column; a slide-down description field expands on focus, no modal required
- **Monday motivation modal** — shown once per week on Monday mornings; displays tasks completed the previous week as a bar chart alongside a motivational message
- **Rename columns** — workspace owners can rename any status column (To Do, In Progress, In Review, Done) from the Workspace Settings modal; custom labels persist per workspace
- **Fluid kanban columns** — board columns expand equally to fill all available horizontal space; no wasted whitespace on wide monitors
- **Always-visible member avatars** — all workspace member avatars are shown in the board header (not just currently-online members); online status is indicated by a green dot
- **Rename workspace** — workspace owners can edit the workspace name inline from the Settings → General tab without leaving the board

### v1.2.0 — Mobile & Polish
- **Mobile-first layout pass** — dashboard stacks form panel and stats vertically with a single scroll; Writes shows a compact 220px doc list above the editor; Calendar week view scrolls horizontally at 100px per column; List view wraps in a horizontal scroll container; board header right-side controls tightened to fit 390px screens (print button hidden on mobile)
- **CSS token resolution** — 13 undefined CSS custom property tokens (`--border`, `--shadow`, `--paper-1`, `--ink-faint`, `--font-base`, `--accent-muted`, `--danger`, `--danger-bg`, and more) aliased to their correct values, fixing broken styles in the calendar, checklist, writes editor, and workspace settings across light and dark mode
- **Dark mode Writes editor fix** — the writing canvas was hardcoded to `#fff`; now uses `var(--card)` so it respects the active theme
- **Focus ring dark mode** — `--accent-muted` now has a correct dark-mode value so input focus glows render in the right blue tint instead of the light-mode colour

---

## Keyboard Shortcuts

Press `?` anywhere on the board to see the in-app cheatsheet.

| Key | Action |
|---|---|
| **Navigation** | |
| `Ctrl + N` | Add a new task |
| `/` | Focus the search bar |
| `Ctrl + B` | Switch to Board view |
| `Ctrl + L` | Switch to List view |
| `Ctrl + G` | Switch to Gantt view |
| `?` | Toggle the shortcuts cheatsheet |
| `Esc` | Close the open panel, modal, or sheet |
| **Board** | |
| `Ctrl + D` | Toggle dark / light mode |
| `Ctrl + F` | Focus the filter bar |
| `Del` | Delete the currently-open task *(owners only — shows confirmation)* |
| **Task panel** | |
| `←` | Open the previous task |
| `→` | Open the next task |
| `Enter` | Submit a comment |
| `Shift + Enter` | New line inside a comment |
| `Ctrl + Shift + A` | Archive the open task |

---

### 🔜 Phase 7 — Scale & Monetise

- **Stripe integration** — paid team plan (unlimited workspaces, more members)
- **Supabase Pro** — upgrade at $25/mo as user base grows
- **Workspace analytics** — task throughput, cycle time, member activity dashboard for owners
