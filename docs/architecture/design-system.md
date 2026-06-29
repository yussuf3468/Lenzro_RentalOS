# UI Architecture & Design System

Derived directly from `/branding` and `/assets`. The brand is **ink-dominant and minimal**; the
yellow→green gradient is a _signature accent, not wallpaper_. Target feel: **Linear, Stripe,
Vercel, Notion, Raycast** — premium, calm, engineered. Desktop-first, flawless on mobile.

The document-grade brand tokens are translated here into a **product** design system (light +
dark, interactive states, components). Phase 1 implements these as Tailwind theme + shadcn CSS
variables; nothing here is invented — values come from the brand files.

## 1. Brand foundation (from `branding/colors.md`)

- **Gradient (signature):** `#FBEB05 → #6AFF80 → #00FF99` (logo/brand uses the 2-stop
  `#FBEB05 → #00FF99`). Used for: logo, brand hairline rules, hero gradient headline text,
  selected/active accents, charts' brand series. **Never** for body text, labels, or button text
  on light surfaces (fails contrast).
- **Brand Green Ink (accessible):** `--brand-ink #04875B` (AA on white, links/primary),
  `--brand-ink-strong #036046` (AAA). This is the interactive "Lenzro green".
- **Ink/neutral scale:** `ink-900 #0A0E17 → ink-400 #8A93A2 → line #E6E9EF → surface #F7F8FA → white`.
- **Semantics:** success `#066E4B`/`#E9F8F1`, warning `#9A6700`/`#FFF6E5`, danger
  `#B42318`/`#FEECEB`, info `#1F5AE0`/`#EAF0FE`, neutral `#3A424F`/`#F2F4F7` (ink / surface pairs).

## 2. Semantic token mapping (shadcn CSS variables)

