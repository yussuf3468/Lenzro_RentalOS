# Lenzro Logo

The master logo lives at [`/assets/logo.svg`](../../assets/logo.svg) and is referenced
from there by every template and component. Do not fork copies — point to the asset.

## Variants

| File                   | Use                                                          |
| ---------------------- | ------------------------------------------------------------ |
| `assets/logo.svg`      | Primary — yellow→green gradient mark                         |
| `assets/logo-mono.svg` | Single-color (`fill: currentColor`) for dark/light or stamps |
| `assets/favicon.svg`   | Browser tab / small sizes                                    |

## Lockup

The full lockup (mark + wordmark) is built with the `.logo` component, not a flattened image:

```html
<span class="logo logo--lg">
  <img class="logo__mark" src="/assets/logo.svg" alt="" />
  <span class="logo__text">
    <span class="logo__name">Lenzro</span>
    <span class="logo__sub">Software Solutions</span>
  </span>
</span>
```

Add `logo__name--gradient` to render the wordmark in the brand gradient (display contexts only).

## Clear space & sizing

- Minimum mark height: 18px (running header). Default document sizes: `--sm` 22px, base 34px, `--lg` 52px.
- Keep clear space around the mark equal to half its height.
- Never recolor the gradient, stretch, rotate, or add effects to the mark.
