# Navigation Rail

`@fairylights-studio/navigation-rail` provides Material 3 Expressive navigation rail components for Angular Material apps.

The package does not ship Sass theme mixins. Configure Angular Material in application styles; navigation rail consumes Angular Material runtime system variables for color, typography, and motion, and exposes `--flight-*` variables for layout customization.

```css
.workspace-rail {
  --flight-nav-rail-container-collapsed-width: 88px;
  --flight-nav-rail-item-button-collapsed-height: 76px;
}
```

See the Storybook docs for the full variable table and usage examples.
