import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'screenshots')
mkdirSync(outDir, { recursive: true })

const TOKENS = `
  --bg:#f5f5f7;--card:#fff;--surface:#fafafa;--paper:#fafafa;--paper-2:#f0f0f2;--paper-3:#e8e8ec;
  --ink:#1a1a1a;--ink-2:#444;--ink-3:#666;--ink-4:#888;--ink-faint:#888;
  --line:#eee;--border:#eee;
  --accent:#2563EB;--accent-2:#1D4ED8;--accent-tint:rgba(37,99,235,.10);
  --green:#15803d;--red:#b91c1c;--amber:#92400e;
  --radius:5px;--radius-sm:3px;--radius-lg:8px;
  --shadow-card:0 1px 3px rgba(0,0,0,.06),0 0 0 1px rgba(0,0,0,.04);
  --shadow-float:0 12px 40px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06);
  --space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;
`

const BASE = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:13px;color:#1a1a1a;background:transparent;-webkit-font-smoothing:antialiased}
    :root{${TOKENS}}
  </style>
`

const PAGES = {
  'workspace-chip': {
    width: 680, height: 60,
    html: `<!DOCTYPE html><html><head>${BASE}</head><body>
<div style="background:#fff;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:60px">
  <div style="display:flex;align-items:center;gap:10px">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:24px;height:24px;border-radius:3px;background:#7c3aed;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">S</span>
      <span style="font-size:13px;font-weight:600;color:#1a1a1a">Side Projects <span style="color:#888;font-weight:400;font-size:11px"> / Design Sprint Q2</span></span>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:8px">
    <div style="display:flex;gap:-6px">
      <div style="width:26px;height:26px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700">SC</div>
      <div style="width:26px;height:26px;border-radius:50%;background:#8b5cf6;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;margin-left:-6px">JR</div>
    </div>
    <button style="background:none;border:none;cursor:pointer;color:#666;padding:6px;border-radius:5px;display:flex">
      <svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="32" y="48" width="72" height="72" rx="8"/><rect x="152" y="48" width="72" height="72" rx="8"/><rect x="32" y="168" width="72" height="72" rx="8"/><rect x="152" y="168" width="72" height="72" rx="8"/></svg>
    </button>
    <button style="background:none;border:none;cursor:pointer;color:#666;padding:6px;border-radius:5px;display:flex">
      <svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><line x1="128" y1="80" x2="128" y2="128"/><line x1="128" y1="128" x2="160" y2="160"/></svg>
    </button>
    <button style="background:none;border:none;cursor:pointer;color:#666;padding:6px;border-radius:5px;display:flex">
      <svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><line x1="88" y1="128" x2="168" y2="128"/><line x1="88" y1="96" x2="168" y2="96"/><line x1="88" y1="160" x2="168" y2="160"/></svg>
    </button>
  </div>
</div>
</body></html>`,
  },

  'quick-links': {
    width: 340, height: 320,
    html: `<!DOCTYPE html><html><head>${BASE}</head><body>
<div style="background:#fff;border:1px solid #eee;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06);padding:14px;width:248px;margin:16px auto">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <span style="font-size:11px;font-weight:600;color:#1a1a1a">Quick Links</span>
    <button style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:500;color:#888;background:none;border:none;cursor:pointer;padding:3px 8px;border-radius:3px">
      <svg width="13" height="13" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63Z"/></svg>
      Edit
    </button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0">
    <!-- Figma tile -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 8px;min-height:76px;border-radius:5px;background:#fafafa;border:1px solid transparent;text-decoration:none">
      <span style="font-size:24px;line-height:1">🎨</span>
      <span style="font-size:11px;color:#444;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px">Figma</span>
    </div>
    <!-- Notion tile -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 8px;min-height:76px;border-radius:5px;background:#fafafa;border:1px solid transparent">
      <span style="font-size:24px;line-height:1">📝</span>
      <span style="font-size:11px;color:#444;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px">Notion</span>
    </div>
    <!-- GitHub tile -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 8px;min-height:76px;border-radius:5px;background:#fafafa;border:1px solid transparent">
      <img src="https://www.google.com/s2/favicons?domain=github.com&sz=64" width="28" height="28" style="border-radius:4px;object-fit:contain" alt="">
      <span style="font-size:11px;color:#444;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px">GitHub</span>
    </div>
    <!-- Staging tile -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 8px;min-height:76px;border-radius:5px;background:#fafafa;border:1px solid transparent">
      <span style="font-size:24px;line-height:1">🚀</span>
      <span style="font-size:11px;color:#444;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px">Staging</span>
    </div>
  </div>
