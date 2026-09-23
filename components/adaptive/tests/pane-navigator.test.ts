import { describe, expect, test } from 'bun:test';
import {
  createListDetailPaneNavigator,
  createSupportingPaneNavigator,
  MatThreePaneScaffoldNavigator,
} from '../src/lib/pane-navigator';
import { calculatePaneScaffoldDirective } from '../src/lib/pane-layout';
import {
  MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
  MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
  type MatPaneLayoutConfig,
} from '../src/lib/pane-types';

const config = (
  width = 400,
  height = 800,
  availableRoles: MatPaneLayoutConfig['availableRoles'] = ['primary', 'secondary', 'tertiary'],
  strategies = MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
): MatPaneLayoutConfig => ({
  directive: calculatePaneScaffoldDirective(width, height),
  availableRoles,
  adaptStrategies: strategies,
});

describe('local pane navigator defaults', () => {
  test('list/detail starts on List and supporting starts on Main', () => {
    expect(createListDetailPaneNavigator().currentDestination()).toEqual({
      pane: 'secondary',
      contentKey: null,
    });
    expect(createSupportingPaneNavigator().currentDestination()).toEqual({
      pane: 'primary',
      contentKey: null,
    });
  });
  test('signals are read-only views and history is frozen', () => {
    const navigator = createListDetailPaneNavigator();
    expect(Object.isFrozen(navigator.history())).toBe(true);
    expect(Object.isFrozen(navigator.history()[0])).toBe(true);
    expect('set' in navigator.history).toBe(false);
  });
  test('supporting reflows under main through the navigator', () => {
    const navigator = createSupportingPaneNavigator({
      config: config(400, 900, ['primary', 'secondary'], MAT_SUPPORTING_PANE_ADAPT_STRATEGIES),
    });
    navigator.navigateTo('secondary', 'detail');
    expect(navigator.scaffoldValue().secondary).toEqual({ type: 'Reflowed', anchor: 'primary' });
  });
});

describe('local pane navigator writes', () => {
  test('navigateTo appends without de-duplicating and validates keys', () => {
    const navigator = createListDetailPaneNavigator();
    navigator.navigateTo('primary', 'a');
    navigator.navigateTo('primary', 'a');
    navigator.navigateTo('primary');
    expect(navigator.history().length).toBe(4);
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: null });
    expect(() => navigator.navigateTo('primary', Number.NaN)).toThrow();
    expect(() => navigator.navigateTo('detail' as never)).toThrow();
  });
  test('an unbound navigator accepts any role so callers can seed before rendering', () => {
    const navigator = createListDetailPaneNavigator();
    navigator.navigateTo('tertiary', 'inspector');
    expect(navigator.currentDestination()).toEqual({ pane: 'tertiary', contentKey: 'inspector' });
  });
  test('a bound navigator rejects roles the owning scaffold does not render', () => {
    const owner = {};
    const navigator = createListDetailPaneNavigator({
      config: config(400, 800, ['primary', 'secondary']),
    });
    navigator.configure(config(400, 800, ['primary', 'secondary']), owner);
    expect(() => navigator.navigateTo('tertiary', 'inspector')).toThrow(/unavailable/);
    expect(navigator.history().length).toBe(1);
  });
  test('a navigator refuses two live owners but allows the same owner to reconfigure', () => {
    const navigator = createListDetailPaneNavigator();
    const first = {},
      second = {};
    navigator.configure(config(), first);
    navigator.configure(config(1000), first);
    expect(navigator.history().length).toBe(1);
    expect(() => navigator.configure(config(), second)).toThrow(/multiple live scaffolds/);
  });
  test('releasing frees the navigator for a different scaffold', () => {
    const navigator = createListDetailPaneNavigator();
    const first = {},
      second = {};
    navigator.configure(config(), first);
    navigator.release(first);
    navigator.configure(config(), second);
    expect(() => navigator.configure(config(), first)).toThrow(/multiple live scaffolds/);
  });
});

