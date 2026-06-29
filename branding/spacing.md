# Lenzro — Spacing & Layout Scale

A single 4px-based spacing scale governs every margin, padding, and gap. Consistent
rhythm is what makes documents feel "engineered".

## Spacing scale (base unit = 4px)

| Token        | px  | Typical use                 |
| ------------ | --- | --------------------------- |
| `--space-0`  | 0   | reset                       |
| `--space-1`  | 4   | icon gaps, fine adjustments |
| `--space-2`  | 8   | tight padding               |
| `--space-3`  | 12  | chip / badge padding        |
| `--space-4`  | 16  | base padding, paragraph gap |
| `--space-5`  | 20  | —                           |
| `--space-6`  | 24  | card padding                |
| `--space-8`  | 32  | block spacing               |
| `--space-10` | 40  | sub-section gap             |
| `--space-12` | 48  | section gap                 |
| `--space-16` | 64  | major section gap           |
| `--space-20` | 80  | cover spacing               |
| `--space-24` | 96  | page-region spacing         |

## Radius scale

`--radius-xs` 4 · `--radius-sm` 6 · `--radius-md` 10 · `--radius-lg` 14 · `--radius-xl` 20 · `--radius-pill` 999

## Shadow scale (subtle, screen only — stripped in print)

- `--shadow-xs` hairline lift
- `--shadow-sm` cards
- `--shadow-md` raised panels
- `--shadow-lg` cover / hero

## Page geometry (A4)

- Page: 210 × 297 mm.
- Margins: 22mm top/bottom, 20mm left/right (screen preview mirrors print).
- Content max-width on screen: 820px, centered.
- Grid: 12 columns, 24px gutter.