</div>
</body></html>`,
  },

  'notification-center': {
    width: 380, height: 440,
    html: `<!DOCTYPE html><html><head>${BASE}</head><body>
<div style="background:#fff;border:1px solid #eee;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06);width:340px;margin:16px auto;overflow:hidden">
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee">
    <span style="font-size:12px;font-weight:600;color:#1a1a1a">Notifications</span>
    <button style="font-size:10px;color:#2563EB;background:none;border:none;cursor:pointer;font-weight:500">Mark all read</button>
  </div>
  <!-- Items -->
  <div>
    <!-- unread -->
    <div style="display:flex;gap:10px;padding:12px 16px;background:#f5f8ff;border-bottom:1px solid #eee">
      <div style="width:8px;height:8px;border-radius:50%;background:#2563EB;flex-shrink:0;margin-top:4px"></div>
      <div style="flex:1">
        <p style="font-size:12px;font-weight:600;color:#1a1a1a;margin-bottom:2px">Task assigned to you</p>
        <p style="font-size:11px;color:#666;margin-bottom:3px">"Redesign onboarding flow" was assigned to you by Jordan</p>
        <p style="font-size:10px;color:#888">2 minutes ago · Design Sprint Q2</p>
      </div>
    </div>
    <!-- unread -->
    <div style="display:flex;gap:10px;padding:12px 16px;background:#f5f8ff;border-bottom:1px solid #eee">
      <div style="width:8px;height:8px;border-radius:50%;background:#2563EB;flex-shrink:0;margin-top:4px"></div>
      <div style="flex:1">
        <p style="font-size:12px;font-weight:600;color:#1a1a1a;margin-bottom:2px">Due date approaching</p>
        <p style="font-size:11px;color:#666;margin-bottom:3px">"Finalize brand guidelines" is due tomorrow</p>
        <p style="font-size:10px;color:#888">1 hour ago · Marketing</p>
      </div>
    </div>
    <!-- read -->
    <div style="display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid #eee">
      <div style="width:8px;height:8px;border-radius:50%;background:#e5e5e5;flex-shrink:0;margin-top:4px"></div>
      <div style="flex:1">
        <p style="font-size:12px;font-weight:500;color:#444;margin-bottom:2px">Task moved to Done</p>
        <p style="font-size:11px;color:#888;margin-bottom:3px">"Set up CI pipeline" was completed</p>
        <p style="font-size:10px;color:#aaa">Yesterday · Engineering</p>
      </div>
    </div>
    <!-- read -->
    <div style="display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid #eee">
      <div style="width:8px;height:8px;border-radius:50%;background:#e5e5e5;flex-shrink:0;margin-top:4px"></div>
      <div style="flex:1">
        <p style="font-size:12px;font-weight:500;color:#444;margin-bottom:2px">New member joined</p>
        <p style="font-size:11px;color:#888;margin-bottom:3px">Alex Kim joined the workspace</p>
        <p style="font-size:10px;color:#aaa">2 days ago · Side Projects</p>
      </div>
    </div>
    <!-- read -->
    <div style="display:flex;gap:10px;padding:12px 16px">
      <div style="width:8px;height:8px;border-radius:50%;background:#e5e5e5;flex-shrink:0;margin-top:4px"></div>
      <div style="flex:1">
        <p style="font-size:12px;font-weight:500;color:#444;margin-bottom:2px">Comment added</p>
        <p style="font-size:11px;color:#888;margin-bottom:3px">Sam left a comment on "API integration spec"</p>
        <p style="font-size:10px;color:#aaa">3 days ago · Engineering</p>
      </div>
    </div>
  </div>
