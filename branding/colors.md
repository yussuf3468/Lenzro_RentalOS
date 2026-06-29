# Lenzro — Color System

Lenzro's documents are **ink-dominant and minimal**. Color is used with restraint:
the brand gradient is a _signature_, not a wallpaper. Whitespace and typography carry
the design; the yellow→green gradient appears only as an accent.

---

## 1. Brand colors

| Token            | Hex       | Role                                           |
| ---------------- | --------- | ---------------------------------------------- |
| Lenzro Yellow    | `#FBEB05` | Gradient start (logo, brand rule)              |
| Lenzro Mid Green | `#6AFF80` | Gradient middle (wordmark / headline gradient) |
| Lenzro Green     | `#00FF99` | Gradient end (logo, brand rule)                |

**Gradients**

- Logo / brand mark: `#FBEB05 → #00FF99`
- Wordmark / display headline: `#FBEB05 → #6AFF80 → #00FF99`

> ⚠️ **Never** set body text, table text, or button labels in `#FBEB05`, `#6AFF80`,
> or `#00FF99` on a white background — they fail WCAG contrast badly. Use them as fills,
> rules, and accents only. For text/links that must read as "brand", use **Brand Green Ink**.

### Brand Green Ink (accessible derivative)

| Token                      | Hex       | Contrast on white            |
| -------------------------- | --------- | ---------------------------- |
| `--color-brand-ink`        | `#04875B` | ≈ 4.7:1 (AA for normal text) |
| `--color-brand-ink-strong` | `#036046` | ≈ 7.4:1 (AAA)                |

Used for links, primary buttons, active states, and the rare colored heading.

---

## 2. Neutral / ink scale

The workhorse of every document.

| Token               | Hex       | Use                         |
| ------------------- | --------- | --------------------------- |
| `--color-ink-900`   | `#0A0E17` | Display headings, cover     |
| `--color-ink-800`   | `#11151F` | Headings                    |
| `--color-ink-700`   | `#1F2530` | Body strong                 |
| `--color-ink-600`   | `#3A424F` | Body text                   |
| `--color-ink-500`   | `#5B6573` | Secondary text              |
| `--color-ink-400`   | `#8A93A2` | Muted / captions            |
| `--color-ink-300`   | `#C2C8D2` | Disabled, hairlines on dark |
| `--color-line`      | `#E6E9EF` | Borders, dividers           |
| `--color-line-soft` | `#F0F2F6` | Subtle separators           |
| `--color-surface`   | `#F7F8FA` | Cards, table headers, fills |
| `--color-surface-2` | `#FBFCFD` | Zebra rows                  |
| `--color-white`     | `#FFFFFF` | Page background             |

---

## 3. Semantic colors

Muted, professional — never neon. Each has a `-surface` (tint) and `-ink` (text/icon) pair.

| Meaning | Ink       | Surface   |
| ------- | --------- | --------- |
| Success | `#066E4B` | `#E9F8F1` |
| Warning | `#9A6700` | `#FFF6E5` |
| Danger  | `#B42318` | `#FEECEB` |
| Info    | `#1F5AE0` | `#EAF0FE` |
| Neutral | `#3A424F` | `#F2F4F7` |

---

## 4. Accessibility

- Body text targets **≥ 7:1** (AAA) wherever possible; never below 4.5:1.
- Status badges pair `-ink` text on `-surface` background (always ≥ 4.5:1).
- Brand gradient is decorative; meaning is never conveyed by color alone.
