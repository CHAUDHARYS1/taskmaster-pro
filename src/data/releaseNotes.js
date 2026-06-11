export const RELEASES = [
  {
    version: '1.2.00',
    date: 'June 2026',
    current: true,
    features: [
      {
        title: 'Quick Links',
        body: 'Add up to 4 workspace-specific bookmarks accessible directly from the board header. Site favicons are fetched automatically; you can also set an emoji icon. Links open in a new tab and are saved per workspace — different workspaces can have different toolkits.',
        image: '/screenshots/quick-links.png',
        imageAlt: 'Quick Links popover showing four link tiles: Figma, Notion, GitHub, and Staging',
      },
      {
        title: 'Workspace Identity Chip',
        body: 'Replaced the thin colored strip above the board header with a compact workspace avatar and name chip. You always know which workspace you\'re in at a glance — the colored square builds recognition over time the same way a tab color does.',
        image: '/screenshots/workspace-chip.png',
        imageAlt: 'Board header showing a purple workspace avatar with the name "Side Projects / Design Sprint Q2"',
      },
      {
        title: 'Notification Center Improvements',
        body: 'Notification center rebuilt as a floating popover off the bell icon in the header. Includes a full activity feed and per-workspace notification preferences so you can tune how and when you\'re alerted.',
        image: '/screenshots/notification-center.png',
        imageAlt: 'Notification center popover showing unread and read activity items',
      },
    ],
    fixes: [
      {
        title: 'Assignee shows immediately after selection',
        body: 'Previously, assigning a task required a page reload before the assignee\'s name appeared on the card. The assignee now updates instantly without any refresh.',
        image: '/screenshots/assignee-update.png',
        imageAlt: 'Task card detail panel showing an assignee selected and confirmed with a checkmark',
      },
      {
        title: 'Priority label backgrounds adapt to dark mode',
        body: 'Priority chip backgrounds were previously hard-coded colors that looked washed out on dark card surfaces. They now use CSS color-mix to produce solid, theme-adaptive backgrounds in both light and dark mode.',
        image: '/screenshots/priority-labels.png',
        imageAlt: 'Four priority chips — Low, Medium, High, Urgent — shown with solid theme-adaptive backgrounds',
      },
      {
        title: 'Ctrl+Shift+A keyboard shortcut',
        body: 'The shortcut for opening assignee filter was silently failing when Shift was held because browser key events return uppercase letters. Key normalization now handles this correctly.',
      },
      {
        title: 'CSS duplicate column label rules removed',
        body: 'A duplicate block of column label and column count styles was causing specificity conflicts. Consolidated into a single canonical rule.',
      },
    ],
    hotfixes: [],
  },
  {
    version: '1.1.00',
    date: 'April 2026',
    current: false,
    features: [
      {
        title: 'Notification Center',
        body: 'Bell icon in the header with toast notifications for approaching due dates, task assignments, and workspace activity. Notifications are grouped by workspace and marked read as you view them.',
      },
      {
        title: 'Task Reminders',
        body: 'Browser push notifications when tasks are due soon. Configurable lead time — you choose how early you want the heads-up.',
      },
      {
        title: 'Recurring Tasks',
        body: 'Set tasks to repeat on a daily, weekly, or monthly schedule. A recurring indicator appears on the card. Snoozed reminders reset automatically when the next cycle begins.',
      },
      {
        title: 'Board Templates',
        body: 'Pre-built workspace templates (including Job Tracker) so new workspaces start with the right column names, labels, and settings out of the box.',
      },
      {
        title: 'Dashboard',
        body: 'High-level overview of your open tasks, what\'s due today, what\'s overdue, and task counts by status — across all projects in a workspace.',
      },
      {
        title: 'Task Checklists',
        body: 'Add a to-do list inside any task. Progress is shown as a fraction on the card so you can track completion without opening the detail panel.',
      },
      {
        title: 'Documents',
        body: 'Attach rich-text documents to tasks. Full formatting support via the built-in editor.',
      },
      {
        title: 'User Preferences',
        body: 'Choose between compact and expanded card density, and set your preferred date format. Preferences are saved per user and apply across all workspaces.',
      },
    ],
    fixes: [
      {
        title: 'Archive performance on large workspaces',
        body: 'Querying and restoring archived tasks was slow when the archive held hundreds of entries. Now paginated and significantly faster.',
      },
      {
        title: 'Calendar view stability',
        body: 'Calendar occasionally failed to render when navigating between months rapidly. Root cause was a stale closure in the month-change handler.',
      },
      {
        title: 'Drag-and-drop on iOS Safari',
        body: 'Touch drag events were not reliably firing on iOS 17. Updated pointer event configuration to handle touch correctly.',
      },
    ],
    hotfixes: [],
  },
  {
    version: '1.0.0',
    date: 'February 2026',
    current: false,
    features: [
      {
        title: 'Kanban Board',
        body: 'Four-column board (To Do → In Progress → In Review → Done) with drag-and-drop reordering within and across columns. Tasks remember their position.',
        image: '/screenshots/board-overview.png',
        imageAlt: 'Kanban board showing four columns with task cards, priority chips, assignees, and due dates',
      },
      {
        title: 'Task Priorities & Due Dates',
        body: 'Assign Low, Medium, High, or Urgent priority to any task. Due dates show relative labels (Today, Tomorrow, 3d) and cards change color when overdue.',
      },
      {
        title: 'Multi-Workspace Support',
        body: 'Create multiple workspaces — personal, team, or client — and switch between them instantly. Each workspace is fully independent.',
      },
      {
        title: 'Projects',
        body: 'Organize tasks inside a workspace into projects. Projects have their own color and can restrict which columns are visible.',
      },
      {
        title: 'Member Invitations & Roles',
        body: 'Invite collaborators by email. Members get full edit access; viewers can see the board but not modify tasks; only the owner can manage workspace settings.',
      },
      {
        title: 'Labels',
        body: 'Create custom colored labels per workspace. Apply multiple labels to a task and filter the board by label.',
      },
      {
        title: 'List View & Calendar View',
        body: 'Switch between the default kanban board, a flat list view for scanning all tasks, and a calendar view for visualizing tasks by due date.',
      },
      {
        title: 'Real-Time Collaboration',
        body: 'Changes made by any member are reflected live for everyone on the same board — no refresh required. Presence avatars show who\'s currently active.',
      },
      {
        title: 'Keyboard Shortcuts',
        body: 'Common actions (new task, open search, switch view, toggle theme) are accessible from the keyboard. Full shortcut reference in the sidebar footer.',
      },
      {
        title: 'Light & Dark Mode',
        body: 'Full theme support. Follows your system preference by default; toggle manually at any time.',
      },
    ],
    fixes: [],
    hotfixes: [],
  },
]
