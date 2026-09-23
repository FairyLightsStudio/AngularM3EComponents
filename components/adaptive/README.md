# Adaptive Material 3 panes

`@fairylights-studio/ngx-m3-adaptive` is a third-party, standalone, zoneless Angular Material extension. It supplies container-responsive pane scaffolds, local navigation, accessible resizing, and floating panes. An optional `/router` entry point adds URL-backed navigation.

## Installation

Install alongside the matching Angular Material/CDK release:

```sh
bun add @fairylights-studio/ngx-m3-adaptive
```

Angular Router is optional for the main entry point. Install the version matching your Angular framework when using `@fairylights-studio/ngx-m3-adaptive/router`. These components consume Material system tokens; include your application’s normal Angular Material theme.

## List–Detail

```ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatListDetailPaneScaffoldComponent,
  MatPaneDirective,
  MatPaneExpansionState,
  createListDetailPaneNavigator,
} from '@fairylights-studio/ngx-m3-adaptive';

@Component({
  selector: 'app-messages',
  imports: [MatButtonModule, MatListDetailPaneScaffoldComponent, MatPaneDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-list-detail-pane-scaffold [navigator]="panes" [expansionState]="split" [height]="640">
      <ng-template matPane="secondary" label="Messages">
        <h2>Messages</h2>
        <button matButton (click)="panes.navigateTo('primary', 'message-42')">Open message</button>
      </ng-template>
      <ng-template matPane="primary" label="Message details">
        <h2>Message details</h2>
        <p>Selected: {{ panes.currentDestination()?.contentKey }}</p>
        <button
          matButton
          [disabled]="!panes.canNavigateBack('PopLatest')"
          (click)="panes.navigateBack('PopLatest')"
        >
          Back to messages
        </button>
        <label>Draft <input aria-label="Draft" /></label>
      </ng-template>
    </mat-list-detail-pane-scaffold>
  `,
})
export class MessagesComponent {
  readonly panes = createListDetailPaneNavigator();
  readonly split = new MatPaneExpansionState({
    anchors: [
      { type: 'proportion', proportion: 0.3 },
      { type: 'proportion', proportion: 0.5 },
      { type: 'proportion', proportion: 0.7 },
    ],
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.split.destroy());
  }
}
```

The draft’s DOM and component instance survive responsive hiding/showing. The library does not cache your business data, pause subscriptions, or persist local state across page reloads.

## Roles and defaults

| Scaffold    | primary               | secondary      | tertiary         | Initial destination     |
| ----------- | --------------------- | -------------- | ---------------- | ----------------------- |
| List–Detail | Detail                | List           | Extra (optional) | List                    |
| Supporting  | Main                  | Supporting     | Extra (optional) | Main                    |
| Three-pane  | Highest-priority pane | Secondary pane | Tertiary pane    | First available default |

Use `MatSupportingPaneScaffoldComponent` and `createSupportingPaneNavigator()` for main/supporting content. Supporting defaults to Reflow under Main when a one-column layout has enough definite height. List–Detail defaults to hiding lower-priority panes.

Horizontal defaults use the **scaffold’s measured width**, not the viewport:

| Available width  | Maximum columns | Preferred pane width |
| ---------------- | --------------- | -------------------- |
| Below 840px      | 1               | 360px                |
| 840–1199px       | 2               | 360px                |
| 1200px and above | 3               | 412px                |

Multiple columns/rows have 24px gaps. Preferred width is not a hard minimum. Extra width goes to the highest-priority visible pane; narrow layouts proportionally shrink preferences. `calculatePaneScaffoldDirective(width, height, { dense: true })` enables the optional two-column Medium behavior starting at 600px.

Set `[height]` to a finite pixel value for independent pane scrolling and vertical Reflow. Single-column layouts with an explicit height of at least 900px may have two rows. Leave height unset for natural document flow; content height does not itself trigger Reflow. Do not add padding to the measuring scaffold host; wrap it if you need external gutters.

## Scaffold and pane inputs

All three scaffolds share these interfaces:

| Input            | Purpose                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `navigator`      | Local or Router-backed controller; scope one controller to one live scaffold           |
| `destination`    | Controlled destination without a navigator; do not bind both                           |
| `directive`      | Explicit partition/spacing/preferred-dimension policy instead of automatic calculation |
| `strategies`     | Full primary/secondary/tertiary adaptation strategy map                                |
| `order`          | Logical start-to-end role order                                                        |
| `height`         | Explicit available height in CSS pixels, or natural flow when unset                    |
| `expansionState` | Optional pair-keyed two-column size controller                                         |
| `autofocus`      | Control automatic destination focus behavior                                           |

`MatPaneDirective` supplies a template role plus `label` or `labelledBy` (one is required), `preferredWidth`, `preferredHeight`, and `initialFocus` (a selector within the pane). Floating-pane options are `levitationPosition`, `scrim`, `modal`, and `dragToResizeState`. Keep role assignments stable; duplicate roles and missing required panes are configuration errors.

Hidden panes are not keyboard- or screen-reader-interactive. Navigation can move focus to the destination’s configured target or first usable focus target. Resizing does not take focus away from a still-visible pane.

## Strategies and floating panes

Strategies are typed records, not CSS breakpoints:

```ts
readonly strategies: MatPaneAdaptStrategies = {
  primary: { type: 'Hide' },
  secondary: { type: 'Hide' },
  tertiary: { type: 'Levitate', onlyIfSinglePane: true },
};
```

Navigate to tertiary to float Extra on single-column layouts. On wider layouts this conditional policy behaves like normal Hide/Expanded selection. For always-floating Extra, omit `onlyIfSinglePane`. A non-current floating destination is hidden rather than occupying a background column.

```html
<ng-template
  matPane="tertiary"
  label="Message actions"
  levitationPosition="bottom"
  [modal]="true"
  [dragToResizeState]="sheet"
