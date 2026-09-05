# The Clarity Lab

Ayse Sule Ekiz's product design portfolio. Direction: **Commit Constellation**
— a git-log-style branching timeline (the "Field Map") unifying product
projects, visual practice, and community roles by date and shared theme,
inside a persistent code-editor shell (sidebar file-tree, tab bar, `⌘K`
command palette) — a synthesis of the "Studio Terminal" and "Field Map"
directions.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4 (theme tokens live in `app/globals.css` under `@theme inline`)
- Framer Motion for entrance transitions and the map/list interactions
- `next-themes` for light/dark (attribute-based, see Theming below)
- Real project screenshots and art photography pulled directly from the
  `ayse-sule-ekiz-portfolio` repo (via its GitHub Pages host) — no stock imagery

## Running it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production build: `npm run build && npm start`.

## Structure

```
app/
  page.tsx                  Homepage: terminal hero, Field Map, process, AI+craft, community, contact
  work/[slug]/page.tsx       Case study template (statically generated per project)
  visual-practice/page.tsx   Art practice → product craft
  about/page.tsx             About page

components/
  shell/                    EditorShell, Sidebar, TopBar, CommandPalette, StatusBar, ThemeToggle/Provider
  map/                       CommitConstellation — the unified timeline/map component
  ui/                        Container, SectionHeading, FieldLabel, Tag, EvidenceGlyph
  home/                      Hero, FieldMapSection (map/list toggle + hiring lens), ProcessSection,
                              AICraftSection, CommunitySection, ContactSection
  work/                      ProjectCard, DecisionLog, EvidenceRail, CaseStudyEntry
  visual/                    VisualCard, VisualTexture

lib/
  types.ts                   Shared TypeScript types (Project, TimelineNode, ProblemCategory, ...)
  category-color.ts          Maps a ProblemCategory to its CSS custom property (theme-aware)
  data/
    projects.ts               All seven case studies — decision log, evidence rail, full narrative,
                               real links/screenshots, date fields for the timeline
    categories.ts              The 8 "problem" categories (color comes from category-color.ts)
    visual-work.ts             Visual practice mediums, each with a category + real featured image
    community.ts                All six leadership/community roles with dates
    timeline.ts                 Builds the unified TimelineNode[] (projects + visual work +
                                 community) with cross-category "threads" for the map
    hiring.ts                   "What are you hiring for?" lenses used by the map + command palette
    file-tree.ts                Sidebar file-tree entries, derived from projects + visual work
    nav.ts, ai-tools.ts, process.ts
```

## Customizing content

Everything text-based lives in `lib/data/`. To add a new project:

1. Add an entry to the `projects` array in `lib/data/projects.ts` (copy an
   existing entry's shape — `Project` in `lib/types.ts` documents every field,
   including `date`/`dateLabel` for timeline placement and `images` for real
   screenshots).
2. Pick a `primaryCategory` and a `glyph` from `EvidenceGlyph` in
   `components/ui/EvidenceGlyph.tsx` (add a new one there for a new abstract
   mark).
3. The homepage Field Map, list view, sidebar file-tree, command palette, and
   `/work/[slug]` case study page all pick it up automatically — no routing
   changes needed.

Visual Practice cards and Community roles work the same way via
`lib/data/visual-work.ts` and `lib/data/community.ts` — both feed the same
`buildTimelineNodes()` map in `lib/data/timeline.ts`.

## Theming

Colors are CSS custom properties in `app/globals.css`: a base warm-paper
light theme (`#e9e3da` / `#f9ebde`) and a cool-navy dark theme
(`#091116` / `#222833`), toggled by `next-themes` via `data-theme` on
`<html>`. Category colors (`--cat-*`) and the accent (`--accent`) are
redefined per theme so the whole palette — including every node on the map —
adapts consistently. A Tailwind `@custom-variant dark` is registered against
`[data-theme="dark"]` so `dark:` utilities work normally in components.

Per-category tinting (cards, tags, map nodes) works by setting `--cat-color`
inline (see `lib/category-color.ts`) and consuming it via the `.cat-tint-bg` /
`.cat-tint-text` / `.cat-tint-border` utility classes in `globals.css` —
this keeps every category theme-aware without hand-maintaining light/dark
variants of every tint.

## Notes on placeholders

- `ASSET_REQUESTS.md` lists the only genuinely new assets needed (an original
  icon set, a logo/mark, a portrait) — everything else (screenshots, art
  photography) is pulled live from the real portfolio repo.
- `metadataBase` in `app/layout.tsx` uses a placeholder domain; update it once
  the site has a real one for correct Open Graph URLs.

## Design notes

- Motion respects `prefers-reduced-motion` globally (see `app/globals.css`).
- The Field Map (`components/map/CommitConstellation.tsx`) lays nodes out by
  sorted date across three lanes (visual practice "roots", work, community)
  and draws faint cross-lane threads between nodes that share a problem
  category. It intentionally overflows horizontally (git-graph-style) rather
  than cramming onto one screen, a List view toggle sits next to it as the
  fast-scan fallback.
