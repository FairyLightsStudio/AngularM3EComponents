import {
  assertPaneDimension,
  assertPaneRole,
  MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
  MAT_PANE_ROLES,
  type MatPaneAdaptedValue,
  type MatPaneBackBehavior,
  type MatPaneDestination,
  type MatPaneLayoutConfig,
  type MatPaneLevitationPosition,
  type MatPaneRect,
  type MatPaneRole,
  type MatPaneScaffoldDirective,
  type MatPaneScaffoldValue,
} from './pane-types';

export function calculatePaneScaffoldDirective(
  width: number,
  height: number,
  options: { dense?: boolean } = {},
): MatPaneScaffoldDirective {
  assertPaneDimension(width, 'width');
  assertPaneDimension(height, 'height');
  const columns = width >= 1200 ? 3 : width >= 840 || (options.dense && width >= 600) ? 2 : 1;
  const rows = columns === 1 && height >= 900 ? 2 : 1;
  return Object.freeze({
    maxHorizontalPartitions: columns,
    maxVerticalPartitions: rows,
    horizontalPartitionSpacerSize: columns > 1 ? 24 : 0,
    verticalPartitionSpacerSize: rows > 1 ? 24 : 0,
    defaultPanePreferredWidth: width >= 1200 ? 412 : 360,
    defaultPanePreferredHeight: 420,
  });
}
export function validatePaneLayoutConfig(config: MatPaneLayoutConfig): void {
  const d = config.directive;
  if (
    !Number.isInteger(d.maxHorizontalPartitions) ||
    d.maxHorizontalPartitions < 1 ||
    d.maxHorizontalPartitions > 3
  )
    throw new RangeError('Horizontal partitions must be 1, 2, or 3.');
  if (
    !Number.isInteger(d.maxVerticalPartitions) ||
    d.maxVerticalPartitions < 1 ||
    d.maxVerticalPartitions > 2
  )
    throw new RangeError('Vertical partitions must be 1 or 2.');
  for (const value of [
    d.horizontalPartitionSpacerSize,
    d.verticalPartitionSpacerSize,
    d.defaultPanePreferredWidth,
    d.defaultPanePreferredHeight,
  ])
    assertPaneDimension(value, 'directive dimension');
  config.availableRoles.forEach(assertPaneRole);
  if (new Set(config.availableRoles).size !== config.availableRoles.length)
    throw new TypeError('Available pane roles must be unique.');
  if (config.adaptStrategies)
    for (const role of MAT_PANE_ROLES) {
      const strategy = config.adaptStrategies[role];
      if (!strategy || !['Hide', 'Reflow', 'Levitate'].includes(strategy.type))
        throw new TypeError('Invalid pane adaptation strategy.');
      if (strategy.type === 'Reflow') {
        assertPaneRole(strategy.anchor);
        if (strategy.anchor === role) throw new TypeError('A pane cannot reflow under itself.');
      }
    }
}
/** History is newest-last; absent optional panes never consume a partition. */
export function calculatePaneScaffoldValue(
  config: MatPaneLayoutConfig,
  history: readonly MatPaneDestination[] = [],
): MatPaneScaffoldValue {
  validatePaneLayoutConfig(config);
  const { directive: d } = config;
  const strategies = config.adaptStrategies ?? MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES;
  const available = new Set(config.availableRoles);
  const entries = config.isDestinationHistoryAware === false ? history.slice(-1) : history;
  const priority = [
    ...new Set([
      ...entries
        .slice()
        .reverse()
        .map((item) => item.pane),
      ...MAT_PANE_ROLES,
    ]),
  ].filter((role) => available.has(role));
  const hidden: MatPaneAdaptedValue = Object.freeze({ type: 'Hidden' });
  const values: Record<MatPaneRole, MatPaneAdaptedValue> = {
    primary: hidden,
    secondary: hidden,
    tertiary: hidden,
  };
  const assigned = new Set<MatPaneRole>();
  let count = 0;
  const current = history.at(-1)?.pane;
  const active = (role: MatPaneRole) => {
    const s = strategies[role];
    return s.type === 'Hide' || !s.onlyIfSinglePane || d.maxHorizontalPartitions === 1;
  };
  if (
    current &&
    available.has(current) &&
    strategies[current].type === 'Levitate' &&
    active(current)
  ) {
    values[current] = { type: 'Levitated' };
    assigned.add(current);
  }
  const reflowAnchors = new Set<MatPaneRole>();
  for (const role of priority) {
    if (assigned.has(role)) continue;
    const strategy = strategies[role];
    // Active levitation is a destination-only overlay, never a background column.
    if (strategy.type === 'Levitate' && active(role)) continue;
    if (
      strategy.type === 'Reflow' &&
      active(role) &&
      d.maxHorizontalPartitions === 1 &&
      d.maxVerticalPartitions > 1 &&
      available.has(strategy.anchor) &&
      !reflowAnchors.has(strategy.anchor)
    ) {
      const anchor = strategy.anchor;
      if (
        !assigned.has(anchor) &&
        count < d.maxHorizontalPartitions &&
        !(strategies[anchor].type === 'Levitate' && active(anchor))
      ) {
        values[anchor] = { type: 'Expanded' };
        assigned.add(anchor);
        count++;
      }
      if (values[anchor].type === 'Expanded') {
        values[role] = { type: 'Reflowed', anchor };
        assigned.add(role);
        reflowAnchors.add(anchor);
        continue;
      }
    }
    if (count < d.maxHorizontalPartitions) {
      values[role] = { type: 'Expanded' };
      assigned.add(role);
      count++;
    }
  }
  for (const role of MAT_PANE_ROLES) Object.freeze(values[role]);
  return Object.freeze(values);
}
/** Material naming alias for the three-role scaffold calculation. */
export const calculateThreePaneScaffoldValue = calculatePaneScaffoldValue;

