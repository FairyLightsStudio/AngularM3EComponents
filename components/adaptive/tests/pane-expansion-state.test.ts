import { describe, expect, test } from 'bun:test';
import {
  MatPaneExpansionState,
  resolvePaneExpansionAnchor,
  type MatPaneExpansionAnchor,
} from '../src/lib/pane-expansion-state';

const anchors: readonly MatPaneExpansionAnchor[] = [
  { type: 'proportion', proportion: 0.3 },
  { type: 'proportion', proportion: 0.5 },
  { type: 'offset', offset: 120, edge: 'end' },
];

describe('expansion anchors', () => {
  test('proportional and edge offsets resolve against available width', () => {
    expect(resolvePaneExpansionAnchor({ type: 'proportion', proportion: 0.25 }, 800)).toBe(200);
    expect(resolvePaneExpansionAnchor({ type: 'offset', offset: 120, edge: 'start' }, 800)).toBe(
      120,
    );
    expect(resolvePaneExpansionAnchor({ type: 'offset', offset: 120, edge: 'end' }, 800)).toBe(680);
  });
  test('anchors clamp into the allowed range instead of overflowing', () => {
    expect(resolvePaneExpansionAnchor({ type: 'proportion', proportion: 1 }, 500, 100, 300)).toBe(
      300,
    );
    expect(
      resolvePaneExpansionAnchor({ type: 'offset', offset: 0, edge: 'start' }, 500, 100, 300),
    ).toBe(100);
  });
  test('invalid input is rejected', () => {
    expect(() =>
      resolvePaneExpansionAnchor({ type: 'proportion', proportion: 1.5 }, 500),
    ).toThrow();
    expect(() =>
      resolvePaneExpansionAnchor({ type: 'proportion', proportion: Number.NaN }, 500),
    ).toThrow();
    expect(() =>
      resolvePaneExpansionAnchor({ type: 'offset', offset: -1, edge: 'start' }, 500),
    ).toThrow();
    expect(() =>
      resolvePaneExpansionAnchor({ type: 'offset', offset: 10, edge: 'left' as never }, 500),
    ).toThrow();
    expect(
      () =>
        new MatPaneExpansionState({ anchors: [{ type: 'proportion', proportion: -0.1 } as never] }),
    ).toThrow();
  });
});

describe('expansion sizing', () => {
  test('no configured setting leaves the layout default in charge', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    expect(state.firstPaneWidth()).toBeNull();
    expect(state.currentAnchor()).toBeNull();
  });
  test('explicit widths and proportions are clamped to the available width', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    state.setFirstPaneWidth(400);
    expect(state.firstPaneWidth()).toBe(400);
    state.setFirstPaneWidth(5000);
    expect(state.firstPaneWidth()).toBe(1000);
    state.setFirstPaneProportion(0.3);
    expect(state.firstPaneWidth()).toBe(300);
    expect(state.firstPaneProportion()).toBe(0.3);
    expect(() => state.setFirstPaneProportion(2)).toThrow();
    state.setFirstPaneWidth(250);
    expect(state.firstPaneProportion()).toBeNull();
  });
  test('settings are remembered per role pair, not shared globally', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    state.setFirstPaneWidth(400);
    state.configure(['primary', 'tertiary'], 1000);
    expect(state.firstPaneWidth()).toBeNull();
    state.setFirstPaneProportion(0.25);
    expect(state.firstPaneWidth()).toBe(250);
    state.configure(['secondary', 'primary'], 1000);
    expect(state.firstPaneWidth()).toBe(400);
    expect(state.pair()).toEqual(['secondary', 'primary']);
  });
  test('a min/max window narrower than the pane still yields a usable width', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000, 200, 600);
    state.setFirstPaneWidth(900);
    expect(state.firstPaneWidth()).toBe(600);
    state.configure(['secondary', 'primary'], 300, 200, 600);
    expect(state.firstPaneWidth()).toBe(300);
    state.configure(null, 0);
    expect(state.firstPaneWidth()).toBeNull();
  });
  test('clear removes remembered state for the active pair only', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    state.setFirstPaneWidth(400);
    state.configure(['primary', 'tertiary'], 1000);
    state.setFirstPaneWidth(700);
    state.clear();
    expect(state.firstPaneWidth()).toBeNull();
    state.configure(['secondary', 'primary'], 1000);
    expect(state.firstPaneWidth()).toBe(400);
  });
  test('destroyed state refuses further use', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.destroy();
    expect(() => state.setFirstPaneWidth(100)).toThrow(/destroyed/);
  });
});

