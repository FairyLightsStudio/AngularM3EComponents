import { computed, signal, type Signal } from '@angular/core';
import {
  calculatePaneScaffoldDirective,
  calculatePaneScaffoldValue,
  findPreviousPaneDestinationIndex,
  validatePaneLayoutConfig,
} from './pane-layout';
import {
  assertPaneContentKey,
  assertPaneRole,
  MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
  MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
  validatePaneHistory,
  type MatPaneBackBehavior,
  type MatPaneContentKey,
  type MatPaneDestination,
  type MatPaneLayoutConfig,
  type MatPaneRole,
  type MatPaneScaffoldValue,
} from './pane-types';

/** Shared by local and Router navigators; consumers cannot mutate their history signals. */
export interface MatPaneNavigator {
  readonly history: Signal<readonly MatPaneDestination[]>;
  readonly currentDestination: Signal<MatPaneDestination | null>;
  readonly scaffoldValue: Signal<MatPaneScaffoldValue>;
  configure(config: MatPaneLayoutConfig, owner?: object): void;
  release(owner: object): void;
  navigateTo(pane: MatPaneRole, contentKey?: MatPaneContentKey): void | Promise<boolean>;
  reset(history?: readonly MatPaneDestination[]): void | Promise<boolean>;
  canNavigateBack(behavior?: MatPaneBackBehavior): boolean;
  peekPreviousScaffoldValue(behavior?: MatPaneBackBehavior): MatPaneScaffoldValue;
  navigateBack(behavior?: MatPaneBackBehavior): boolean | Promise<boolean>;
}
export interface MatPaneNavigatorOptions {
  readonly initialHistory?: readonly MatPaneDestination[];
  readonly config?: MatPaneLayoutConfig;
}
export class MatThreePaneScaffoldNavigator implements MatPaneNavigator {
  private readonly entries = signal<readonly MatPaneDestination[]>([]);
  private readonly layout = signal<MatPaneLayoutConfig>({
    directive: calculatePaneScaffoldDirective(0, 0),
    availableRoles: ['primary', 'secondary'],
  });
  private owner: object | undefined;
  private readonly initialHistory: readonly MatPaneDestination[];
  readonly history = this.entries.asReadonly();
  readonly currentDestination = computed(() => this.entries().at(-1) ?? null);
  readonly scaffoldValue = computed(() =>
    calculatePaneScaffoldValue(this.layout(), this.entries()),
  );
  constructor(options: MatPaneNavigatorOptions = {}) {
    this.initialHistory = validatePaneHistory(
      options.initialHistory ?? [{ pane: 'primary', contentKey: null }],
    );
    this.entries.set(this.initialHistory);
    if (options.config) this.configure(options.config);
  }
  configure(config: MatPaneLayoutConfig, owner?: object): void {
    if (this.owner && this.owner !== owner)
      throw new Error('A pane navigator cannot be attached to multiple live scaffolds.');
    validatePaneLayoutConfig(config);
    if (owner) this.owner = owner;
    this.layout.set(
      Object.freeze({
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
      }),
    );
    // Only a bound owner knows which templates really exist, so prune then and never during resize alone.
    if (this.owner) this.pruneUnavailable();
  }
  release(owner: object): void {
    if (this.owner === owner) this.owner = undefined;
  }
  navigateTo(pane: MatPaneRole, contentKey: MatPaneContentKey = null): void {
    assertPaneRole(pane);
    assertPaneContentKey(contentKey);
    // Before binding, callers may seed a history for templates that do not exist yet.
    if (this.owner && !this.layout().availableRoles.includes(pane))
      throw new Error('Pane role "' + pane + '" is unavailable in the owning scaffold.');
    this.entries.update((history) =>
      Object.freeze([...history, Object.freeze({ pane, contentKey })]),
    );
  }
  /**
   * A template removed while its pane was a destination leaves a stale trail. Drop those entries so
   * Back and the current destination stay meaningful, and never leave the trail empty.
   */
  private pruneUnavailable(): void {
    const available = this.layout().availableRoles;
    if (!available.length) return;
    const history = this.entries();
    const pruned = history.filter((entry) => available.includes(entry.pane));
    if (pruned.length === history.length) return;
    this.entries.set(
      pruned.length
        ? Object.freeze(pruned)
        : Object.freeze([Object.freeze({ pane: available[0], contentKey: null })]),
    );
  }
  reset(history: readonly MatPaneDestination[] = this.initialHistory): void {
    this.entries.set(validatePaneHistory(history));
  }
  canNavigateBack(behavior?: MatPaneBackBehavior): boolean {
    return this.previousIndex(behavior) >= 0;
  }
  peekPreviousScaffoldValue(behavior?: MatPaneBackBehavior): MatPaneScaffoldValue {
    const index = this.previousIndex(behavior);
    return index < 0
      ? this.scaffoldValue()
      : calculatePaneScaffoldValue(this.layout(), this.entries().slice(0, index + 1));
  }
  navigateBack(behavior?: MatPaneBackBehavior): boolean {
    const index = this.previousIndex(behavior);
    if (index < 0) return false;
    this.entries.update((history) => Object.freeze(history.slice(0, index + 1)));
    return true;
  }
  private previousIndex(behavior?: MatPaneBackBehavior): number {
    return findPreviousPaneDestinationIndex(this.entries(), this.layout(), behavior);
  }
}
export function createListDetailPaneNavigator(
  options: MatPaneNavigatorOptions = {},
): MatThreePaneScaffoldNavigator {
  return new MatThreePaneScaffoldNavigator({
    initialHistory: options.initialHistory ?? [{ pane: 'secondary', contentKey: null }],
    config: options.config ?? {
      directive: calculatePaneScaffoldDirective(0, 0),
      availableRoles: ['primary', 'secondary'],
      adaptStrategies: MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
    },
  });
}
export function createSupportingPaneNavigator(
  options: MatPaneNavigatorOptions = {},
): MatThreePaneScaffoldNavigator {
  return new MatThreePaneScaffoldNavigator({
    initialHistory: options.initialHistory ?? [{ pane: 'primary', contentKey: null }],
    config: options.config ?? {
      directive: calculatePaneScaffoldDirective(0, 0),
      availableRoles: ['primary', 'secondary'],
      adaptStrategies: MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
    },
  });
}