>
  <h2>Message actions</h2>
  <!-- Your content and a clearly named close action. -->
</ng-template>
```

```ts
readonly sheet = new MatPaneDragToResizeState({
  minSize: 96, maxSize: 560, partialSize: 280, initialValue: 'partial',
});
```

Positions are center/top/bottom/start/end, plus the two anchored modes `auto` and `popover`. Both follow the control that asked for the destination and both work for keyboard activation, because a click position is used when there is one and the focused control otherwise. Without either — programmatic navigation, or before the scaffold has been measured — they fall back to `center`.

- `auto` docks to the edge that control is proportionally closest to, so a pane opened from the left appears on the left instead of at a configured edge. Distances are compared as a fraction of the half-width and half-height, which stops a short scaffold from always winning vertically.
- `popover` places the pane beside the control the way a menu does: leading edges aligned (trailing edges under RTL), opening below the trigger when the pane fits there and above otherwise, and clamped inside the scaffold. Opening upwards anchors to the bottom edge, so the pane never needs to know its rendered height, and the height is capped to the space on the chosen side with the pane scrolling internally.

A modal pane is laid out against the viewport, so `popover` falls back to `center` for it. Resizing requires a docked edge; centered floating panes have no edge handle. The resize state is separate from `MatPaneExpansionState`. Dispose application-owned resize states with the owning component.

A levitated pane blocks the layout behind it by default. `scrim` draws a dimming layer over the scaffold and marks every other pane `inert`, so neither the pointer nor the keyboard reaches them, and activating the scrim emits `dismissRequest` with reason `scrim`. Set `[scrim]="false"` only for a genuinely passive floating pane such as a persistent tool palette.

`[modal]="true"` escalates from a scaffold-scoped scrim to a native modal dialog: the browser puts the pane in the top layer and makes everything outside it inert across the page, and no scrim is drawn because the browser supplies the backdrop. Because the top layer is positioned against the viewport, a modal pane is presented viewport-anchored (centred for `center`, docked to the window edge for `top`/`bottom`/`start`/`end`) instead of inside the scaffold. Prefer the default scrim while the scaffold is embedded in a page, and reserve modality for a real dialog.

Escape and scrim interactions emit `dismissRequest`; navigator-backed scaffolds request a previous nonfloating destination, while controlled owners must update their destination. Router navigation errors must be handled by the application.

## Split resizing

Expansion is enabled only when exactly two panes are Expanded. There is no splitter for three columns or Reflow rows. State is remembered per role pair, so List/Detail does not overwrite Detail/Extra sizing.

`MatPaneExpansionState` supports `setFirstPaneWidth`, `setFirstPaneProportion`, `clear`, `snapTo`, and `animateTo`, plus read-only width/anchor/interaction signals. Anchors use either `{ type: 'proportion', proportion }` or `{ type: 'offset', offset, edge: 'start' | 'end' }`. Register anchors in the constructor. Empty anchors mean no release snapping.

**Declare the resting width as an anchor.** The layout's own split position is not an anchor, so a width the user can return to has to be registered explicitly — this is how the AndroidX samples express a narrow list beside a wide detail pane:

```ts
readonly split = new MatPaneExpansionState({
  anchors: [
    { type: 'proportion', proportion: 0 },
    { type: 'offset', offset: 280, edge: 'start' }, // narrow first pane, also the resting position
    { type: 'proportion', proportion: 0.5 },
    { type: 'offset', offset: 280, edge: 'end' },
    { type: 'proportion', proportion: 1 },
  ],
  initialAnchor: { type: 'offset', offset: 280, edge: 'start' },
});
```

Because `initialAnchor` is a registered anchor, the scaffold opens at that width instead of at the layout default. `clear()` is the only way back to the layout default, and it resets without animating.

The built-in separator supports pointer capture, logical left/right adjustment, Home/End, and Enter to cycle configured anchors. It remains available to restore an edge-collapsed pane. RTL reverses physical movement while preserving logical-first pane semantics. Resizing animations resolve `true` on completion and `false` when interrupted; reduced-motion presentation settles immediately.

## Navigation policies

The local navigator exposes read-only `history`, `currentDestination`, and `scaffoldValue` signals. `navigateTo(pane, key)` appends an entry; `reset` explicitly replaces history. Available keys are strings, finite numbers or null. History awareness can be disabled through layout configuration.

| Back policy                             | Target                                      |
| --------------------------------------- | ------------------------------------------- |
| `PopLatest`                             | Previous entry                              |
| `PopUntilScaffoldValueChange` (default) | First entry with a different adapted layout |
| `PopUntilCurrentDestinationChange`      | First different pane role                   |
| `PopUntilContentChange`                 | First different key or adapted layout       |

`canNavigateBack` and `peekPreviousScaffoldValue` use the same policy as `navigateBack`. A missing target returns false without deleting history. A wide layout may have multiple content visits but no previous distinct layout; use the policy appropriate to the application. No navigator intercepts browser Back on its own.

## Optional Angular Router integration

```ts
import {
  createMatPaneQueryParamCodec,
  createMatPaneRouterNavigator,
} from '@fairylights-studio/ngx-m3-adaptive/router';