export function paneScaffoldValuesEqual(a: MatPaneScaffoldValue, b: MatPaneScaffoldValue): boolean {
  return MAT_PANE_ROLES.every((role) => {
    const x = a[role],
      y = b[role];
    return (
      x.type === y.type &&
      (x.type !== 'Reflowed' || (y.type === 'Reflowed' && x.anchor === y.anchor))
    );
  });
}
/** Returns -1 when back would have no effect. It never removes the final entry. */
export function findPreviousPaneDestinationIndex(
  history: readonly MatPaneDestination[],
  config: MatPaneLayoutConfig,
  behavior: MatPaneBackBehavior = 'PopUntilScaffoldValueChange',
): number {
  if (
    ![
      'PopLatest',
      'PopUntilScaffoldValueChange',
      'PopUntilCurrentDestinationChange',
      'PopUntilContentChange',
    ].includes(behavior)
  )
    throw new TypeError('Invalid pane back behavior.');
  const current = history.at(-1);
  if (!current || history.length < 2) return -1;
  if (behavior === 'PopLatest') return history.length - 2;
  const value = calculatePaneScaffoldValue(config, history);
  for (let i = history.length - 2; i >= 0; i--) {
    const previous = history[i];
    if (behavior === 'PopUntilCurrentDestinationChange') {
      if (previous.pane !== current.pane) return i;
    } else if (
      (behavior === 'PopUntilContentChange' && previous.contentKey !== current.contentKey) ||
      !paneScaffoldValuesEqual(value, calculatePaneScaffoldValue(config, history.slice(0, i + 1)))
    )
      return i;
  }
  return -1;
}
export interface MatPaneRectOptions {
  readonly width: number;
  readonly height: number;
  readonly directive: MatPaneScaffoldDirective;
  readonly scaffoldValue: MatPaneScaffoldValue;
  readonly horizontalOrder?: readonly MatPaneRole[];
  readonly preferredWidths?: Partial<Record<MatPaneRole, number>>;
  readonly preferredHeights?: Partial<Record<MatPaneRole, number>>;
  /** Width of the logical first pane, excluding the gutter. Only used for exactly two columns. */
  readonly firstPaneWidth?: number | null;
  readonly direction?: 'ltr' | 'rtl';
}
export function calculatePaneRects(
  options: MatPaneRectOptions,
): Partial<Record<MatPaneRole, MatPaneRect>> {
  const { width, height, directive: d, scaffoldValue: value } = options;
  assertPaneDimension(width, 'width');
  assertPaneDimension(height, 'height');
  const order = [...new Set([...(options.horizontalOrder ?? MAT_PANE_ROLES), ...MAT_PANE_ROLES])];
  const expanded = order.filter((role) => value[role].type === 'Expanded');
  const gap =
    expanded.length > 1
      ? Math.min(d.horizontalPartitionSpacerSize, width / (expanded.length - 1))
      : 0;
  const usable = Math.max(0, width - gap * Math.max(0, expanded.length - 1));
  const widths = expanded.map((role) => {
    const n = options.preferredWidths?.[role] ?? d.defaultPanePreferredWidth;
    assertPaneDimension(n, 'preferred width');
    return n;
  });
  const total = widths.reduce((sum, n) => sum + n, 0);
  if (expanded.length === 2 && options.firstPaneWidth != null) {
    assertPaneDimension(options.firstPaneWidth, 'first pane width');
    widths[0] = Math.min(usable, options.firstPaneWidth);
    widths[1] = usable - widths[0];
  } else if (total > usable) {
    for (let i = 0; i < widths.length; i++) widths[i] *= usable / total;
  } else if (expanded.length) {
    const highest = MAT_PANE_ROLES.find((role) => expanded.includes(role));
    if (highest) widths[expanded.indexOf(highest)] += usable - total;
  }
  const rects: Partial<Record<MatPaneRole, MatPaneRect>> = {};
  let x = 0;
  expanded.forEach((role, i) => {
    const w = widths[i];
    rects[role] = { x: options.direction === 'rtl' ? width - x - w : x, y: 0, width: w, height };
    x += w + gap;
  });
  for (const role of order) {
    const state = value[role];
    if (state.type !== 'Reflowed') continue;
    const anchor = rects[state.anchor];
    if (!anchor) continue;
    const verticalGap = Math.min(height, d.verticalPartitionSpacerSize);
    const preferred = options.preferredHeights?.[role] ?? d.defaultPanePreferredHeight;
    assertPaneDimension(preferred, 'preferred height');
    const lower = Math.min(preferred, Math.max(0, (height - verticalGap) / 2));
    rects[state.anchor] = { ...anchor, height: height - verticalGap - lower };
    rects[role] = { ...anchor, y: height - lower, height: lower };
  }
  // Overlay positioning is owned by the levitated-pane renderer, not the column allocator.
  return rects;
}
/** Gap between a popover pane and its trigger, and the smallest margin kept inside the scaffold. */
const popoverGap = 8;
const popoverPadding = 8;
export interface MatPanePopoverPlacement {
  /** Inline offset of the pane's leading edge, in scaffold CSS pixels. */
  readonly x: number;
  /** Distance from the scaffold's top edge, or null when the pane is anchored to the bottom. */
  readonly top: number | null;
  /** Distance from the scaffold's bottom edge, or null when the pane is anchored to the top. */
  readonly bottom: number | null;
  readonly maxWidth: number;
  readonly maxHeight: number;
}
export interface MatPanePopoverOptions {
  readonly trigger: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly scaffoldWidth: number;
  readonly scaffoldHeight: number;
  readonly paneWidth: number;
  /** Assumed height, used only to decide whether the pane fits below the trigger. */
  readonly paneHeight: number;
  readonly direction: 'ltr' | 'rtl';
}
/**
 * Places a levitated pane beside the control that opened it, the way a menu or popover does: leading
 * edges are aligned, the pane opens below its trigger when it fits there and above otherwise, and it
 * is clamped inside the scaffold. Anchoring to the bottom edge when opening upwards means the pane
 * never has to know its own rendered height.
 */