describe('template removal normalization', () => {
  test('stale destinations are pruned and the trail never becomes empty', () => {
    const owner = {};
    const navigator = createListDetailPaneNavigator();
    navigator.configure(config(1200, 800, ['primary', 'secondary', 'tertiary']), owner);
    navigator.navigateTo('primary', 'selected');
    navigator.navigateTo('tertiary', 'inspector');
    expect(navigator.history().length).toBe(3);
    // Removing the tertiary template must not leave a destination with no pane.
    navigator.configure(config(1200, 800, ['primary', 'secondary']), owner);
    expect(navigator.history()).toEqual([
      { pane: 'secondary', contentKey: null },
      { pane: 'primary', contentKey: 'selected' },
    ]);
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: 'selected' });
    // Removing every destination role falls back to an available role instead of emptying.
    navigator.configure(config(1200, 800, ['tertiary']), owner);
    expect(navigator.history()).toEqual([{ pane: 'tertiary', contentKey: null }]);
  });
  test('resize alone never mutates history', () => {
    const owner = {};
    const navigator = createListDetailPaneNavigator();
    navigator.configure(config(1200, 900), owner);
    navigator.navigateTo('primary', 'a');
    const before = navigator.history();
    navigator.configure(config(420, 900), owner);
    navigator.configure(config(1500, 1200), owner);
    expect(navigator.history()).toBe(before);
  });
});

describe('local pane navigator back policies', () => {
  test('empty back is a safe no-op that preserves history', () => {
    const navigator = createListDetailPaneNavigator();
    const before = navigator.history();
    expect(navigator.canNavigateBack()).toBe(false);
    expect(navigator.navigateBack()).toBe(false);
    expect(navigator.history()).toBe(before);
    expect(navigator.history().length).toBe(1);
  });
  test('all four policies select their documented target', () => {
    const navigator = createListDetailPaneNavigator({ config: config(400) });
    navigator.navigateTo('primary', 'a');
    navigator.navigateTo('primary', 'b');
    navigator.navigateTo('primary', 'c');
    expect(navigator.navigateBack('PopLatest')).toBe(true);
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: 'b' });
    // In one column the adapted layout only differs at the single-entry root, so structural back
    // skips the intermediate primary entries and lands there directly.
    expect(navigator.peekPreviousScaffoldValue().secondary.type).toBe('Expanded');
    expect(navigator.canNavigateBack()).toBe(true);
    expect(navigator.navigateBack('PopUntilScaffoldValueChange')).toBe(true);
    expect(navigator.currentDestination()).toEqual({ pane: 'secondary', contentKey: null });
    expect(navigator.canNavigateBack()).toBe(false);
  });
  test('a wide layout can have no structural back while content back still works', () => {
    const navigator = createListDetailPaneNavigator({ config: config(1200) });
    navigator.navigateTo('primary', 'a');
    navigator.navigateTo('primary', 'b');
    // Every prefix expands all three panes, so no entry changes the adapted layout.
    expect(navigator.canNavigateBack()).toBe(false);
    expect(navigator.navigateBack()).toBe(false);
    expect(navigator.history().length).toBe(3);
    expect(navigator.canNavigateBack('PopUntilContentChange')).toBe(true);
    expect(navigator.navigateBack('PopUntilContentChange')).toBe(true);
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: 'a' });
  });
  test('content policy includes layout changes and peek agrees with navigateBack', () => {
    const navigator = createListDetailPaneNavigator({ config: config(400) });
    navigator.navigateTo('primary', 'a');
    navigator.navigateTo('primary', 'a');
    const peeked = navigator.peekPreviousScaffoldValue('PopUntilContentChange');
    expect(navigator.canNavigateBack('PopUntilContentChange')).toBe(true);
    navigator.navigateBack('PopUntilContentChange');
    expect(navigator.scaffoldValue()).toEqual(peeked);
    expect(navigator.history().length).toBe(1);
  });
  test('reset replaces history explicitly and restores the seeded trail by default', () => {
    const navigator = createListDetailPaneNavigator({
      initialHistory: [{ pane: 'primary', contentKey: 'deep-link' }],
    });
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: 'deep-link' });
    navigator.navigateTo('secondary');
    navigator.reset();
    expect(navigator.history()).toEqual([{ pane: 'primary', contentKey: 'deep-link' }]);
    navigator.reset([]);
    expect(navigator.history()).toEqual([]);
    expect(navigator.currentDestination()).toBeNull();
  });
  test('an unbound navigator can be constructed directly with a full history', () => {
    const navigator = new MatThreePaneScaffoldNavigator({
      initialHistory: [{ pane: 'tertiary', contentKey: 7 }],
    });
    expect(navigator.currentDestination()).toEqual({ pane: 'tertiary', contentKey: 7 });
  });
});
