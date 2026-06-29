# UI/UX Standards (binding, all phases)

Lenzro RentalOS must feel like a **world-class SaaS released in 2026** — not an admin template.
These standards are mandatory for every screen, every phase. They sit on top of
[`design-system.md`](design-system.md) (the brand tokens) and define how we _use_ them.

**North stars:** Linear · Vercel · Stripe Dashboard · Raycast · Notion · Arc · Apple HIG.
**Feel:** calm, precise, premium, fast. Restraint over decoration.

## 1. Non-negotiables (the checklist every screen passes)

- [ ] Designed states for **all four**: loading (skeleton), empty, error, populated.
- [ ] Fully responsive: mobile → tablet → laptop → desktop, no layout breakage.
- [ ] Motion on mount + interaction, **reduced-motion respected**.
- [ ] Keyboard accessible; visible focus rings; AA contrast minimum.
- [ ] Reuses shared primitives — no bespoke one-off CRUD layouts.
- [ ] Clearly Lenzro-branded (logo, ink palette, signature gradient used sparingly).
- [ ] No layout shift; fast perceived performance (optimistic UI, skeletons, prefetch).

## 2. Liquid Glass (translucency & depth)

A signature of the 2026 look — used with **restraint** for layering, never on dense data.

| Use glass on                                   | Don't use glass on                 |
| ---------------------------------------------- | ---------------------------------- |
| Sticky top bars / nav over scrolling content   | Tables, dense forms, long text     |
| Command palette (⌘K), modals, popovers, sheets | Primary reading surfaces           |
| Floating action bars, toasts, hero accents     | Anything where it reduces contrast |

Implementation (tokens in `globals.css`):

- `.glass` — frosted bar (≈72% surface + blur + saturate). Headers, popovers.
- `.glass-strong` — denser frost for modals / command palette.
- `.glass-edge` — adds the subtle top highlight + hairline that sells "layered glass".
- Always pair with a hairline `border-border/60` and soft elevation (`shadow-md/lg`).
- **Performance:** `backdrop-filter` is GPU-bound — only on small, fixed/overlay surfaces;
  never on large scrolling regions or many simultaneous elements.

## 3. Depth & elevation

Soft, layered shadows (overriding Tailwind defaults) + hairline borders create depth — never
heavy drops. Scale: `shadow-xs` (hairline lift) → `sm` (cards) → `md` (raised/hover) →
`lg` (popovers/sheets) → `xl` (modals/command). Dark mode leans on borders + subtle inner light.

## 4. Motion system (Framer Motion)

Purposeful and quick. Animate **transform + opacity only** (compositor-friendly). Source of truth:
`src/lib/motion.ts` + `src/components/motion-primitives.tsx`.

| Token  | Value                            | Use                                      |
| ------ | -------------------------------- | ---------------------------------------- |
| `fast` | 120ms                            | hovers, toggles, presses                 |
| `base` | 200ms                            | dropdowns, popovers, tab/section changes |
| `slow` | 320ms                            | dialogs, route/section transitions       |
| easing | `cubic-bezier(0.22, 1, 0.36, 1)` | default ease-out                         |
| spring | stiffness 400 / damping 32       | playful affordances (sparingly)          |

Patterns: page/section entrance = `FadeIn` (opacity + 12px rise). Lists/grids = `Stagger` +
`StaggerItem` (≤60ms stagger). KPIs = count-up. Hover = 120ms lift (`-translate-y-0.5` +
`shadow-md`). **All gate on `useReducedMotion()`** — reduced users get instant, no transform.

## 5. Required state primitives (reuse these)

| Primitive                            | File                               | For                                                         |
| ------------------------------------ | ---------------------------------- | ----------------------------------------------------------- |
| `Skeleton`                           | `components/ui/skeleton.tsx`       | content-shaped loading; never a bare spinner for page loads |
| `Spinner`                            | `components/ui/spinner.tsx`        | inline/button busy states                                   |
| `EmptyState`                         | `components/empty-state.tsx`       | empty lists — icon + title + guidance + primary action      |
| `FadeIn` / `Stagger` / `StaggerItem` | `components/motion-primitives.tsx` | entrance motion                                             |

Future shared composites (added as features need them, kept consistent): `PageHeader`,
`DataTable`, `StatCard`, `Money`, `StatusBadge`, `ConfirmDialog`, `FileUpload`, `SearchCommand`.

## 6. Responsiveness

Desktop-first design, mobile-first quality. Tailwind breakpoints: `sm 640 · md 768 · lg 1024 ·
xl 1280 · 2xl 1536`.

- Sidebar → collapsible sheet under `md`. Tables → horizontal scroll or stacked cards on mobile.
- Touch targets ≥ 44px. Content max-widths to keep measure readable. Fluid type where helpful.
- Test every screen at 375 / 768 / 1024 / 1440 widths before it ships.

## 7. Typography & hierarchy

Inter (UI) + JetBrains Mono (figures, IDs, money — `tabular-nums`). One H1 per view; clear
size/weight/space hierarchy; generous whitespace; body measure ≤ ~70ch. Sentence case for UI;
numbers grouped with separators. Microcopy per [`branding/tone.md`](../../branding/tone.md):
plain, confident, warm.

## 8. Interaction & accessibility

- Every interactive element: hover, active, focus-visible, disabled, loading states.
- Visible focus ring (`--ring`) always; full keyboard nav; ⌘K command palette is first-class.
- Semantic HTML + ARIA on composites; forms have labels, descriptions, inline errors.
- Status conveyed by icon + text, not color alone. Respect `prefers-reduced-motion` and contrast.

## 9. Performance budget

- Route-level code splitting; lazy-load heavy features (charts, calendar, maps, editors).
- Avoid unnecessary re-renders: stable keys, memoized selectors, `useMemo`/`useCallback` where it
  pays, colocated state, TanStack Query caching + prefetch on hover/intent.
- Optimize images (Supabase transforms, responsive `srcset`, lazy + blur placeholder).
- Animate only transform/opacity; cap concurrent blur surfaces; keep main-thread work small.
- Perceived speed first: skeletons immediately, optimistic mutations, no spinner-only screens.

## 10. Branding

Generated from [`/assets`](../../assets) + [`/branding`](../../branding). The `<Logo />` is the
source of truth; the yellow→green gradient is a **signature accent** (logo, hero, active rails,
key CTAs) — never wallpaper, never as text on light. Every page must read as an official Lenzro
product.
