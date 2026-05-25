# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start of every session

**Read `README.md` first.** It contains the current stack, architecture, data model, design system rules, and the full roadmap (what's done and what's next). Do not start any work without reading it.

## Running the App

No build step — open `index.html` directly in a browser, or serve it with any static file server:

```
npx serve .
# or
python -m http.server 8080
```

Deployed to GitHub Pages: https://chaudharys1.github.io/taskmaster-pro/

## Stack

Vanilla HTML/CSS/JS with no bundler, no npm, no backend. All dependencies load from CDN in `index.html`:

- **Bootstrap 4.3.1** — layout and base components
- **jQuery 3.4.1 + jQuery UI 1.12.1** — DOM manipulation, drag-and-drop sortable, datepicker
- **jQuery UI Touch Punch** — enables jQuery UI drag-and-drop on mobile
- **Moment.js 2.24.0** — due-date parsing and urgency checks
- **Open Iconic** — icons

## Architecture

```
index.html          → HTML shell + CDN deps + 4 kanban column <ul>s + modal form
assets/js/script.js → all application logic (~299 lines)
assets/css/style.css → custom styles on top of Bootstrap (~73 lines)
```

**Data flow:**
```
User action → jQuery handler → mutate tasks{} → saveTasks() → localStorage
Page load   → loadTasks()   → tasks{}        → createTask() → DOM render
```

**State** is a single `tasks` object with four arrays (`toDo`, `inProgress`, `inReview`, `done`), each holding `{ text, date }` entries. It is serialized to `localStorage["tasks"]` on every change.

**Key functions in script.js:**

| Function | Purpose |
|---|---|
| `loadTasks()` | Hydrate `tasks` from localStorage on page load (line 293) |
| `saveTasks()` | Persist `tasks` to localStorage |
| `createTask(text, date, list)` | Build task DOM element and attach event listeners |
| `auditTask(el)` | Apply `.list-group-item-danger` (overdue) or `-warning` (due within 1 day) |

**Urgency colors** are re-evaluated every 30 minutes via `setInterval` at the bottom of `script.js`.

**Drag-and-drop** uses jQuery UI Sortable with `connectWith` linking all four column lists. The trash zone at the bottom uses a separate droppable target.

## Columns

Each kanban column is `<ul id="list-{status}">` where status is `toDo`, `inProgress`, `inReview`, or `done`. The mapping between DOM IDs and the `tasks` object keys is maintained manually in the event handlers.
