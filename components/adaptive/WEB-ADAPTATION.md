# AndroidX reference and Web adaptation

This is a third-party Angular Material extension, not an official Angular or Google library. The implementation follows the behavior of the AndroidX source supplied for this project, not an older two-pane-only tutorial. Dimensions in this package are CSS pixels. Android dp values are design references, not physical unit conversions.

## Source map

Reference checkout: `/home/voyage200/Projects/Tasks/NavigationRail/support`. Upstream source can be browsed at [AndroidX Material 3 adaptive](https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:compose/material3/adaptive/). The upstream main branch may change independently of the supplied checkout.

Paths below are relative to `compose/material3/adaptive/`:

| Behavior                                                      | Source                                                                                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Size classes, columns, rows, spacing and preferred dimensions | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/PaneScaffoldDirective.kt`                                              |
| History priority and adaptation selection                     | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/ThreePaneScaffoldValue.kt`                                             |
| Hide, Reflow and Levitate policies                            | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/AdaptStrategy.kt`                                                      |
| Preferred width allocation and vertical reflow                | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/ThreePaneScaffold.kt`                                                  |
| List/detail role mapping and defaults                         | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/ListDetailPaneScaffold.kt`                                             |
| Supporting Reflow(Main) default                               | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/SupportingPaneScaffold.kt`                                             |
| Pair-keyed split state and anchors                            | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/PaneExpansionState.kt`                                                 |
| Floating sheet resizing                                       | `adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/DragToResizeState.kt`                                                  |
| Destination history and four back policies                    | `adaptive-navigation/src/commonMain/kotlin/androidx/compose/material3/adaptive/navigation/ThreePaneScaffoldNavigator.kt` and `BackNavigationBehavior.kt` |

Window thresholds are defined by `window/window-core/src/commonMain/kotlin/androidx/window/core/layout/WindowSizeClass.kt`.

## Deliberate platform differences

### Container adaptation, not activity-window adaptation

A Web layout can be embedded in another layout. A navigation rail, side panel or parent container changes the space actually available to panes without changing the viewport. ResizeObserver therefore measures the scaffold itself. Navigation Suite continues to choose its navigation chrome independently. Browser zoom naturally affects available CSS pixels.

A definite scaffold height is required for height-dependent Reflow and independent pane scrolling. Natural content height must not feed back into the decision to stack panes. Neither ResizeObserver nor DOM geometry is accessed on the server. Initial server/client structures match; the browser enhances the initial single-column view after rendering.

### State retention, not Compose recomposition

Each declared template is instantiated into a stable pane wrapper. Hiding, resizing or levitating it preserves its Angular component and DOM state. Hidden/collapsed content is removed from interaction and the accessibility tree. Business subscriptions in retained components continue running; applications should pause expensive work using the exposed adaptation state when appropriate. Removing a template destroys its content normally. No Bundle, rememberSaveable or implicit localStorage persistence is introduced.

### Local navigation versus browser navigation

Local navigation is a destination trail used for pane priority and policy-based Back. History is re-evaluated against the current layout rather than restoring old viewport snapshots. A wide layout may have no previous distinct layout even with several entries; callers must choose the appropriate policy rather than assume Back is always available.

Unlike the reference edge case, a local Back with no target is a safe no-op returning false. Clearing history is explicit.

The optional Router adapter treats the URL as committed state. It decodes successful Router navigations and does not install a second pushState/popstate controller. Canceled navigations do not update panes. A pane-policy Back requests the URL for an earlier trail and replaces the current entry by default; browser Back/Forward still traverse actual browser entries. They are different operations.

### Web input and accessibility

Pointer Events replace Android drag modifiers. Split handles are keyboard-operable separators with accessible names, controls and values. Logical directions are mapped to physical movement under RTL. Pointer cancellation and lost capture must release interaction state. Two-pane expansion applies only to exactly two Expanded panes; it does not add arbitrary splitters to three-column or Reflow layouts.

**Deliberate extension:** AndroidX `Levitate` takes a fixed `Alignment`, so its floating pane always appears where it was configured. The `auto` and `popover` values are our addition on top of that: `auto` derives the docked edge from the control that asked for the destination, and `popover` places the pane beside that control like a menu, flipping and clamping as needed. Every other position value maps directly to the upstream alignment idea.

A levitated pane blocks by default through a scrim drawn inside the scaffold: the panes behind it become `inert`, so pointer and keyboard both stop there while the pane keeps its position inside the scaffold. Opting out with `[scrim]="false"` leaves the layout behind fully usable, which suits only a passive floating pane.

A pane promoted with `[modal]="true"` uses a native modal dialog and the browser top layer instead, so the browser disables interaction outside it across the whole page and supplies the backdrop. That is a stronger boundary than any scripted scrim, but the top layer is positioned against the viewport, so the pane is presented viewport-anchored rather than inside the scaffold. Prefer the default scrim for a scaffold embedded in a page, and reserve modality for a real dialog. The pane retains its original Angular content either way.

### Motion

Use browser bounds/opacity transitions and honor `prefers-reduced-motion`. Interrupted operations settle on the latest requested state. Animation completion is cancellable and bounded rather than relying solely on transitionend. The package does not promise identical Compose springs, flings or animation frames.

## Out of scope

- Foldable hinges, excluded device regions, tabletop posture and hardware detection.
- Predictive or gesture-following Back and operating-system gesture exclusion.
- Porting Compose Modifier, Lookahead, coroutine or Navigation3 APIs.
- Automatic business data fetching, application guards, or a built-in application route hierarchy.
- Automatic persistence across reloads for local-only state. Use a Router codec or application-owned persistence when needed.

## Validation checklist

Automated pure tests live in `tests/`; interactive and static examples are under Storybook **Adaptive**. The Storybook runner applies axe WCAG A/AA and best-practice checks to Adaptive stories. A passing pure test suite is not a substitute for browser validation.

Before release, exercise the following in supported Chromium, Firefox and Safari versions:

1. Resize across 600, 840, 1200 and 1600 CSS pixels, and the 900-pixel explicit-height boundary. Expand/collapse a Navigation Suite rail without resizing the viewport.
2. Navigate list/detail/extra at narrow and wide widths. Check all four Back policies and same-pane different-content keys.
3. Type into an input, scroll a pane, hide it and restore it. Confirm component state and scroll position survive.
4. Exercise keyboard and pointer split handles in LTR/RTL; collapse each side, restore it, and interrupt a drag. Resize while at an anchor.
5. Open floating panes with the default scrim, with `[scrim]="false"`, and with `[modal]="true"`. Check that the scrim blocks pointer and keyboard access to the panes behind it, that Escape and scrim activation both dismiss, and that modal panes contain focus and restore it. Resize edge sheets with mouse, touch and keyboard.
6. Load a Router deep link directly; use browser Back/Forward and pane Back separately. Cancel navigation with a guard and try rapid navigation.
7. Test reduced motion, 200% zoom, initially hidden containers, dynamic template removal, teardown during animation, and narrow containers smaller than the normal gutter.
8. In a consuming SSR application, render without browser globals and hydrate with event replay enabled. Confirm there are no hydration mismatches or duplicate pane instances.

Per repository policy, builds and browser/SSR checks are not automatically run during this implementation. Consult the implementation report for the checks actually executed.
