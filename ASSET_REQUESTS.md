# Asset Requests

Direction: **Commit Constellation** — a git-log-style branching timeline
(Studio Terminal chrome + Field Map's constellation threads combined) as the
main way to browse projects, visual work, and community roles together,
inside a persistent editor-shell nav (sidebar file-tree, tab bar, `⌘K`
command palette).

Status: nothing below is blocking launch. I'm building with original
placeholder SVGs I author myself (simple, unlicensed, single-stroke) so the
site works today. Everything here is a drop-in replacement — same filename,
same folder — once you have your own version, no code changes needed.

## Logo & identity

- **Type:** logo / wordmark
- **Used in:** sidebar header, browser tab (favicon), OG image
- **Suggested filenames:** `public/logo.svg` (full wordmark), `public/logo-mark.svg`
  (icon-only mark, square), `public/favicon.ico`
- **Dimensions:** wordmark flexible width × 32px tall; mark 64×64 square
- **Style direction:** something that reads at sidebar scale (small) and
  favicon scale (tiny) — a star-node, a branch fork, or a crescent moon are
  all on-theme; avoid fine detail that disappears below 24px
- **Example:** a single-stroke crescent moon merged with a small fork/branch
  glyph, like a moon phase caught mid-commit

## Category glyphs (constellation node markers)

Right now every node in the map is a plain circle colored by category. A
tiny distinct glyph per category would make the map readable at a glance
even before hovering.

- **Type:** icon set, 8 small glyphs
- **Used in:** constellation node markers, category filter chips, sidebar
  file-tree section icons
- **Suggested filenames:** `public/icons/category-ai-trust.svg`,
  `category-learning-workflows.svg`, `category-data-clarity.svg`,
  `category-campus-systems.svg`, `category-emotional-ux.svg`,
  `category-creative-tools.svg`, `category-community-learning.svg`,
  `category-design-systems.svg`
- **Dimensions:** 20×20 viewBox, single stroke ~1.5px, no fill (needs to
  tint via `currentColor` per category accent)
- **Style direction:** your freehand line style, simple enough to read at
  10–12px on the map
- **Example:** a small lock or eye for AI trust, an open book for learning
  workflows, a bar-chart tick for data clarity, a campus/building outline
  for campus systems, a soft heart-thread for emotional UX, a paint-drip for
  creative tools, a small group/thread-knot for community learning, a grid
  for design systems

## Editor-chrome icons

- **Type:** icon set, ~10 small UI icons
- **Used in:** sidebar file-tree rows, tab bar, command palette, theme toggle
- **Suggested filenames:** `public/icons/folder.svg`, `file.svg`, `star-node.svg`,
  `thread.svg`, `terminal-cursor.svg`, `search.svg`, `sun.svg`, `moon.svg`,
  `close-tab.svg`, `command.svg`
- **Dimensions:** 16×16 viewBox, single stroke ~1.5px
- **Style direction:** same freehand line family as the category glyphs, but
  slightly more utilitarian/quiet — these are chrome, not content

## Moon-phase reference (map legend / theme toggle)

- **Type:** photo or personal sketch
- **Used in:** theme-toggle icon inspiration, map legend easter egg
- **Suggested filename:** `public/images/moon-phase-reference.jpg`
- **Dimensions:** square, 800×800 minimum
- **Style direction:** a real photo you took of the moon, or a detail crop
  from *Girl & Moon* / *Angel & Moon*
- **Type of asset:** photo or sketch

## Portrait or working photo for About

- **Type:** photo
- **Used in:** About page
- **Suggested filename:** `public/images/portrait.jpg`
- **Dimensions:** portrait 3:4, 1200×1600 minimum
- **Style direction:** candid, working — at a desk, at the wheel, mid-sketch
- **Example:** `images/ceramics/me&giant_woman2.jpg` from your repo is a
  strong candidate if you're comfortable reusing it directly

## Everything else (screenshots, art photography)

Pulled straight from `ayse-sule-ekiz-portfolio` — no new photography needed:
Obi/Framewise/NAU Portal/Whisperwind Grove/Reverie/Ghibli Guardians
screenshots, plus ceramics/painting/graphic-design photos, per the confirmed
paths from the audit. If any of those turn out to be missing or you want to
swap one for a better shot, just say which and I'll point the code at the
new file.
