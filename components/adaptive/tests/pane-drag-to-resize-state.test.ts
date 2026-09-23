import { describe, expect, test } from 'bun:test';
import { MatPaneDragToResizeState, paneResizeDelta } from '../src/lib/pane-drag-to-resize-state';

describe('docked edge pointer mapping', () => {
  test('growth follows the logical dock edge and direction', () => {
    expect(paneResizeDelta(10, 0, 'start', 'ltr')).toBe(10);
    expect(paneResizeDelta(10, 0, 'start', 'rtl')).toBe(-10);
    expect(paneResizeDelta(10, 0, 'end', 'ltr')).toBe(-10);
    expect(paneResizeDelta(10, 0, 'end', 'rtl')).toBe(10);
    expect(paneResizeDelta(0, 10, 'top')).toBe(10);
    expect(paneResizeDelta(0, 10, 'bottom')).toBe(-10);
    // The unused axis is ignored so a diagonal gesture cannot double count.
    expect(paneResizeDelta(999, 10, 'top')).toBe(10);
  });
  test('non-finite or unknown input is rejected', () => {
    expect(() => paneResizeDelta(Number.NaN, 0, 'start')).toThrow();
    expect(() => paneResizeDelta(0, Infinity, 'start')).toThrow();
    expect(() => paneResizeDelta(0, 0, 'left' as never)).toThrow();
  });
});

describe('sheet resize state', () => {
  test('starts at the requested stop and derives sizes from the bounds', () => {
    const state = new MatPaneDragToResizeState({
      minSize: 100,
      maxSize: 600,
      partialSize: 300,
      initialValue: 'partial',
    });
    expect(state.value()).toBe('partial');
    expect(state.size()).toBe(300);
    expect(state.bounds()).toEqual({ minSize: 100, maxSize: 600, partialSize: 300 });
  });
  test('re-clamping for a narrower container retains the requested partial stop', () => {
    const state = new MatPaneDragToResizeState({ minSize: 100, maxSize: 600, partialSize: 300 });
    state.configure({ minSize: 100, maxSize: 400 });
    expect(state.bounds().partialSize).toBe(300);
    expect(state.size()).toBe(300);
    state.configure({ minSize: 100, maxSize: 150 });
    expect(state.bounds().partialSize).toBe(150);
    expect(state.size()).toBe(150);
    // Widening again must restore the owner's requested stop rather than keep the squeezed value.
    state.configure({ minSize: 100, maxSize: 600 });
    expect(state.bounds().partialSize).toBe(300);
    expect(state.size()).toBe(300);
  });
  test('an explicit partial size always overrides the retained one', () => {
    const state = new MatPaneDragToResizeState({ minSize: 100, maxSize: 600, partialSize: 300 });
    state.configure({ minSize: 100, maxSize: 600, partialSize: 450 });
    expect(state.size()).toBe(450);
  });
  test('invalid bounds are rejected before any state changes', () => {
    const state = new MatPaneDragToResizeState({ minSize: 100, maxSize: 600, partialSize: 300 });
    expect(() => state.configure({ minSize: 500, maxSize: 200 })).toThrow();
    expect(() => state.configure({ minSize: -1, maxSize: 200 })).toThrow();
    expect(state.size()).toBe(300);
  });
  test('dragging clamps to the bounds and cancel keeps the reached size', () => {
    const state = new MatPaneDragToResizeState({ minSize: 100, maxSize: 600, partialSize: 300 });
    state.beginDrag();
    expect(state.isDragging()).toBe(true);
    state.dragBy(120);
    expect(state.size()).toBe(420);
    state.dragBy(9999);
    expect(state.size()).toBe(600);
    state.dragBy(-9999);
    expect(state.size()).toBe(100);
    state.cancelDrag();
    expect(state.isDragging()).toBe(false);
    expect(state.size()).toBe(100);
  });
  test('endDrag snaps to a stop and honours fling direction', async () => {
    const state = new MatPaneDragToResizeState({ minSize: 100, maxSize: 600, partialSize: 300 });
    state.beginDrag();
    state.dragBy(60);
    await expect(state.endDrag(0, 0)).resolves.toBe(true);
    expect(state.value()).toBe('partial');
    expect(state.size()).toBe(300);
    state.beginDrag();
    state.dragBy(20);
    await state.endDrag(1500, 0);
    expect(state.value()).toBe('expanded');
    expect(state.size()).toBe(600);
  });
  test('cycle advances collapsed, partial and expanded in order', async () => {
    const state = new MatPaneDragToResizeState({
      minSize: 100,
      maxSize: 600,
      partialSize: 300,
      initialValue: 'partial',
    });
    await state.cycle(0);
    expect(state.value()).toBe('expanded');
    await state.cycle(0);
    expect(state.value()).toBe('collapsed');
    await state.cycle(0);
    expect(state.value()).toBe('partial');
  });
  test('snapTo and animateTo settle without requiring an animation frame', async () => {
    const state = new MatPaneDragToResizeState({ minSize: 100, maxSize: 600, partialSize: 300 });
    state.snapTo('expanded');
    expect(state.size()).toBe(600);
    await expect(state.animateTo('collapsed', 0)).resolves.toBe(true);
    expect(state.size()).toBe(100);
    expect(state.isAnimating()).toBe(false);
  });
  test('destroyed state refuses further use and interrupts pending work', async () => {
    const state = new MatPaneDragToResizeState({
      minSize: 100,
      maxSize: 600,
      partialSize: 300,
      animationDuration: 40,
    });
    const pending = state.animateTo('expanded', 40);
    state.destroy();
    await expect(pending).resolves.toBe(false);
    expect(() => state.dragBy(10)).toThrow(/destroyed/);
  });
});
