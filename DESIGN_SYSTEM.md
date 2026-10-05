# PG Manager app — visual system

The app shares its design language with the StoreKit merchant app (`ecommnerce/mobile`): warm neutrals, one confident orange accent, soft corners, and Urbanist display type over Plus Jakarta Sans. Light theme only.

## Tokens (`src/components/tokens.js`)

| Role | Value |
| --- | --- |
| Primary / pressed / subtle / tint | `#e2511e` / `#b83e15` / `#fef1ea` / `#fde3d3` |
| Canvas / surface / muted surface | `#f4f4f6` / `#ffffff` / `#eeeef1` |
| Text primary / secondary / muted / disabled | `#101014` / `#45454f` / `#5b5b66` / `#8a8a95` |
| Border / strong | `#e6e6ea` / `#d3d3d9` |
| Success / warning / error / info | `#15803d` / `#b45309` / `#be123c` / `#1d4ed8` (each with a tint) |

- **Fonts:** Urbanist 600/700 for display, titles and figures. Plus Jakarta Sans 400/500/600/700 for everything else. Fonts load in `App.js` before the first render. Weights are separate families because Android does not synthesise weights for custom fonts, so never set `fontWeight`; use `fonts.*` or `typography.*`.
- **Space:** 4/8/12/16/24/32/48. **Radii:** 6/12/18/22/28/pill. Controls use 18 and cards use 22.
- **Shadows:** `shadow.subtle | card | lift | sheet`. iOS uses shadow properties and Android uses elevation.

## Components (`src/components/ui.js`)

`PageHeader` (eyebrow + title + subtitle + right slot), `Button` (primary / secondary / ghost / tertiary / danger; sizes sm / md / lg), `Field` / `PasswordField` (58pt, 1.5px border, focus and error tints), `Toggle`, `Segmented`, `Card`, `Row` (card row with icon medallion and chevron), `Stat`, `Badge` / `Pill`, `Notice`, `StateView` / `QueryState` (medallion empty and error states), `Press` / `FadeIn` (scale-on-press with haptics, entrance fades; both respect reduced motion). `Sheet`, `OtpInput`, `Toast` and `AuthShell` / `BrandMark` live in their own files.

## Boundaries

Only presentation changed. API calls, payloads, validation, query keys and navigation routes are the same as before.