describe('expansion dragging and anchors', () => {
  test('dragging is clamped and a cancelled drag keeps the reached width', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000, 150, 800);
    // A renderer passes the width it is currently painting so the first delta never teleports.
    state.beginDrag(300);
    expect(state.isDragging()).toBe(true);
    state.dragBy(100);
    expect(state.firstPaneWidth()).toBe(400);
    state.dragBy(9999);
    expect(state.firstPaneWidth()).toBe(800);
    // Reversing out of a clamped edge must respond immediately instead of ratcheting at the limit.
    state.dragBy(-9999);
    expect(state.firstPaneWidth()).toBe(400);
    state.dragBy(-9999);
    expect(state.firstPaneWidth()).toBe(150);
    state.cancelDrag();
    expect(state.isDragging()).toBe(false);
    expect(state.firstPaneWidth()).toBe(150);
  });
  test('endDrag snaps to the nearest anchor and honours fling direction', async () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    state.setFirstPaneWidth(480);
    await expect(state.endDrag(0, 0)).resolves.toBe(true);
    expect(state.firstPaneWidth()).toBe(500);
    state.beginDrag();
    state.dragBy(-300);
    await state.endDrag(0, 0);
    expect(state.firstPaneWidth()).toBe(300);
    state.beginDrag();
    state.dragBy(-50);
    await state.endDrag(1200, 0);
    // A fast fling continues in its direction rather than choosing the geometrically nearest anchor.
    expect(state.firstPaneWidth()).toBe(300);
  });
  test('no configured anchors means no automatic snapping', async () => {
    const state = new MatPaneExpansionState();
    state.configure(['secondary', 'primary'], 1000);
    state.setFirstPaneWidth(480);
    await expect(state.endDrag(0, 0)).resolves.toBe(true);
    expect(state.firstPaneWidth()).toBe(480);
    await expect(state.cycleAnchor(0)).resolves.toBe(false);
  });
  test('animateTo only accepts registered anchors and settles on interruption', async () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    expect(() => state.animateTo({ type: 'proportion', proportion: 0.9 })).toThrow(/registered/);
    await expect(state.animateTo(anchors[0], 0)).resolves.toBe(true);
    expect(state.firstPaneWidth()).toBe(300);
    expect(state.currentAnchor()).toEqual({ type: 'proportion', proportion: 0.3 });
  });
  test('cycleAnchor walks configured anchors in positional order and wraps', async () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    // Registered order is 0.3, 0.5 and end-offset 120 (which resolves to 880).
    await state.animateTo(anchors[0], 0);
    await state.cycleAnchor(0);
    expect(state.firstPaneWidth()).toBe(500);
    await state.cycleAnchor(0);
    expect(state.firstPaneWidth()).toBe(880);
    await state.cycleAnchor(0);
    expect(state.firstPaneWidth()).toBe(300);
  });
  test('a running animation resolves false when interrupted by a newer state', async () => {
    const state = new MatPaneExpansionState({ anchors, animationDuration: 40 });
    state.configure(['secondary', 'primary'], 1000);
    state.setFirstPaneWidth(300);
    const pending = state.animateTo(anchors[1], 40);
    state.setFirstPaneWidth(320);
    await expect(pending).resolves.toBe(false);
    expect(state.firstPaneWidth()).toBe(320);
  });
  test('reconfiguring the same pair and width is a no-op that preserves a drag', () => {
    const state = new MatPaneExpansionState({ anchors });
    state.configure(['secondary', 'primary'], 1000);
    state.beginDrag();
    state.configure(['secondary', 'primary'], 1000);
    expect(state.isDragging()).toBe(true);
  });
});
