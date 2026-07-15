# Visual & motion system — short spec

One artistic system, four metaphors, each with a defined job. This doc records decisions
already made in code (some in-flight) so later phases build on one shared reference instead
of re-deriving it. See `AGENTS.md` for the redesign brief this implements (Phase 1: Foundation).

## Metaphors and their job

| Metaphor | Job | Where |
|---|---|---|
| Editor shell | Structure and navigation | `components/shell/*` (sidebar, top bar, command palette, status bar) |
| Field notes | Project evidence and written content | Case studies, decision logs, evidence rail |
| Night sky | Dark-mode atmosphere, systems thinking | `--star-*` tokens, `CelestialBackdrop`, `CommitConstellation` |
| Ocean & shells | Light-mode atmosphere, creative practice | `--morning-*` tokens, `waves.gif`, `SHELL_ASSETS` in `CommitConstellation.tsx` |

No new visual metaphor should be added on top of these — extend one of the four instead.

## Color

Core surface/ink tokens (`--bg`, `--bg-raised`, `--bg-inset`, `--ink`, `--ink-soft`,
`--ink-faint`, `--line`, `--line-strong`) are defined once in `app/globals.css` and flip
between a warm cream light theme and a near-black night theme via `[data-theme]`.

Project/category accents (`--cat-ai-trust`, `--cat-learning-workflows`, `--cat-data-clarity`,
`--cat-campus-systems`, `--cat-emotional-ux`, `--cat-creative-tools`,
`--cat-community-learning`, `--cat-design-systems`) map onto the night-sky star palette
(`--star-blue`, `--star-yellow`, `--star-orange`, `--star-red`, `--star-blue-white`) in dark
mode. In light mode, the field map overrides these to a softer coral/apricot "shell" set
(`.field-map[data-theme=light]` in `app/globals.css`) so the ocean metaphor reads consistently
— five shell PNGs (`SHELL_ASSETS` in `components/map/CommitConstellation.tsx`), each with a
fixed hex tint (`#efb2a8`, `#f8caac`, `#f58581`, `#fcc9ca`, `#e8c9bc`), assigned per category
via `CATEGORY_SHELL_INDEX`.

## Image treatments

- Project cover images: `object-cover`, subtle scale-on-hover (`group-hover:scale-105`), a
  bottom gradient scrim for the icon badge to sit on (`ProjectCard.tsx`).
- Visual-practice hero art: `aspect-[4/5]`, `object-cover` (playground crops `object-top`
  instead — screenshots read better anchored to the top).
- Never crop or embed browser chrome in demo media (future-phase rule, recorded here early
  since it affects asset prep before Phase 3 flagship interactions).

## Border & surface hierarchy

- `border-line` — default hairline between sections and cards.
- `border-line-strong` — emphasis borders (active filter chips, focused states).
- `bg` → `bg-raised` → `bg-inset` — three surface elevations, raised surfaces get
  `backdrop-blur-xl` when floating over the celestial backdrop (see `Hero.tsx`'s window card).
- Cards use `rounded-2xl`; pills/chips use `rounded-full`. Don't mix radii within one
  component family.

## Type roles

| Role | Family | Token | Used for |
|---|---|---|---|
| Sans | IBM Plex Sans | `--font-sans` | Product explanation — headings, body copy, UI labels |
| Mono | IBM Plex Mono | `--font-mono` | Metadata, evidence, navigation — field numbers, file names, timestamps |
| Serif | Fraunces | `--font-serif` | Reflection and emotional moments — pull-quotes, field notes |

All three are wired through `app/layout.tsx` (`next/font/google`) and exposed as CSS
variables in the `@theme inline` block of `app/globals.css`, so `font-sans` / `font-mono` /
`font-serif` Tailwind utilities resolve correctly anywhere in the app.

## Motion tokens

`lib/motion.ts` exports `motionPurpose`, grouped by *why* something is moving, not just how
long it takes:

| Purpose | Duration | Rule |
|---|---|---|
| `feedback` | 120–200ms | Buttons, fields, tabs, filters — immediate, small transform/color change |
| `orientation` | 250–450ms | Modals, page transitions, filtering, navigation — preserve spatial relationships, no large unexpected movement |
| `explanation` | 400–800ms | System diagrams, source trails, timelines, persistent identity — triggered intentionally, pausable/replayable |
| `atmosphere` | slow, low-contrast | Stars, clouds, water, gentle art movement — never blocks reading, pausable, disabled under reduced motion |

The older generic `motionTimings.fast/base/slow` tokens stay in place for existing call
sites — components migrate to `motionPurpose` as they're touched in later phases, not in one
sweep.

`lib/motion.ts` also exports `useReducedMotion()`, a thin wrapper over framer-motion's hook,
for components that need to branch on reduced-motion explicitly (framer-motion-driven
animation isn't caught by the blanket CSS `prefers-reduced-motion` override in
`globals.css`). A full reduced-motion audit of the ambient/atmosphere layers
(`CommitConstellation`'s stars and water) is Phase 5 work — this hook is the infrastructure
that phase will use.

## Copy limits

| Surface | Limit |
|---|---|
| Hero headline | 8–12 words |
| Hero support | 20–30 words |
| Project card | 45–65 words total |
| Case-study challenge | 60–80 words |
| Key insight | 30–50 words |
| Decision headline | 8–14 words |
| Decision explanation | 50–70 words |
| Outcome reflection | 40–60 words |
| Art caption | One sentence |
| About page | Three short paragraphs |

## Rules for stars, shells, grids, glows, textures

- **Stars** (`CommitConstellation`, `CelestialBackdrop`): dark-mode only motif, represent
  nodes/relationships in the field map and the ambient night sky. Never used as pure
  decoration outside those two components.
- **Shells**: light-mode equivalent of stars in the field map — one shell asset per problem
  category via `CATEGORY_SHELL_INDEX`, not randomly assigned.
- **Grids**: `grid-field` background texture (`Hero.tsx`) marks "structure/code" moments —
  used sparingly, faded, never full-opacity.
- **Glows**: `BrandGlow` marks a page's primary accent moment (hero, about header) — at most
  one per page.
- **Textures**: reserved for visual-practice medium indicators (`paper`/`clay`/`charcoal`/
  `playground`) — don't reuse these texture names for product surfaces.