shadcn/ui consumes semantic variables; we map brand → semantic for **light** and **dark**.
(Hex shown for review; Phase 1 expresses them in shadcn's HSL/OKLCH format.)

| Semantic token                        | Light                 | Dark           | Role                  |
| ------------------------------------- | --------------------- | -------------- | --------------------- |
| `--background`                        | `#FFFFFF`             | `#0A0E17`      | app canvas            |
| `--foreground`                        | `#11151F`             | `#F7F8FA`      | primary text          |
| `--card` / `--popover`                | `#FFFFFF`             | `#11151F`      | raised surfaces       |
| `--muted` (surface)                   | `#F7F8FA`             | `#141925`      | fills, table headers  |
| `--muted-foreground`                  | `#5B6573`             | `#8A93A2`      | secondary text        |
| `--border` / `--input`                | `#E6E9EF`             | `#222A37`      | hairlines             |
| `--primary`                           | `#04875B` (brand-ink) | `#22E59A`      | primary actions/links |
| `--primary-foreground`                | `#FFFFFF`             | `#06251A`      | text on primary       |
| `--accent` (hover/active tint)        | `#E9F8F1`             | `#13261E`      | subtle brand tint     |
| `--ring` (focus)                      | `#04875B`             | `#22E59A`      | focus outline         |
| `--success/--warning/--danger/--info` | brand semantics above | tuned for dark | status                |

**Dark-mode accent rule:** on the dark canvas the _bright_ brand greens (`#00FF99`, `#6AFF80`,
`#22E59A`) finally pass contrast, so dark mode may use them for links, active states and chart
brand series — the one place the neon brand color becomes interactive text.

## 3. Button & action hierarchy (premium, always accessible)

| Variant              | Light                                   | Dark                         | Use                                |
| -------------------- | --------------------------------------- | ---------------------------- | ---------------------------------- |
| **Primary**          | brand-ink `#04875B` fill, white label   | bright green fill, ink label | the main action per view           |
| **Brand CTA / hero** | gradient fill or gradient text          | same                         | marketing CTAs, brand moments only |
| **Secondary**        | surface fill, ink text, hairline border | dark surface, light text     | secondary actions                  |
| **Ghost**            | transparent, ink text, hover tint       | same                         | toolbar/inline                     |
| **Destructive**      | danger ink/surface                      | tuned                        | delete/irreversible                |

Gradient is reserved for the logo, hero, brand rules, and selective accents — **not** every
button (honors "signature, not wallpaper").

## 4. Typography (from `branding/typography.md`)

- **Inter** for display/UI (Google Fonts + full system fallback for offline/PDF),
  **JetBrains Mono** for figures, IDs, codes (`LNZ-BKG-2026-0042`), and tabular money.
- Type scale (1.250 major third, base 16): display 61 · h1 49 · h2 39 · h3 31 · h4 25 ·
  h5/lead 20 · body 16 · sm 14 · xs 12 · 2xs 11.
- Weights 300–800 (800 display-only). Line-height 1.6 body / 1.2 headings / 1.1 display.
  Display & headings letter-spacing `-0.02em`; eyebrows/labels uppercase `+0.08em`.
- **Numbers use `font-variant-numeric: tabular-nums`** so money/metric columns align — critical
  for the finance and reporting modules.
- Body measure capped ~70ch; one H1 per page; never skip heading levels.

## 5. Spacing, radius, shadow (from `branding/spacing.md`)

- 4px base scale (`space-1…24`) drives **all** padding/margin/gap → consistent "engineered" rhythm.
- Radius: `xs 4 · sm 6 · md 10 · lg 14 · xl 20 · pill 999`. App default control radius `md`,
  cards `lg`.
- Shadows: `xs` hairline · `sm` cards · `md` raised panels · `lg` hero/overlays — **subtle**;
  elevation comes from soft shadows + hairline borders, not heavy drop shadows.

## 6. App layout (the shell)

```
┌───────────────────────────────────────────────────────────────────┐
│ Topbar: org switcher · global ⌘K search · notifications · profile  │
├───────────┬───────────────────────────────────────────────────────┤
│ Sidebar   │  Content                                               │
│ (logo,    │  ┌─ Page header: title · breadcrumbs · primary action ─┐│
│ nav by    │  │                                                     ││
│ module,   │  │  Cards / TanStack tables / charts / forms           ││
│ collapsi- │  │  max-width container, 12-col / 24px gutter grid      ││
│ ble)      │  └─────────────────────────────────────────────────────┘│
└───────────┴───────────────────────────────────────────────────────┘
```

- **Command palette (⌘K / Ctrl-K)** — Raycast-style: navigate, search entities, quick actions.
  A signature interaction; glassmorphism appropriate here.
- **Org switcher** in the topbar drives the active-tenant flow (`multi-tenancy.md` §5).
- Sidebar nav is **entitlement- and permission-aware** — locked modules show an upgrade hint;
  unauthorized items are hidden.
- Responsive: sidebar collapses to a sheet on mobile; tables gain horizontal scroll / card
  fallback; touch targets ≥ 44px. Desktop-first, but mobile is first-class.
- Breakpoints follow Tailwind defaults (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536).

## 7. Dark mode

- Class-based (`.dark`) toggle; preference persisted per user (`profiles`) + system default.
- Both themes are first-class and fully tokenized (§2) — no hard-coded colors in components.
- Gradient and logo unchanged across themes; surfaces and text invert via tokens.

## 8. Motion (Framer Motion)

Purposeful, quick, never decorative-for-its-own-sake (the brand is calm and precise).

| Token           | Value                                              | Use                               |
| --------------- | -------------------------------------------------- | --------------------------------- |
| `duration-fast` | 120ms                                              | hovers, toggles                   |
| `duration-base` | 200ms                                              | dropdowns, popovers, tab change   |
| `duration-slow` | 320ms                                              | dialogs, page/section transitions |
| easing          | `cubic-bezier(0.22, 1, 0.36, 1)` (gentle ease-out) | default                           |

- Page transitions: subtle fade/slide (8–12px). Lists: stagger ≤ 30ms. Numbers (KPIs): count-up.
- **`prefers-reduced-motion` respected** — animations reduce to opacity/none.

## 9. Glassmorphism (restrained, "only where appropriate")

Allowed: command palette, sticky topbar over scrolled content, modal overlays, marketing hero
accents. Implemented as low-opacity surface + `backdrop-blur` + hairline border. **Not** used on
dense data surfaces (tables, forms) where it harms legibility.

## 10. Data visualization (Recharts)

- **Brand series** first (the gradient/`#04875B`), then a calm categorical palette derived from
  semantics + muted ink — never neon clutter. Status charts reuse semantic colors (success/warn/danger).
- Tabular figures, currency-aware formatting (KES default, per-org), thousands separators,
  consistent axis/grid using `--border`. Tooltips use card tokens.
- Each chart pairs with an accessible data table fallback; meaning never by color alone
  (patterns/labels too) — per brand accessibility rules.

## 11. Component library strategy

- **`src/components/ui/`** — shadcn primitives (Button, Input, Dialog, Table, Tabs, Toast…),
  themed via the tokens above; treated as owned source, not a black box.
- **`src/components/`** — shared composites built from primitives: `DataTable`, `PageHeader`,
  `StatCard`, `EmptyState`, `Money`, `StatusBadge`, `EntityAvatar`, `DateRangePicker`,
  `FormField`, `ConfirmDialog`, `FileUpload`, `Logo`.
- **Feature components** live in their feature folder. No business logic in `ui/`.
- Standardized **states** for every data surface: loading (skeleton), empty (illustration +
  primary action), error (retry), and populated — designed, not afterthoughts.

## 12. Brand assets & logo usage (from `branding/logo/`)

- Logo source of truth: `/assets/logo.svg` (gradient), `/assets/logo-mono.svg`
  (`currentColor`), `/assets/favicon.svg`. A `<Logo />` React component renders the lockup
  (mark + "Lenzro" / "Software Solutions"); `name--gradient` only in display contexts.
- Min mark height 18px; clear space = ½ mark height; never recolor/stretch/rotate/effect the mark.
- Mono logo uses `currentColor` → adapts to light/dark and on-brand surfaces automatically.

## 13. Voice in the UI (from `branding/tone.md`)

- Microcopy: plain, confident, warm — lead with the outcome, short sentences. Active voice.
- Dates `28 June 2026` in prose, `2026-06-28` in metadata/IDs. Currency explicit
  (`KES 1,250,000`). Reference IDs `LNZ-<TYPE>-<YYYY>-<SEQ>`.
- Avoid: synergy, leverage(v), world-class, cutting-edge, revolutionary. Empty states and errors
  are helpful and human, never cute or robotic.

## 14. Accessibility (from brand + WCAG)

- Body text targets ≥ 7:1 where possible, never < 4.5:1; brand neon never used as text on light.
- Visible focus ring (`--ring`) on every interactive element; full keyboard nav incl. ⌘K.
- Semantic HTML + ARIA on composites; forms have labels, descriptions, and error text.
- Honors reduced-motion and high-contrast; status conveyed by icon+text, not color alone.
