import { describe, expect, test } from 'bun:test';
import {
  calculatePanePopoverPlacement,
  calculatePaneScaffoldDirective,
  calculatePaneScaffoldValue,
  calculatePaneRects,
  findPreviousPaneDestinationIndex,
  resolveAutoLevitationPosition,
} from '../src/lib/pane-layout';
import {
  MAT_LIST_DETAIL_PANE_ORDER,
  MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
  MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
  type MatPaneLayoutConfig,
  type MatPaneDestination,
  type MatPaneAdaptStrategies,
} from '../src/lib/pane-types';
const config = (width = 400, height = 800): MatPaneLayoutConfig => ({
  directive: calculatePaneScaffoldDirective(width, height),
  availableRoles: ['primary', 'secondary', 'tertiary'],
});
const destination = (
  pane: MatPaneDestination['pane'],
  contentKey: MatPaneDestination['contentKey'] = null,
): MatPaneDestination => ({ pane, contentKey });
describe('CSS pixel pane directives', () => {
  test.each([
    [0, 1, 360],
    [599, 1, 360],
    [600, 1, 360],
    [839, 1, 360],
    [840, 2, 360],
    [1199, 2, 360],
    [1200, 3, 412],
    [1599, 3, 412],
    [1600, 3, 412],
  ])('%s pixels yields %s columns', (width, columns, preferred) => {
    const d = calculatePaneScaffoldDirective(width, 900);
    expect(d.maxHorizontalPartitions).toBe(columns);
    expect(d.defaultPanePreferredWidth).toBe(preferred);
    expect(d.maxVerticalPartitions).toBe(columns === 1 ? 2 : 1);
    expect(d.horizontalPartitionSpacerSize).toBe(columns > 1 ? 24 : 0);
    expect(d.defaultPanePreferredHeight).toBe(420);
  });
  test('dense medium is opt-in; row threshold is exact', () => {
    expect(calculatePaneScaffoldDirective(600, 900, { dense: true }).maxHorizontalPartitions).toBe(
      2,
    );
    expect(calculatePaneScaffoldDirective(599, 900, { dense: true }).maxHorizontalPartitions).toBe(
      1,
    );
    expect(calculatePaneScaffoldDirective(400, 899).maxVerticalPartitions).toBe(1);
  });
  test('rejects non-finite or negative dimensions', () => {
    expect(() => calculatePaneScaffoldDirective(NaN, 100)).toThrow();
    expect(() => calculatePaneScaffoldDirective(100, -1)).toThrow();
  });
});
describe('priority and adaptation', () => {
  test('latest history first, then role priority', () => {
    const value = calculatePaneScaffoldValue(config(900), [
      destination('secondary'),
      destination('tertiary'),
    ]);
    expect(value.primary.type).toBe('Hidden');
    expect(value.secondary.type).toBe('Expanded');
    expect(value.tertiary.type).toBe('Expanded');
  });
  test('history awareness can be disabled', () => {
    const value = calculatePaneScaffoldValue({ ...config(900), isDestinationHistoryAware: false }, [
      destination('secondary'),
      destination('tertiary'),
    ]);
    expect(value.primary.type).toBe('Expanded');
    expect(value.secondary.type).toBe('Hidden');
  });
  test('missing optional roles consume no columns', () => {
    const value = calculatePaneScaffoldValue(
      { ...config(900), availableRoles: ['primary', 'secondary'] },
      [destination('tertiary')],
    );
    expect(value.tertiary.type).toBe('Hidden');
    expect(value.primary.type).toBe('Expanded');
    expect(value.secondary.type).toBe('Expanded');
  });
  test('supporting reflows under primary, even when supporting is latest', () => {
    const value = calculatePaneScaffoldValue(
      { ...config(400, 900), adaptStrategies: MAT_SUPPORTING_PANE_ADAPT_STRATEGIES },
      [destination('secondary')],
    );
    expect(value.primary.type).toBe('Expanded');
    expect(value.secondary).toEqual({ type: 'Reflowed', anchor: 'primary' });
  });
  test('reflow requires one column and tall height', () => {
    const c = config(900, 900);
    const value = calculatePaneScaffoldValue({
      ...c,
      directive: { ...c.directive, maxVerticalPartitions: 2 },
      adaptStrategies: MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
    });
    expect(value.secondary.type).toBe('Expanded');
    expect(
      calculatePaneScaffoldValue({
        ...config(),
        adaptStrategies: MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
      }).secondary.type,
    ).toBe('Hidden');
  });
  test('only one lower pane can reflow', () => {
    const strategies: MatPaneAdaptStrategies = {
      ...MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
      tertiary: { type: 'Reflow', anchor: 'primary' },
    };
    const value = calculatePaneScaffoldValue({ ...config(400, 900), adaptStrategies: strategies });
    expect(value.secondary.type).toBe('Reflowed');
    expect(value.tertiary.type).toBe('Hidden');
  });
  test('levitation is current-only; single-column restriction counts horizontal partitions', () => {
    const strategies: MatPaneAdaptStrategies = {
      ...MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
      tertiary: { type: 'Levitate', onlyIfSinglePane: true },
    };
    const compact = { ...config(400, 900), adaptStrategies: strategies };
    expect(calculatePaneScaffoldValue(compact, [destination('tertiary')]).tertiary.type).toBe(
      'Levitated',
    );
    expect(
      calculatePaneScaffoldValue(compact, [destination('tertiary'), destination('primary')])
        .tertiary.type,
    ).toBe('Hidden');
    expect(
      calculatePaneScaffoldValue({ ...config(1200), adaptStrategies: strategies }, [
        destination('tertiary'),
      ]).tertiary.type,
    ).toBe('Expanded');
  });
});
describe('pane rectangles', () => {
  test('surplus goes to primary and visual order is independent', () => {
    const c = config(1000);
    const rects = calculatePaneRects({
      width: 1000,
      height: 700,
      directive: c.directive,
      scaffoldValue: calculatePaneScaffoldValue(c),
      horizontalOrder: MAT_LIST_DETAIL_PANE_ORDER,
    });
    expect(rects.secondary).toEqual({ x: 0, y: 0, width: 360, height: 700 });
    expect(rects.primary).toEqual({ x: 384, y: 0, width: 616, height: 700 });
  });
  test('deficits are proportional and RTL mirrors positions', () => {
    const c = config(900);
    const value = calculatePaneScaffoldValue(c);
    const rects = calculatePaneRects({
      width: 324,
      height: 700,
      directive: c.directive,
      scaffoldValue: value,
      preferredWidths: { primary: 200, secondary: 100 },
      direction: 'rtl',
    });
    expect(rects.primary?.width).toBe(200);
    expect(rects.primary?.x).toBe(124);
    expect(rects.secondary?.x).toBe(0);
    const narrow = calculatePaneRects({
      width: 174,
      height: 700,
      directive: c.directive,
      scaffoldValue: value,
      preferredWidths: { primary: 200, secondary: 100 },
    });
    expect(narrow.primary?.width).toBe(100);
    expect(narrow.secondary?.width).toBe(50);
  });
  test('ultranarrow widths cannot allocate overflowing gutters', () => {
    const c = config(1200);
    const rects = calculatePaneRects({
      width: 10,
      height: 0,
      directive: c.directive,
      scaffoldValue: calculatePaneScaffoldValue(c),
    });
    for (const rect of Object.values(rects)) {
      expect(rect.width).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(10);
    }
  });
  test('reflow lower pane is never more than half available height', () => {
    const c = { ...config(400, 900), adaptStrategies: MAT_SUPPORTING_PANE_ADAPT_STRATEGIES };
    const rects = calculatePaneRects({
      width: 400,
      height: 900,
      directive: c.directive,
      scaffoldValue: calculatePaneScaffoldValue(c),
      preferredHeights: { secondary: 1000 },
    });
    expect(rects.secondary?.height).toBe(438);
    expect(rects.primary?.height).toBe(438);
    expect(rects.secondary?.y).toBe(462);
  });
});
describe('pure back policies', () => {
  const history = [
    destination('secondary'),
    destination('primary', 'a'),
    destination('primary', 'b'),
    destination('primary', 'b'),
  ];
  test('all four policies', () => {
    expect(findPreviousPaneDestinationIndex(history, config(), 'PopLatest')).toBe(2);
    expect(findPreviousPaneDestinationIndex(history, config())).toBe(0);
    expect(
      findPreviousPaneDestinationIndex(history, config(), 'PopUntilCurrentDestinationChange'),
    ).toBe(0);
    expect(findPreviousPaneDestinationIndex(history, config(), 'PopUntilContentChange')).toBe(1);
  });
  test('wide layouts may have no scaffold-changing back', () => {
    expect(findPreviousPaneDestinationIndex(history, config(1200))).toBe(-1);
    expect(findPreviousPaneDestinationIndex(history, config(1200), 'PopUntilContentChange')).toBe(
      1,
    );
  });
  test('content includes scaffold changes and empty/singleton are safe', () => {
    expect(
      findPreviousPaneDestinationIndex(
        [destination('secondary'), destination('primary')],
        config(),
        'PopUntilContentChange',
      ),
    ).toBe(0);
    expect(findPreviousPaneDestinationIndex([], config(), 'PopLatest')).toBe(-1);
    expect(findPreviousPaneDestinationIndex(history.slice(0, 1), config(), 'PopLatest')).toBe(-1);
  });
});
describe('automatic levitation placement', () => {
  test('docks to the edge the activation point is proportionally closest to', () => {
    expect(resolveAutoLevitationPosition({ x: 40, y: 300 }, 1000, 600)).toBe('start');
    expect(resolveAutoLevitationPosition({ x: 960, y: 300 }, 1000, 600)).toBe('end');
    expect(resolveAutoLevitationPosition({ x: 500, y: 20 }, 1000, 600)).toBe('top');
    expect(resolveAutoLevitationPosition({ x: 500, y: 580 }, 1000, 600)).toBe('bottom');
  });
  test('a click on one side never lands on the opposite side', () => {
    // Whatever vertical edge wins, an activation in the left half must never dock to the right.
    for (const y of [0, 150, 300, 450, 600]) {
      expect(resolveAutoLevitationPosition({ x: 400, y }, 1000, 600)).not.toBe('end');
      expect(resolveAutoLevitationPosition({ x: 600, y }, 1000, 600)).not.toBe('start');
    }
    // Mid height leaves only the horizontal edges in contention.
    expect(resolveAutoLevitationPosition({ x: 400, y: 300 }, 1000, 600)).toBe('start');
    expect(resolveAutoLevitationPosition({ x: 600, y: 300 }, 1000, 600)).toBe('end');
    // A left-hand control at mid height must dock left even though it is only 205px from the bottom,
    // which is closer in raw pixels than the 135px to the left edge is in a short scaffold.
    expect(resolveAutoLevitationPosition({ x: 135, y: 355 }, 1000, 560)).toBe('start');
  });
  test('unknown activation or unmeasured size falls back to the centre', () => {
    expect(resolveAutoLevitationPosition(null, 1000, 600)).toBe('center');
    expect(resolveAutoLevitationPosition({ x: 10, y: 10 }, 0, 600)).toBe('center');
    expect(resolveAutoLevitationPosition({ x: 10, y: 10 }, 1000, 0)).toBe('center');
    expect(resolveAutoLevitationPosition({ x: Number.NaN, y: 10 }, 1000, 600)).toBe('center');
  });
});
describe('popover levitation placement', () => {
  const trigger = { x: 100, y: 300, width: 120, height: 40 };
  const place = (overrides: Partial<Parameters<typeof calculatePanePopoverPlacement>[0]> = {}) =>
    calculatePanePopoverPlacement({
      trigger,
      scaffoldWidth: 1000,
      scaffoldHeight: 800,
      paneWidth: 320,
      paneHeight: 280,
      direction: 'ltr',
      ...overrides,
    });
  test('aligns leading edges and opens below a trigger that has room underneath', () => {
    const placement = place();
    expect(placement.x).toBe(100);
    expect(placement.top).toBe(348);
    expect(placement.bottom).toBeNull();
    expect(placement.maxHeight).toBe(452);
  });
  test('opens above a trigger near the bottom and anchors to the bottom edge', () => {
    const placement = place({ trigger: { x: 100, y: 700, width: 120, height: 40 } });
    expect(placement.top).toBeNull();
    expect(placement.bottom).toBe(108);
    expect(placement.maxHeight).toBe(692);
  });
  test('stays inside the scaffold when the trigger is near an edge', () => {
    expect(place({ trigger: { x: 950, y: 100, width: 40, height: 30 } }).x).toBe(672);
    expect(place({ trigger: { x: 2, y: 100, width: 40, height: 30 } }).x).toBe(8);
    expect(place({ trigger: { x: 950, y: 100, width: 40, height: 30 } }).maxWidth).toBe(984);
  });
  test('RTL aligns trailing edges where LTR aligns leading edges', () => {
    const trigger = { x: 800, y: 300, width: 120, height: 40 };
    expect(place({ trigger }).x).toBe(672); // LTR clamps the leading edge to the padded bound
    expect(place({ trigger, direction: 'rtl' }).x).toBe(600); // RTL aligns trailing edges
  });
  test('a pane wider than the scaffold is clamped to the padded width', () => {
    const placement = place({ paneWidth: 2000 });
    expect(placement.x).toBe(8);
    expect(placement.maxWidth).toBe(984);
  });
});
