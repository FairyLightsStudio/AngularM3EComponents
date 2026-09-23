import { computed, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, type RouterStateSnapshot, type UrlTree } from '@angular/router';
import {
  calculatePaneScaffoldValue,
  findPreviousPaneDestinationIndex,
  type MatPaneBackBehavior,
  type MatPaneContentKey,
  type MatPaneDestination,
  type MatPaneLayoutConfig,
  type MatPaneNavigator,
  type MatPaneRole,
} from '@fairylights-studio/ngx-m3-adaptive';
import { copyHistory } from './destinations';

/** Application-owned URL representation. decode should be total and side-effect free. */
export interface MatPaneRouterCodec {
  decode(snapshot: RouterStateSnapshot): readonly MatPaneDestination[];
  encode(history: readonly MatPaneDestination[]): UrlTree;
}

export interface MatPaneRouterNavigatorOptions {
  readonly initialConfig?: MatPaneLayoutConfig;
  /** Pane-policy Back replaces the current URL by default; it is NOT browser Back. */
  readonly replaceUrlOnBack?: boolean;
}

const DEFAULT_CONFIG: MatPaneLayoutConfig = {
  directive: {
    maxHorizontalPartitions: 1,
    maxVerticalPartitions: 1,
    horizontalPartitionSpacerSize: 0,
    verticalPartitionSpacerSize: 0,
    defaultPanePreferredWidth: 360,
    defaultPanePreferredHeight: 420,
  },
  availableRoles: ['primary', 'secondary', 'tertiary'],
};

/**
 * Create in an injection context. Only the initial Router snapshot and NavigationEnd
 * commit history. Returned promises retain Router semantics: cancellation is false;
 * navigation errors reject unless Router is configured to resolve them as false.
 * Callers must await/catch navigation promises. There is no detached promise chain.
 * Invalid codec output (including thrown decode errors) becomes an empty history.
 */
export function createMatPaneRouterNavigator(
  codec: MatPaneRouterCodec,
  options: MatPaneRouterNavigatorOptions = {},
): MatPaneNavigator {
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);
  const snapshotConfig = (config: MatPaneLayoutConfig): MatPaneLayoutConfig => {
    calculatePaneScaffoldValue(config);
    return Object.freeze({
      ...config,
      directive: Object.freeze({ ...config.directive }),
      availableRoles: Object.freeze([...config.availableRoles]),
      adaptStrategies: config.adaptStrategies
        ? Object.freeze({
            primary: Object.freeze({ ...config.adaptStrategies.primary }),
            secondary: Object.freeze({ ...config.adaptStrategies.secondary }),
            tertiary: Object.freeze({ ...config.adaptStrategies.tertiary }),
          })
        : undefined,
    });
  };
  const layout = signal(snapshotConfig(options.initialConfig ?? DEFAULT_CONFIG));
  let owner: object | undefined;
  const decode = () => {
    try {
      return copyHistory(codec.decode(router.routerState.snapshot));
    } catch {
      return copyHistory([]);
    }
  };
  const initialHistory = decode();
  const committed = signal(initialHistory);
  const subscription = router.events.subscribe((event) => {
    if (event instanceof NavigationEnd) committed.set(decode());
  });
  destroyRef.onDestroy(() => subscription.unsubscribe());
  const scaffoldValue = computed(() => calculatePaneScaffoldValue(layout(), committed()));
  const previousIndex = (behavior?: MatPaneBackBehavior) =>
    findPreviousPaneDestinationIndex(committed(), layout(), behavior);

  return {
    history: committed.asReadonly(),
    currentDestination: computed(() => committed().at(-1) ?? null),
    scaffoldValue,
    configure(config, nextOwner) {
      if (owner && owner !== nextOwner)
        throw new Error('Pane navigator is already owned by another scaffold.');
      // Layout may hide unavailable roles; never prune or write the committed URL trail.
      const nextConfig = snapshotConfig(config);
      owner = nextOwner;
      layout.set(nextConfig);
    },
    release(releasedOwner) {
      if (owner === releasedOwner) owner = undefined;
    },
    navigateTo(pane: MatPaneRole, contentKey: MatPaneContentKey = null) {
      const next = copyHistory([...committed(), { pane, contentKey }]);
      if (owner && !layout().availableRoles.includes(pane))
        throw new Error('Pane role is unavailable in the owning scaffold.');
      return router.navigateByUrl(codec.encode(next));
    },
    reset(history: readonly MatPaneDestination[] = initialHistory) {
      return router.navigateByUrl(codec.encode(copyHistory(history)));
    },
    canNavigateBack(behavior) {
      return previousIndex(behavior) >= 0;
    },
    peekPreviousScaffoldValue(behavior) {
      const index = previousIndex(behavior);
      return index < 0
        ? scaffoldValue()
        : calculatePaneScaffoldValue(layout(), committed().slice(0, index + 1));
    },
    navigateBack(behavior) {
      const index = previousIndex(behavior);
      if (index < 0) return false;
      return router.navigateByUrl(codec.encode(committed().slice(0, index + 1)), {
        replaceUrl: options.replaceUrlOnBack ?? true,
      });
    },
  };
}
