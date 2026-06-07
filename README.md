# Angular M3 Expressive Components

Material 3 Expressive navigation components for Angular applications that already use Angular Material.

The navigation packages do not expose Sass theme mixins. Configure Angular Material once, then customize these components with runtime CSS variables.

```scss
@use '@angular/material' as mat;

html {
  @include mat.theme(
    (
      color: mat.$rose-palette,
      typography: Roboto,
    )
  );
}
```

## Runtime Variables

`--flight-*` variables are owned by this library and are safe to override. `--mat-sys-*` variables are owned by Angular Material; the navigation components only consume them for color, typography, and motion.

| Package | Public `--flight-*` variables | Angular Material system variables consumed |
| --- | --- | --- |
| `@fairylights-studio/navigation-bar` | Bar height, horizontal height, item width, indicator size/shape, label spacing, z-index | `--mat-sys-surface-container`, `--mat-sys-on-surface(-variant)`, `--mat-sys-secondary-container`, `--mat-sys-label-large-*`, motion tokens |
| `@fairylights-studio/navigation-rail` | Rail widths, item heights/padding, indicator size/shape, icon box, collapsed label positioning, z-index | `--mat-sys-surface`, `--mat-sys-outline-variant`, `--mat-sys-on-surface-variant`, `--mat-sys-on-secondary-container`, `--mat-sys-secondary-container`, `--mat-sys-label-*`, motion tokens |
| `@fairylights-studio/navigation-suite` | Scaffold min height, container color, bar row heights | `--mat-sys-surface`, motion tokens, plus the bar/rail variables above |

Example local override:

```css
.workspace-shell {
  --flight-nav-rail-container-collapsed-width: 88px;
  --flight-nav-bar-container-height: 84px;
}
```

## Development

Use Bun for dependency management. Do not run library builds until the build pipeline is ready.

```bash
bun install
bun nx test @fairylights-studio/navigation-rail
```