// Call in an Angular injection context with Router provided.
readonly codec = createMatPaneQueryParamCodec({
  queryParam: 'panes',
  fallbackRoot: { pane: 'secondary', contentKey: null },
});
readonly panes = createMatPaneRouterNavigator(this.codec);
```

Pass this navigator to the scaffold exactly like the local one. The query-param codec preserves unrelated URL parameters and fragments. It encodes key types unambiguously and rejects malformed/oversized trails with a safe fallback. For application-specific paths, provide a `MatPaneRouterCodec` implementing `decode(RouterStateSnapshot)` and `encode(history): UrlTree`.

Only the initial Router snapshot and successful NavigationEnd commit state. Guards, cancellations and failures do not optimistically change panes. Await/catch returned navigation promises. Browser Back/Forward follows Router normally. Pane-policy Back encodes a shorter trail and uses replaceUrl by default; it is intentionally different from browser Back.

When templates become unavailable, route-backed committed history remains URL-owned; layout filters unavailable roles rather than silently rewriting the URL. For local state, invalid template destinations are normalized by the controller. Deep-link defaults and business route guards remain application concerns.

## Navigation Suite integration

Place the pane scaffold in the projected content area of `mat-navigation-suite-scaffold`, next to its `mat-navigation-suite`. Pane measurement follows the space remaining after rail layout, including expanded/collapsed rail transitions. Pane does not read navigation component internals or switch the navigation type. See **Adaptive / Navigation Suite** in Storybook.

## Development and validation

```sh
# Pure layout, navigation, codec and resizing state tests; no Angular build.
bun nx run @fairylights-studio/ngx-m3-adaptive:test

# Run interactively when you want to inspect the examples.
bun nx run storybook:storybook

# Against the Storybook server at its configured port.
bun nx run storybook:test-storybook
```

The browser runner needs Playwright’s browsers installed. Static examples and `Behavior/*` interaction tests are separate. Adaptive stories are checked with axe after their play functions. Browser checks, visual checks and SSR/hydration checks must be run in the appropriate environment; adding them is not a claim that they have been executed.

See [the source map, Web differences and validation checklist](WEB-ADAPTATION.md). Foldable detection, predictive Back and exact Compose physics are intentionally outside this package’s scope.