</div>
</body></html>`,
  },

  'board-overview': {
    width: 900, height: 520,
    html: `<!DOCTYPE html><html><head>${BASE}<style>
      .col{background:#f5f5f7;border-radius:8px;padding:0;width:220px;flex-shrink:0;overflow:hidden}
      .col-hdr{padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#666;display:flex;align-items:center;justify-content:space-between}
      .col-hdr .ct{font-size:10px;background:#e8e8ec;border-radius:10px;padding:1px 7px;color:#666;font-weight:600}
      .col-hdr.toDo .ct{color:#6366f1;background:rgba(99,102,241,.1)}
      .col-hdr.inProgress .ct{color:#0ea5e9;background:rgba(14,165,233,.1)}
      .col-hdr.inReview .ct{color:#d97706;background:rgba(217,119,6,.1)}
      .col-hdr.done .ct{color:#22c55e;background:rgba(34,197,94,.1)}
      .col-body{padding:8px;display:flex;flex-direction:column;gap:6px}
      .card{background:#fff;border:1px solid #eee;border-radius:5px;padding:10px 12px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.04)}
      .card-title{font-size:12px;color:#1a1a1a;font-weight:500;line-height:1.4;margin-bottom:6px}
      .chip{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;padding:1px 7px;border-radius:3px;margin-bottom:6px}
      .chip-urgent{color:#b91c1c;background:color-mix(in srgb,#b91c1c 12%,#fff)}
      .chip-high{color:#c2410c;background:color-mix(in srgb,#c2410c 12%,#fff)}
      .chip-medium{color:#d97706;background:color-mix(in srgb,#d97706 12%,#fff)}
      .chip-low{color:#15803d;background:color-mix(in srgb,#15803d 12%,#fff)}
      .meta{display:flex;align-items:center;justify-content:space-between;margin-top:6px}
      .assignee{display:flex;align-items:center;gap:4px;font-size:10px;color:#666}
      .dot{width:8px;height:8px;border-radius:50%}
      .due{font-size:10px;color:#888}
      .due-soon{color:#d97706;font-weight:600}
      .label{font-size:9px;padding:1px 6px;border-radius:10px;font-weight:600}
    </style></head><body style="background:#f5f5f7;padding:16px">
<div style="display:flex;gap:12px;overflow-x:auto">
  <!-- To Do -->
  <div class="col">
    <div class="col-hdr toDo" style="border-top:3px solid #6366f1">To Do <span class="ct">4</span></div>
    <div class="col-body">
      <div class="card">
        <div class="chip chip-urgent">!! Urgent</div>
        <div class="card-title">Redesign onboarding flow for new users</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#0ea5e9"></div>Jordan R.</div><div class="due due-soon">Today</div></div>
      </div>
      <div class="card">
        <div class="chip chip-high">↑ High</div>
        <div class="card-title">Set up staging environment</div>
        <div style="display:flex;gap:4px;margin-bottom:6px"><span class="label" style="color:#2563EB;background:rgba(37,99,235,.1)">Backend</span><span class="label" style="color:#7c3aed;background:rgba(124,58,237,.1)">DevOps</span></div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#8b5cf6"></div>Alex K.</div><div class="due">Tomorrow</div></div>
      </div>
      <div class="card">
        <div class="chip chip-medium">→ Medium</div>
        <div class="card-title">Write API documentation</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#f59e0b"></div>Sam T.</div><div class="due">3d</div></div>
      </div>
      <div class="card">
        <div class="card-title">Update dependencies to latest versions</div>
        <div class="meta"><div></div><div class="due">Jun 20</div></div>
      </div>
    </div>
  </div>
  <!-- In Progress -->
  <div class="col">
    <div class="col-hdr inProgress" style="border-top:3px solid #0ea5e9">In Progress <span class="ct">3</span></div>
    <div class="col-body">
      <div class="card">
        <div class="chip chip-high">↑ High</div>
        <div class="card-title">Implement real-time collaboration features</div>
        <div style="display:flex;gap:4px;margin-bottom:6px"><span class="label" style="color:#2563EB;background:rgba(37,99,235,.1)">Frontend</span></div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#0ea5e9"></div>Jordan R.</div><div class="due">Jun 18</div></div>
      </div>
      <div class="card">
        <div class="chip chip-medium">→ Medium</div>
        <div class="card-title">Design new dashboard layout</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#ec4899"></div>Casey L.</div><div class="due">Jun 22</div></div>
      </div>
      <div class="card">
        <div class="card-title">Migrate user data to new schema</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#8b5cf6"></div>Alex K.</div><div class="due">Jun 25</div></div>
      </div>
    </div>
  </div>
  <!-- In Review -->
  <div class="col">
    <div class="col-hdr inReview" style="border-top:3px solid #d97706">In Review <span class="ct">2</span></div>
    <div class="col-body">
      <div class="card">
        <div class="chip chip-low">↓ Low</div>
        <div class="card-title">Accessibility audit — keyboard navigation</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#f59e0b"></div>Sam T.</div><div class="due">Jun 17</div></div>
      </div>
      <div class="card">
        <div class="chip chip-medium">→ Medium</div>
        <div class="card-title">QA pass on mobile responsive layout</div>
        <div style="display:flex;gap:4px;margin-bottom:6px"><span class="label" style="color:#ec4899;background:rgba(236,72,153,.1)">Design</span></div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#ec4899"></div>Casey L.</div><div class="due">Jun 19</div></div>
      </div>
    </div>
  </div>
  <!-- Done -->
  <div class="col">
    <div class="col-hdr done" style="border-top:3px solid #22c55e">Done <span class="ct">5</span></div>
    <div class="col-body">
      <div class="card" style="opacity:.7">
        <div class="card-title" style="text-decoration:line-through;color:#888">Set up CI/CD pipeline</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#8b5cf6"></div>Alex K.</div><div class="due" style="color:#22c55e">✓ Done</div></div>
      </div>
      <div class="card" style="opacity:.7">
        <div class="card-title" style="text-decoration:line-through;color:#888">Finalize color token system</div>
        <div class="meta"><div class="assignee"><div class="dot" style="background:#ec4899"></div>Casey L.</div><div class="due" style="color:#22c55e">✓ Done</div></div>
      </div>
      <div class="card" style="opacity:.7">
        <div class="card-title" style="text-decoration:line-through;color:#888">Write onboarding checklist copy</div>
        <div class="meta"><div></div><div class="due" style="color:#22c55e">✓ Done</div></div>
      </div>
    </div>
  </div>
</div>
</body></html>`,
  },

  'priority-labels': {
    width: 520, height: 160,
    html: `<!DOCTYPE html><html><head>${BASE}</head><body style="display:flex;align-items:center;justify-content:center;height:160px;background:#f5f5f7;padding:20px">
<div style="display:flex;gap:10px">
  ${['↓ Low::#15803d', '→ Medium::#d97706', '↑ High::#c2410c', '!! Urgent::#b91c1c'].map(s => {
    const [label, color] = s.split('::')
    return `<div style="background:#fff;border:1px solid #eee;border-radius:5px;padding:12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,.04)">
      <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:3px;color:${color};background:color-mix(in srgb,${color} 12%,#fff)">${label}</span>
    </div>`
  }).join('')}
</div>
</body></html>`,
  },

  'assignee-update': {
    width: 420, height: 200,
    html: `<!DOCTYPE html><html><head>${BASE}</head><body style="display:flex;align-items:center;justify-content:center;height:200px;background:#f5f5f7;padding:20px">
<div style="background:#fff;border:1px solid #eee;border-radius:5px;padding:16px;width:320px;box-shadow:0 1px 3px rgba(0,0,0,.04)">
  <div style="font-size:12px;font-weight:500;color:#1a1a1a;margin-bottom:10px">Redesign onboarding flow</div>
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#888;font-weight:600;margin-bottom:6px">Assigned to</div>
  <div style="display:flex;align-items:center;gap:8px;background:#f0f5ff;border:1px solid rgba(37,99,235,.2);border-radius:5px;padding:8px 10px">
    <div style="width:24px;height:24px;border-radius:50%;background:#0ea5e9;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0">JR</div>
    <div>
      <div style="font-size:11px;font-weight:600;color:#1a1a1a">Jordan R.</div>
      <div style="font-size:10px;color:#666">jordan@team.com</div>
    </div>
    <svg style="margin-left:auto;color:#2563EB" width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="20"><polyline points="40,144 96,200 224,72"/></svg>
  </div>
</div>
</body></html>`,
  },
}

const browser = await chromium.launch()
const page = await browser.newPage()

for (const [name, { width, height, html }] of Object.entries(PAGES)) {
  await page.setViewportSize({ width, height })
  await page.setContent(html, { waitUntil: 'networkidle' })
  // Small wait for fonts
  await page.waitForTimeout(800)
  const outPath = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width, height } })
  console.log(`✓ ${name}.png`)
}

await browser.close()
console.log('Done.')
