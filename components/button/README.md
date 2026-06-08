# Button

Thin Angular Material button enhancements for Material 3 Expressive behavior.

## Extended FAB Collapse

Import the directive alongside Angular Material's button component/module:

```ts
import { MatButtonModule } from '@angular/material/button';
import { MatExtendedFabCollapsedDirective } from '@fairylights-studio/button';
```

Then include the package stylesheet once after Angular Material styles:

```scss
@use '@fairylights-studio/button/styles';
```

Use `collapsed` on an official Angular Material extended FAB:

```html
<button matFab extended [collapsed]="isFabCollapsed">
  <mat-icon>edit</mat-icon>
  Compose
</button>
```

This package does not reimplement Angular Material button internals. It adds the upstream-compatible
collapsed class and CSS needed to animate the extended FAB label and icon spacing.
