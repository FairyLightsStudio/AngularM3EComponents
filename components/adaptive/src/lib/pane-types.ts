/** Public, framework-independent adaptive pane vocabulary. All dimensions are CSS pixels. */
export type MatPaneRole = 'primary' | 'secondary' | 'tertiary';
/**
 * Where a levitated pane is presented. `auto` follows the control that asked for the destination,
 * docking to the nearest edge instead of a configured one.
 */
export type MatPaneLevitationPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'start'
  | 'end'
  | 'auto'
  | 'popover';
export const MAT_PANE_LEVITATION_POSITIONS: readonly MatPaneLevitationPosition[] = Object.freeze([
  'center',
  'top',
  'bottom',
  'start',
  'end',
  'auto',
  'popover',
]);
/** Width a levitated pane falls back to when it declares no preferred width. */
export const MAT_PANE_DEFAULT_LEVITATED_WIDTH = 360;
/**
 * Height assumed for a levitated pane that declares none. Only `popover` placement reads it, to
 * decide whether the pane fits below its trigger; the pane itself keeps its natural height.
 */
export const MAT_PANE_ASSUMED_LEVITATED_HEIGHT = 320;
export type MatPaneContentKey = string | number | null;
export interface MatPaneDestination {
  readonly pane: MatPaneRole;
  readonly contentKey: MatPaneContentKey;
}
export type MatPaneAdaptedValue =
  | { readonly type: 'Expanded' }
  | { readonly type: 'Hidden' }
  | { readonly type: 'Reflowed'; readonly anchor: MatPaneRole }
  | { readonly type: 'Levitated' };
export type MatPaneScaffoldValue = Readonly<Record<MatPaneRole, MatPaneAdaptedValue>>;
export type MatPaneAdaptStrategy =
  | { readonly type: 'Hide' }
  | { readonly type: 'Reflow'; readonly anchor: MatPaneRole; readonly onlyIfSinglePane?: boolean }
  | { readonly type: 'Levitate'; readonly onlyIfSinglePane?: boolean };
export type MatPaneAdaptStrategies = Readonly<Record<MatPaneRole, MatPaneAdaptStrategy>>;
export interface MatPaneScaffoldDirective {
  readonly maxHorizontalPartitions: number;
  readonly maxVerticalPartitions: number;
  readonly horizontalPartitionSpacerSize: number;
  readonly verticalPartitionSpacerSize: number;
  readonly defaultPanePreferredWidth: number;
  readonly defaultPanePreferredHeight: number;
}
export interface MatPaneLayoutConfig {
  readonly directive: MatPaneScaffoldDirective;
  readonly availableRoles: readonly MatPaneRole[];
  readonly adaptStrategies?: MatPaneAdaptStrategies;
  readonly isDestinationHistoryAware?: boolean;
}
export type MatPaneBackBehavior =
  | 'PopLatest'
  | 'PopUntilScaffoldValueChange'
  | 'PopUntilCurrentDestinationChange'
  | 'PopUntilContentChange';
export interface MatPaneRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export const MAT_PANE_ROLES: readonly MatPaneRole[] = Object.freeze([
  'primary',
  'secondary',
  'tertiary',
]);
export const MAT_LIST_DETAIL_PANE_ORDER: readonly MatPaneRole[] = Object.freeze([
  'secondary',
  'primary',
  'tertiary',
]);
export const MAT_SUPPORTING_PANE_ORDER: readonly MatPaneRole[] = MAT_PANE_ROLES;
const hide = Object.freeze({ type: 'Hide' } as const);
export const MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES: MatPaneAdaptStrategies = Object.freeze({
  primary: hide,
  secondary: hide,
  tertiary: hide,
});
export const MAT_SUPPORTING_PANE_ADAPT_STRATEGIES: MatPaneAdaptStrategies = Object.freeze({
  primary: hide,
  secondary: Object.freeze({ type: 'Reflow', anchor: 'primary', onlyIfSinglePane: true }),
  tertiary: hide,
});
export function assertPaneRole(value: unknown): asserts value is MatPaneRole {
  if (value !== 'primary' && value !== 'secondary' && value !== 'tertiary')
    throw new TypeError('Invalid pane role.');
}
export function assertPaneContentKey(value: unknown): asserts value is MatPaneContentKey {
  if (
    value !== null &&
    typeof value !== 'string' &&
    (typeof value !== 'number' || !Number.isFinite(value))
  )
    throw new TypeError('Pane content keys must be strings, finite numbers, or null.');
}
export function validatePaneHistory(
  history: readonly MatPaneDestination[],
): readonly MatPaneDestination[] {
  return Object.freeze(
    history.map((item) => {
      assertPaneRole(item.pane);
      assertPaneContentKey(item.contentKey);
      return Object.freeze({ pane: item.pane, contentKey: item.contentKey });
    }),
  );
}
/** Reject invalid user dimensions rather than propagating NaN into styles. */
export function assertPaneDimension(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(name + ' must be a finite, non-negative CSS pixel value.');
}
