# Design Tokens
> Edit this file when starting a new app. All brand values live here — components.md and patterns.md reference these only.

```css
:root {

  /* ── Color · Surfaces ──────────────────────────────────── */
  --bg:          #f5f5f7;   /* page background (iOS-style warm gray) */
  --card:        #ffffff;   /* card / grouped-list background */
  --surface:     #fafafa;   /* inset stat boxes, sticky table headers */
  --paper-2:     #f0f0f2;   /* pill backgrounds, muted fills */
  --paper-3:     #e8e8ec;   /* progress track, slider track, split bar bg */

  /* ── Color · Text ──────────────────────────────────────── */
  --ink:         #1a1a1a;   /* primary text */
  --ink-2:       #444444;   /* secondary text (labels, row labels) */
  --ink-3:       #666666;   /* tertiary text (captions, hints) */
  --ink-4:       #888888;   /* placeholder, disabled, chevrons */

  /* ── Color · Borders ───────────────────────────────────── */
  --line:        #eeeeee;   /* default divider */
  --line-soft:   #f3f3f3;   /* row separators inside cards */

  /* ── Color · Brand ─────────────────────────────────────── */
  --accent:      #2563EB;                 /* brand blue — primary interactive */
  --accent-2:    #1D4ED8;                 /* pressed / hover state */
  --accent-tint: rgba(37,99,235,0.10);    /* accent background fills */

  /* ── Color · Semantic ──────────────────────────────────── */
  --green:       #15803d;
  --green-tint:  rgba(21,128,61,0.10);
  --red:         #b91c1c;
  --red-tint:    rgba(185,28,28,0.10);
  --amber:       #92400e;
  --amber-tint:  rgba(146,64,14,0.10);

  /* ── Type · Families ───────────────────────────────────── */
  --font-body:   'IBM Plex Sans', -apple-system, system-ui, sans-serif;
  --font-mono:   'IBM Plex Mono', ui-monospace, 'SF Mono', monospace;
  /* Google Fonts import: ?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500 */

  /* ── Type · Sizes ──────────────────────────────────────── */
  --text-xs:     10px;   /* caps labels, table headers, meta */
  --text-sm:     11px;   /* section headers, eyebrows (uppercase) */
  --text-body:   13px;   /* secondary body, hints, captions */
  --text-md:     14px;   /* primary body copy, row labels */
  --text-lg:     15px;   /* form inputs, CTA text */
  --text-xl:     16px;   /* sheet titles */
  --text-2xl:    18px;   /* slider secondary value */
  --text-3xl:    22px;   /* page title, empty-state heading */
  --text-4xl:    28px;   /* large page hero title */
  --text-display: 40px;  /* hero numeric (simulator, sim-hero) */
  --text-hero:    52px;  /* hero balance amount */

  /* ── Type · Weights ────────────────────────────────────── */
  --weight-regular:   400;
  --weight-medium:    500;
  --weight-semibold:  600;
  --weight-bold:      700;

  /* ── Spacing ───────────────────────────────────────────── */
  --space-1:   4px;    /* tight gaps (icon padding, badge padding) */
  --space-2:   8px;    /* icon-to-text gaps, small row gaps */
  --space-3:  12px;    /* row vertical padding, card internal gap */
  --space-4:  16px;    /* page horizontal margin, section padding */
  --space-5:  20px;    /* card horizontal padding */
  --space-6:  24px;    /* large internal padding */
  --space-7:  28px;    /* section vertical spacing (margin-top) */
  --space-8:  32px;    /* bottom scroll clearance */

  /* ── Radius ────────────────────────────────────────────── */
  --radius:    5px;    /* cards, buttons, modals, pills, segments — universal */
  --radius-sm: 2px;    /* progress bars, drag handles, tiny dots */
  --radius-sm: 3px;    /* alloc-dot, split-dot */
  --radius-lg: 8px;    /* sim-custom input box — only exception */
  --radius-circle: 50%; /* avatars, circular buttons */

  /* ── Shadow ────────────────────────────────────────────── */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04); /* cards, .grp */
  --shadow-pop:   0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06); /* toasts, FABs */
  --shadow-float: 0 12px 40px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06); /* sheets, modals */

  /* ── Motion ────────────────────────────────────────────── */
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);  /* bouncy (tabs, swatches, scale) */
  --ease-enter:  cubic-bezier(.32, 1, .45, 1);      /* smooth in (sheets, pane transitions) */
}
```
