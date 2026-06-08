
# Voxie UI Rebrand Plan — "WisprFlow Editorial" Direction

> Goal: Re-skin Voxie to match the visual language of [wisprflow.ai](https://wisprflow.ai) —
> a quiet-luxury, editorial-magazine aesthetic with serif headlines on cream,
> sage/lavender pastel accents, and subtle green CTAs. Replace the current
> dark glassmorphism + violet→blue→cyan gradient identity wholesale.

---

## 1. Design Reference Summary (from wisprflow.ai)

Captured from the [Wispr Rebrand page](https://wisprflow.ai/rebrand) and direct
page inspection.

### Design Philosophy (verbatim quotes from rebrand page)

- *"Purposefully editorial, where every space served emotional or cognitive clarity"*
- *"Grounded and human"* — not cold competence
- Inspired by *"quiet luxury and editorial design"* — not dashboards
- *"Brand through rhythm, not noise"*
- *"Less SaaS dashboard, more editorial Sunday"*
- *"Gentle curves, generous spacing, and soft corners"*
- *"Subtle microinteractions and slow fades create emotional pacing"*

Inspiration sources cited: vintage Nike stickers, AllTrails, lifestyle magazines,
street posters. **Not** typical AI-startup "icy blue + purple coffee-shop tech."

### Typography

| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Display / Headlines | **EB Garamond** (Google Fonts) | 400, 500, italic 400 | Serif. Editorial warmth. Used for hero, section titles, big stats. |
| UI / Body | **Figtree** (Google Fonts) | 400, 500, 600, 700 | Modern geometric sans. Clean, calm. Used for body, nav, buttons, labels. |
| Mono (optional) | Keep **JetBrains Mono** | 400, 500 | Only for code blocks / IDs. Not part of the aesthetic. |

Letter-spacing: tight on headlines (`-0.02em`), neutral on body (`0`).
Line-height: generous (`1.15` for display, `1.6` for body) — "breathing."

### Color Palette

Wispr Flow does **not** publish hex codes. The following are calibrated values
that match their on-screen feel, named after Voxie's existing `--ah-*` token
convention for clean drop-in.

| Token | Hex | Role |
|-------|-----|------|
| `--ah-bg-deep` | `#F7F3EC` | Cream canvas — main page background |
| `--ah-bg-raised` | `#FFFCF6` | Slightly warmer off-white — cards, panels |
| `--ah-bg-inset` | `#EFE9DC` | Inset/secondary block (testimonial cards, code samples) |
| `--ah-ink` | `#1A1A1A` | Near-black text, used sparingly for headlines |
| `--ah-ink-soft` | `#3A3A3A` | Body text |
| `--ah-ink-muted` | `#6B6B6B` | Captions, meta |
| `--ah-sage` | `#A8B89B` | Primary brand accent (sage) — pills, soft badges |
| `--ah-sage-deep` | `#5E7355` | Sage for icons / outline buttons |
| `--ah-lavender` | `#C9C2E0` | Secondary pastel — illustrations, decorative |
| `--ah-lavender-deep` | `#6B5FB0` | Lavender for emphasis text / links |
| `--ah-cta` | `#2F4A2A` | Deep forest green — primary CTAs ("quiet vitality") |
| `--ah-cta-hover` | `#243A20` | CTA hover |
| `--ah-border` | `rgba(26,26,26,0.08)` | Hairlines |
| `--ah-border-strong` | `rgba(26,26,26,0.14)` | Card edges |

> The palette intentionally drops Voxie's existing violet→blue→cyan gradient.
> If a gradient is wanted for occasional decorative use, replace with a soft
> *cream → sage → lavender* radial wash at very low alpha (≤ 8%).

### Visual / Layout System

- **Corner radius**: soft. `--radius = 14px` baseline, `20px` for cards, `999px` for pills.
- **Borders**: hairline `1px` at low alpha; almost no double-borders.
- **Shadows**: minimal — `0 1px 0 0 rgba(255,255,255,0.6) inset, 0 12px 28px -16px rgba(26,26,26,0.10)`. No glow.
- **Glassmorphism**: removed. Solid cream surfaces replace frosted glass.
- **Aurora wash**: removed from `<body>`. Pages get a calm, even cream.
- **Container width**: `max-w-6xl` (1152px) for narrative sections, `max-w-7xl` for grids.
- **Section spacing**: `py-24` to `py-32` (96–128px) — generously airy.
- **Grid gutters**: `gap-12` to `gap-16` in feature sections.

### Buttons & CTAs

- **Primary**: deep forest green (`--ah-cta`) pill, white text, `px-6 py-3`, `rounded-full`, no shadow. Hover darkens to `--ah-cta-hover`.
- **Secondary**: cream pill with `1px` sage border, ink text, `rounded-full`.
- **Tertiary / link**: underline on hover, sage color.
- No gradient buttons. Drop the `ah-gradient-bg` and `GradientButton` variants for landing.

### Motion

- Slow, editorial. `transition: all 300ms ease-out`.
- Fade-in on scroll (`opacity 0 → 1`, `translateY 12px → 0`) over 600ms.
- No bouncy springs. No pulse rings. No conic gradient borders. No floating blobs.

### Imagery

- Tactile, lived-in photography (not screenshots-on-gradients).
- Product UI shown on cream backgrounds, framed by generous margins, not floating
  in dark voids.
- Subtle paper / linen texture optional on hero (`bg-noise` overlay ≤ 3% opacity).

---

## 2. Gap Analysis — Current State vs Target

| Aspect | Current Voxie | Target (WisprFlow) |
|---|---|---|
| Mood | Premium dark SaaS | Editorial / quiet-luxury / cream |
| Background | `#050816` deep navy + aurora radials | `#F7F3EC` cream, flat |
| Headlines | Outfit sans, gradient text | EB Garamond serif, ink black |
| Body | IBM Plex Sans | Figtree |
| Brand color | Violet→Blue→Cyan gradient | Sage + lavender + forest green CTA |
| Surfaces | `glass`, `glass-raised`, `glass-floating` (frosted) | Flat cream panels with hairline borders |
| Buttons | Gradient pill with glow | Forest green pill, no glow |
| Corners | `0.625rem` (10px) base | `14px` base, softer |
| Shadows | Heavy violet/cyan glows | Almost none — one hairline + subtle drop |
| Motion | Aurora drift, pulse, shimmer | Slow fade + translate, nothing rotating |
| Theme | Dark default + Slate light mode | **Light is canonical**; dark becomes optional |

This is a *full rebrand*, not a theme tweak. Most landing components will need
markup-level edits (not just token swaps) because the dark glassmorphism vocabulary
(`bg-white/[0.04]`, `glass-floating`, gradient text) doesn't translate 1:1 to
cream surfaces.

---

## 3. Implementation Plan

### Phase 0 — Lock the design tokens (foundation, no UI change yet)

Goal: introduce the new tokens alongside the old ones so existing pages don't
break while we migrate. New tokens live in a `:root.editorial` (or replace
`:root.light`) variant.

**Files**
- `src/app/globals.css`
  - Add new token block (cream canvas, sage/lavender/forest-green) — see § 1.
  - Add new radii (`--radius: 14px`, `--radius-card: 20px`, `--radius-pill: 9999px`).
  - Add `.bg-noise` utility (optional paper texture).
  - Add fade-in keyframes: `editorial-fade` (opacity + translateY).
  - **Do not** delete `--ah-grad-violet` etc. yet — Phase 6 cleanup removes them.
- `src/app/layout.tsx`
  - Replace `Outfit` import with `EB_Garamond` (`next/font/google`).
  - Replace `IBM_Plex_Sans` with `Figtree`.
  - Keep variable names (`--font-heading`, `--font-sans`) so consumers don't churn.
  - Default `<html>` class to the new editorial theme (no `.dark` by default).

**Acceptance**: existing pages render unchanged (they still reference `--ah-*`
tokens that fall back); new tokens are inspectable in devtools.

### Phase 1 — Landing page (highest-visibility, biggest payoff)

Rewrite the five landing components below from dark-gradient idiom to editorial cream.

**Files**
- `src/components/landing/Hero.tsx`
  - Replace gradient text headline with EB Garamond, ink-black, italicized sub-phrase.
  - Drop aurora background. Use flat cream + a single hairline divider below hero.
  - Replace gradient CTA with forest-green pill. Add a sage-bordered secondary pill.
  - Replace the floating product mock with a centered, framed product screenshot on cream.
- `src/components/landing/Features.tsx`
  - Convert `glass-raised` cards to flat cream panels with `1px` sage border.
  - Icons: sage-deep, no glow.
  - Headings serif, body Figtree.
- `src/components/landing/UseCases.tsx`
  - Tabbed segment becomes a soft pill row (sage active, transparent inactive).
  - Tab content: editorial 2-column layout (copy left, product still right).
- `src/components/landing/AgentShowcase.tsx`
  - Replace gradient-bordered agent cards with framed editorial cards
    (cream, hairline border, soft drop shadow).
- `src/components/landing/Pricing.tsx`
  - Three columns, cream cards, sage outline on the recommended plan
    (replacing the current gradient ring).
  - Forest-green CTA on the chosen plan.
- `src/components/landing/CTA.tsx`
  - Single-block call-out: cream-inset panel, serif headline, forest-green button.
- `src/components/shared/Navbar.tsx`
  - Simple top bar: serif wordmark left, Figtree links center/right, forest-green
    "Get started" pill. Drop the floating glass pill nav. Sticky with cream background and `1px` bottom border on scroll.

**Acceptance**: `/` (landing) matches Wispr Flow's editorial feel — cream canvas,
serif headlines, sage/forest accents, no glow, no gradient text.

### Phase 2 — Auth pages (login / register / verify-email / reset-password)

**Files**: `src/app/(auth)/**`

- Two-column layout: left = serif marketing copy on cream-inset, right = white card with form.
- Form inputs: `1px` border, `rounded-2xl` (16px), no glass. Focus ring becomes a sage outline at 40% alpha.
- Buttons: forest-green primary; cream secondary.

**Acceptance**: Auth pages feel like a calm magazine sign-up flow, not a SaaS app.

### Phase 3 — Public agent experience (`/a/[slug]` and `/embed/[slug]`)

This is *the* product surface a caller sees first. Editorial credibility matters
disproportionately here.

**Files**
- `src/components/agent/PublicAgentExperience.tsx`
- `src/components/public/*-PreCall.tsx` (Restaurant, Medical, Legal, Hotel, Interview)

- Replace dark stage with cream stage. Center the call orb on cream.
- Call orb: solid sage with a soft lavender halo (replacing violet/cyan glow).
- Waveform: ink-black bars on cream (or sage on cream). Drop the gradient.
- Status pills (`Listening…`, `Speaking…`) become serif italic text in ink-soft, no pill.
- Embed (`/embed/[slug]`): same treatment, but stripped chrome.

**Acceptance**: A caller landing on `/a/<slug>` sees a calm, magazine-cover-like
voice stage — not a dark cyberpunk console.

### Phase 4 — Owner dashboard (`/business/*`)

This is where the editorial vocabulary fights with information density the most.
Keep the editorial *typography and palette* but allow practical density.

**Files**: `src/app/(business)/business/**`, `src/components/dashboard/**`,
`src/components/business/**`, `src/components/shared/Sidebar.tsx`

- Sidebar: cream, serif section labels, Figtree nav items, sage active indicator (left bar).
- Top bar: white, hairline bottom border, serif page title.
- Stat cards: cream-inset, large serif numbers, Figtree captions.
- Tables: hairline rows, no zebra stripes; Figtree body.
- Modals (`SessionDetailModal`, `RatingModal`): white sheet, soft `20px` corners, no glass.
- Lead status chips: sage = new, lavender = qualified, ink = archived, forest = won, rose = lost (replace existing gradient chips).
- Onboarding wizard: full-bleed cream, EB Garamond step titles, generous spacing.

**Acceptance**: Dashboard still scannable for data but in editorial drapery.
Owners feel like they're in a high-end CRM, not a dev console.

### Phase 5 — Component primitives sweep

Most consumer components reference shadcn primitives that bake in `bg-white/[0.04]`
and friends. After Phase 1–4 the obvious offenders surface — fix them in the
primitive layer so future pages inherit.

**Files**: `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`,
`select.tsx`, `dialog.tsx`, `tabs.tsx`, `badge.tsx`, `tooltip.tsx`.

- Rewrite `default`/`outline`/`ghost` button variants for editorial palette.
- Card: cream-inset + hairline.
- Inputs: `1px` border + sage focus ring.
- Badge: pill, sage/lavender/forest-green/rose variants.

**Acceptance**: Dropping a new `<Button>` into any new page comes out
editorial-correct without per-call overrides.

### Phase 6 — Prune dark-theme bits we won't keep

**Decision (locked):** keep dark mode as an *optional* secondary theme behind
the existing `ThemeToggle`. Editorial cream is the default; dark stays
available for users who prefer it. That means we **do not** delete the `.dark`
rules or the `next-themes` integration — but we do clean up the unused
gradient/glow vocabulary that no longer matches either theme.

- **Keep**: `.dark { ... }` block, `ThemeProvider`, `ThemeToggle`, `next-themes`.
- **Keep (refreshed)**: the dark palette gets a quiet refresh so it harmonizes
  with the new editorial light theme — same forest-green CTA in both, but on
  dark it sits on `--ah-bg-deep = #14130E` (ink-cream-black) instead of the
  current `#050816` navy. Sage stays sage; lavender stays lavender. No
  violet→cyan gradient in either theme.
- **Remove (both themes)**: `--ah-grad-violet/blue/cyan`, `--ah-gradient`,
  `--ah-gradient-soft`, `glass-raised` (replaced by flat panels with hairline),
  `glass-floating`, `gradient-border`, `glow-aurora`, `glow-violet/blue/cyan`,
  `animate-aurora`, `animate-pulse-ring`, `shimmer` (or restyle for the new palette).
- **Remove (consumer call sites)**: `ah-gradient-bg`, `ah-gradient-text`
  applied to text/buttons — codemod across `src/` to replace with solid
  forest-green or ink-black.
- **Keep**: `glass` (lighter weight — refit to "cream tinted at 4% alpha"
  in light, "ink tinted at 4% alpha" in dark) so existing panels don't all
  need touching.

**Acceptance**: `globals.css` shrinks ~30%; no references to violet/cyan
glow or aurora drift anywhere in `src/`; both themes share the same brand
accent vocabulary.

---

## 4. Skills to Use During Implementation

Per the project's available skills, these are the relevant ones for each phase:

- **`add-shadcn`** — if any new shadcn primitive is needed during Phase 5.
- **`fewer-permission-prompts`** — pre-run once so the rebuild doesn't get
  interrupted by prompts.
- **`verify`** — after each phase, run the app and visually verify the page.
- **`run`** — to start the dev server for visual checks (`npm run dev`).
- **`code-review`** — at the end of each phase before committing.

No skill exists for "rebrand" specifically. The user will drive each phase
manually, leaning on the skills above.

---

## 5. Risks & Decisions Locked

1. **Dark mode** — *Decision: keep as optional secondary theme.* Editorial
   cream is default; the existing `ThemeToggle` continues to switch into a
   refreshed dark palette (ink-cream-black `#14130E` base, same sage/lavender/
   forest-green accents — *no more violet→cyan gradient*).
2. **Headline serif** — *Decision: EB Garamond* (Google Fonts, free, warm
   editorial feel, closest visual match to Wispr Flow's published rebrand
   pairing per design press writeups).
### Remaining risks to track

3. **Accessibility**: Forest green on cream clears WCAG AA (`#2F4A2A` on
   `#F7F3EC` = 8.6:1 — safe). Sage on cream (`#A8B89B` on `#F7F3EC` = 1.7:1)
   **fails** for text. Restrict sage to decorative/icon use only, never body text.
4. **Caller-facing dark preference**: Some embed hosts run dark sites. The
   `/embed/[slug]` widget on a dark host will look like a bright cream square.
   Since dark mode is staying available, the embed can honor a `?theme=dark`
   query param to pick the dark variant at render time. Mark for Phase 3
   follow-up.
5. **Brand consistency with marketing assets**: The current logo, OG images,
   and favicon all assume violet gradient. They will need to be regenerated.
   Not in scope of this UI plan but worth flagging — list it in the README
   issue tracker after Phase 1 lands.
6. **Font loading weight**: Loading 3–4 weights of EB Garamond + 4 of
   Figtree adds ~80KB. Use `display: "swap"` on both, and only load `400` of
   EB Garamond if italic is not needed.

---

## 6. Sequencing Recommendation

The phases above are listed in *priority order* (highest visual payoff first).
Suggested execution:

| Sprint | Phase | Estimate |
|---|---|---|
| 1 | Phase 0 (tokens + fonts) | ½ day |
| 1 | Phase 1 (landing) | 1.5 days |
| 2 | Phase 2 (auth) | ½ day |
| 2 | Phase 3 (public agent) | 1 day |
| 3 | Phase 4 (dashboard) | 2 days |
| 3 | Phase 5 (primitives) | ½ day |
| 4 | Phase 6 (cleanup) | ½ day |

Total: ~6 working days for a single dev. Each phase is independently
shippable — landing can go live before dashboard catches up.

---

## 7. Sources

- [Wispr Flow homepage](https://wisprflow.ai/) — for current visual proof.
- [Wispr Flow Rebrand page](https://wisprflow.ai/rebrand) — for design-philosophy
  quotes and the "Lumen / Pulse / sage / lavender" naming.
- [Webflow Blog — Color & Typography Pairings](https://webflow.com/blog/color-and-typography-pairings)
  — confirmed Figtree + editorial-serif pairing convention.
- [Brandfetch — Wispr Flow](https://brandfetch.com/wisprflow.ai) — logo assets.