export function calculatePanePopoverPlacement(
  options: MatPanePopoverOptions,
): MatPanePopoverPlacement {
  const { trigger, scaffoldWidth, scaffoldHeight, paneWidth, paneHeight, direction } = options;
  assertPaneDimension(scaffoldWidth, 'scaffold width');
  assertPaneDimension(scaffoldHeight, 'scaffold height');
  assertPaneDimension(paneWidth, 'pane width');
  assertPaneDimension(paneHeight, 'pane height');
  const maxWidth = Math.max(0, scaffoldWidth - popoverPadding * 2);
  const width = Math.min(paneWidth, maxWidth);
  const leading = direction === 'rtl' ? trigger.x + trigger.width - width : trigger.x;
  const x = Math.max(popoverPadding, Math.min(leading, scaffoldWidth - width - popoverPadding));
  const spaceBelow = scaffoldHeight - (trigger.y + trigger.height) - popoverGap;
  const spaceAbove = trigger.y - popoverGap;
  const opensBelow = spaceBelow >= paneHeight || spaceBelow >= spaceAbove;
  return opensBelow
    ? {
        x,
        top: trigger.y + trigger.height + popoverGap,
        bottom: null,
        maxWidth,
        maxHeight: Math.max(0, spaceBelow),
      }
    : {
        x,
        top: null,
        bottom: scaffoldHeight - trigger.y + popoverGap,
        maxWidth,
        maxHeight: Math.max(0, spaceAbove),
      };
}
/**
 * Docked edge for a floating pane that asked for `auto`, chosen from the point that opened it so the
 * pane stays on the side the user acted on.
 *
 * Distances are compared as a fraction of the half-width and half-height rather than in pixels. Raw
 * pixel distances would let a short scaffold always win vertically — in a 1000x600 box every click is
 * within 300px of the top or bottom — and the pane would dock vertically for controls that are
 * plainly on the left or right. Ties favour the horizontal edges.
 *
 * Falls back to the centre when the activation point or the measured size is unknown, which keeps the
 * result predictable before measurement and for programmatic navigation.
 */
export function resolveAutoLevitationPosition(
  point: { readonly x: number; readonly y: number } | null,
  width: number,
  height: number,
): MatPaneLevitationPosition {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return 'center';
  if (!(width > 0) || !(height > 0)) return 'center';
  const horizontal = Math.min(point.x, width - point.x) / (width / 2);
  const vertical = Math.min(point.y, height - point.y) / (height / 2);
  if (horizontal <= vertical) return point.x <= width / 2 ? 'start' : 'end';
  return point.y <= height / 2 ? 'top' : 'bottom';
}
