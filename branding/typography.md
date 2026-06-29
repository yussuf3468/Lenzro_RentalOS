# Lenzro — Typography

Typography carries the Lenzro design. Strong hierarchy, generous leading, perfect rhythm.

## Typefaces

| Role                           | Family             | Fallback stack                                                    |
| ------------------------------ | ------------------ | ----------------------------------------------------------------- |
| Display & UI                   | **Inter**          | `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| Monospace (figures, code, IDs) | **JetBrains Mono** | `"SF Mono", "Cascadia Code", Consolas, monospace`                 |

Inter is loaded from Google Fonts in templates via `<link>`, with a full system fallback
so documents still look correct **offline** and in **Playwright/Puppeteer** PDF runs.
Numeric tables use `font-variant-numeric: tabular-nums` for perfect column alignment.

## Type scale (1.250 — major third, base 16px)

| Token          | rem    | px  | Use                        |
| -------------- | ------ | --- | -------------------------- |
| `--fs-display` | 3.815  | 61  | Cover title                |
| `--fs-h1`      | 3.052  | 49  | Document title             |
| `--fs-h2`      | 2.441  | 39  | Section                    |
| `--fs-h3`      | 1.953  | 31  | Subsection                 |
| `--fs-h4`      | 1.563  | 25  | Group heading              |
| `--fs-h5`      | 1.25   | 20  | Label heading              |
| `--fs-lead`    | 1.25   | 20  | Lead paragraph             |
| `--fs-body`    | 1.0    | 16  | Body                       |
| `--fs-sm`      | 0.875  | 14  | Secondary, table body      |
| `--fs-xs`      | 0.75   | 12  | Captions, footnotes        |
| `--fs-2xs`     | 0.6875 | 11  | Eyebrows, legal fine print |

## Weights

300 Light · 400 Regular · 500 Medium · 600 SemiBold · 700 Bold · 800 ExtraBold (display only)

## Rules

- Line-height: 1.6 body, 1.2 headings, 1.1 display.
- Letter-spacing: tighten display/headings (`-0.02em`); track eyebrows/labels (`+0.08em`, uppercase).
- Measure: body capped at ~70ch for readability.
- One H1 per document. Never skip heading levels.
