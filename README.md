# Angular M3 Expressive Components

Material 3 Expressive components for Angular applications that already use Angular Material.

The packages do not expose Sass theme mixins. Configure Angular Material once, then customize these components with runtime CSS variables.

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

`--flight-*` variables are owned by this library and are safe to override. `--mat-sys-*` variables are owned by Angular Material; these components only consume them for color, typography, and motion.

| Package                                       | Public `--flight-*` variables                                                                           | Angular Material system variables consumed                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@fairylights-studio/ngx-m3-button`           | Extended FAB collapse motion variables                                                                  | `--mat-sys-duration-*`, `--mat-sys-easing-standard`, official FAB/button variables                                                                                                        |
| `@fairylights-studio/ngx-m3-navigation-bar`   | Bar height, horizontal height, item width, indicator size/shape, label spacing, z-index                 | `--mat-sys-surface-container`, `--mat-sys-on-surface(-variant)`, `--mat-sys-secondary-container`, `--mat-sys-label-large-*`, motion tokens                                                |
| `@fairylights-studio/ngx-m3-navigation-rail`  | Rail widths, item heights/padding, indicator size/shape, icon box, collapsed label positioning, z-index | `--mat-sys-surface`, `--mat-sys-outline-variant`, `--mat-sys-on-surface-variant`, `--mat-sys-on-secondary-container`, `--mat-sys-secondary-container`, `--mat-sys-label-*`, motion tokens |
| `@fairylights-studio/ngx-m3-navigation-suite` | Scaffold min height, container color, bar row heights                                                   | `--mat-sys-surface`, motion tokens, plus the bar/rail variables above                                                                                                                     |

## Button

`@fairylights-studio/ngx-m3-button` adds the upstream-compatible `collapsed` input for Angular Material
extended FABs without copying the Material button implementation.

```ts
import { MatButtonModule } from '@angular/material/button';
import { MatExtendedFabCollapsedDirective } from '@fairylights-studio/ngx-m3-button';
```

Include the stylesheet once after Angular Material styles:

```scss
@use '@fairylights-studio/ngx-m3-button/styles';
```

```html
<button matFab extended [collapsed]="isFabCollapsed">
  <mat-icon>edit</mat-icon>
  Compose
</button>
```

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
bun nx test @fairylights-studio/ngx-m3-navigation-rail
```
