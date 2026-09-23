import { computed, signal } from '@angular/core';
import { assertPaneDimension, assertPaneRole, type MatPaneRole } from './pane-types';

export type MatPaneExpansionPair = readonly [MatPaneRole, MatPaneRole];
export type MatPaneExpansionAnchor =
  | { readonly type: 'proportion'; readonly proportion: number }
  | { readonly type: 'offset'; readonly offset: number; readonly edge: 'start' | 'end' };
export interface MatPaneExpansionStateOptions {
  readonly anchors?: readonly MatPaneExpansionAnchor[];
  readonly initialAnchor?: MatPaneExpansionAnchor;
  readonly animationDuration?: number;
}
type Setting =
  | { readonly type: 'width'; readonly width: number }
  | { readonly type: 'proportion'; readonly proportion: number }
  | { readonly type: 'anchor'; readonly anchor: MatPaneExpansionAnchor };
function validateAnchor(anchor: MatPaneExpansionAnchor): void {
  if (anchor.type === 'proportion') {
    if (!Number.isFinite(anchor.proportion) || anchor.proportion < 0 || anchor.proportion > 1)
      throw new RangeError('Anchor proportion must be between zero and one.');
  } else if (anchor.type === 'offset') {
    assertPaneDimension(anchor.offset, 'anchor offset');
    if (anchor.edge !== 'start' && anchor.edge !== 'end')
      throw new TypeError('Invalid anchor edge.');
  } else throw new TypeError('Invalid expansion anchor.');
}
export function resolvePaneExpansionAnchor(
  anchor: MatPaneExpansionAnchor,
  availableWidth: number,
  minWidth = 0,
  maxWidth = availableWidth,
): number {
  validateAnchor(anchor);
  assertPaneDimension(availableWidth, 'available width');
  assertPaneDimension(minWidth, 'minimum width');
  assertPaneDimension(maxWidth, 'maximum width');
  if (maxWidth < minWidth) throw new RangeError('Maximum width must not be below minimum width.');
  const raw =
    anchor.type === 'proportion'
      ? availableWidth * anchor.proportion
      : anchor.edge === 'start'
        ? anchor.offset
        : availableWidth - anchor.offset;
  return Math.max(Math.min(minWidth, availableWidth), Math.min(raw, maxWidth, availableWidth));
}
/** Pair-local logical sizing. No DOM, injection context, or Zone.js is needed. */
export class MatPaneExpansionState {
  private readonly activePair = signal<MatPaneExpansionPair | null>(null);
  private readonly setting = signal<Setting | null>(null);
  private readonly bounds = signal({ width: 0, min: 0, max: 0 });
  private readonly transientWidth = signal<number | null>(null);
  private readonly animating = signal(false);
  private readonly dragging = signal(false);
  private readonly saved = new Map<string, Setting | null>();
  /** Anchors callers may animate to. Renderers read this to offer keyboard anchor cycling. */
  readonly anchors: readonly MatPaneExpansionAnchor[];
  private readonly initialAnchor: MatPaneExpansionAnchor | undefined;
  private readonly duration: number;
  private dragOrigin: number | null = null;
  private dragAccumulated = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private settle: ((completed: boolean) => void) | undefined;
  private destroyed = false;
  readonly pair = this.activePair.asReadonly();
  readonly isAnimating = this.animating.asReadonly();
  readonly isDragging = this.dragging.asReadonly();
  readonly currentAnchor = computed(() => {
    const s = this.setting();
    return s?.type === 'anchor' ? s.anchor : null;
  });
  readonly firstPaneProportion = computed(() => {
    const s = this.setting();
    return s?.type === 'proportion' ? s.proportion : null;
  });
  readonly firstPaneWidth = computed(() => this.resolveFirstPaneWidth());
  constructor(options: MatPaneExpansionStateOptions = {}) {
    const anchors = options.anchors ?? [];
    anchors.forEach(validateAnchor);
    if (options.initialAnchor) validateAnchor(options.initialAnchor);
    this.anchors = Object.freeze(anchors.map((anchor) => Object.freeze({ ...anchor })));
    this.initialAnchor = options.initialAnchor
      ? Object.freeze({ ...options.initialAnchor })
      : undefined;
    this.duration = options.animationDuration ?? 200;
    assertPaneDimension(this.duration, 'animation duration');
  }
  configure(
    pair: MatPaneExpansionPair | null,
    availableWidth: number,
    minWidth = 0,
    maxWidth = availableWidth,
  ): void {
    this.assertAlive();
    assertPaneDimension(availableWidth, 'available width');
    assertPaneDimension(minWidth, 'minimum width');
    assertPaneDimension(maxWidth, 'maximum width');
    if (maxWidth < minWidth) throw new RangeError('Maximum width must not be below minimum width.');
    if (pair) {
      assertPaneRole(pair[0]);
      assertPaneRole(pair[1]);
      if (pair[0] === pair[1]) throw new TypeError('Expansion requires two distinct panes.');
    }
    const oldKey = this.key(this.activePair()),
      newKey = this.key(pair);
    const oldBounds = this.bounds();
    if (
      oldKey === newKey &&
      oldBounds.width === availableWidth &&
      oldBounds.min === minWidth &&
      oldBounds.max === maxWidth
    )
      return;
    this.cancelAnimation();
    this.dragging.set(false);
    this.bounds.set({ width: availableWidth, min: minWidth, max: maxWidth });
    if (oldKey !== newKey) {
      this.activePair.set(pair ? Object.freeze([pair[0], pair[1]] as const) : null);
      this.setting.set(
        newKey
          ? this.saved.has(newKey)
            ? (this.saved.get(newKey) ?? null)
            : this.initialAnchor
              ? { type: 'anchor', anchor: this.initialAnchor }
              : null
          : null,
      );
    }
  }
  resolveFirstPaneWidth(availableWidth = this.bounds().width): number | null {
    assertPaneDimension(availableWidth, 'available width');
    if (!this.activePair()) return null;
    const b = this.bounds(),
      transient = this.transientWidth(),
      s = this.setting();
    if (transient !== null) return this.clamp(transient, availableWidth);
    if (!s) return null;
    if (s.type === 'anchor')
      return resolvePaneExpansionAnchor(s.anchor, availableWidth, b.min, b.max);
    return this.clamp(s.type === 'width' ? s.width : availableWidth * s.proportion, availableWidth);
  }
  setFirstPaneWidth(width: number): void {
    this.assertAlive();
    assertPaneDimension(width, 'first pane width');
    this.cancelAnimation();
    this.save({ type: 'width', width });
  }
  setFirstPaneProportion(proportion: number): void {
    this.assertAlive();
    validateAnchor({ type: 'proportion', proportion });
    this.cancelAnimation();
    this.save({ type: 'proportion', proportion });
  }
  clear(): void {
    this.assertAlive();
    this.cancelAnimation();
    this.dragging.set(false);
    this.dragOrigin = null;
    this.dragAccumulated = 0;
    const key = this.key(this.activePair());
    if (key) this.saved.set(key, null);
    this.setting.set(null);
  }
  /**
   * Starts a pointer interaction. Pass the first pane's current painted width so dragging is relative
   * to what the user sees; without it the state falls back to the last resolved width or midpoint.
   */
  beginDrag(startWidth?: number): void {
    this.assertAlive();
    this.cancelAnimation();
    if (startWidth !== undefined) assertPaneDimension(startWidth, 'drag start width');
    if (!this.activePair()) {
      this.dragOrigin = null;
      this.dragAccumulated = 0;
      return;
    }
    this.dragOrigin = startWidth ?? this.resolveFirstPaneWidth() ?? this.bounds().width / 2;
    this.dragAccumulated = 0;
    this.dragging.set(true);
  }
  dragBy(delta: number): void {
    this.assertAlive();
    if (!Number.isFinite(delta)) throw new RangeError('Drag delta must be finite.');
    if (!this.activePair()) return;
    if (!this.dragging()) this.beginDrag();
    // Accumulate from the drag origin rather than the clamped result, so reversing out of an edge
    // responds immediately instead of ratcheting.
    const origin = this.dragOrigin ?? this.resolveFirstPaneWidth() ?? this.bounds().width / 2;
    this.dragAccumulated += delta;
    this.save({ type: 'width', width: this.clamp(origin + this.dragAccumulated) });
  }
  /** Velocity is logical CSS pixels/second. Fast flings choose the next anchor in their direction. */
  endDrag(velocity = 0, duration = this.duration): Promise<boolean> {
    this.assertAlive();
    if (!Number.isFinite(velocity)) throw new RangeError('Drag velocity must be finite.');
    this.dragging.set(false);
    this.dragOrigin = null;
    this.dragAccumulated = 0;
    if (!this.activePair() || !this.anchors.length) return Promise.resolve(true);
    const current = this.resolveFirstPaneWidth() ?? this.bounds().width / 2;
    const b = this.bounds();
    const candidates = this.anchors
      .map((anchor) => ({
        anchor,
        position: resolvePaneExpansionAnchor(anchor, b.width, b.min, b.max),
      }))
      .sort((a, z) => a.position - z.position);
    let target = candidates.reduce((a, z) =>
      Math.abs(z.position - current) < Math.abs(a.position - current) ? z : a,
    );
    if (velocity >= 400)
      target =
        candidates.find((c) => c.position > current + 0.5) ?? candidates[candidates.length - 1];
    else if (velocity <= -400)
      target =
        candidates
          .slice()
          .reverse()
          .find((c) => c.position < current - 0.5) ?? candidates[0];
    return this.animateTo(target.anchor, duration);
  }
  /**
   * Abandons an in-flight pointer interaction without snapping or animating, so a cancelled or
   * interrupted drag keeps whatever width the user had already reached.
   */
  cancelDrag(): void {
    this.assertAlive();
    this.dragging.set(false);
    this.dragOrigin = null;
    this.dragAccumulated = 0;
  }
  /** Advances to the next configured anchor, wrapping around. Resolves false when none exist. */
  cycleAnchor(duration = this.duration): Promise<boolean> {
    this.assertAlive();
    if (!this.activePair() || !this.anchors.length) return Promise.resolve(false);
    const b = this.bounds();
    const candidates = this.anchors
      .map((anchor, index) => ({
        anchor,
        index,
        position: resolvePaneExpansionAnchor(anchor, b.width, b.min, b.max),
      }))
      .sort((a, z) => a.position - z.position || a.index - z.index);
    const current = this.resolveFirstPaneWidth() ?? 0;
    const next =
      candidates.find((candidate) => candidate.position > current + 0.5) ?? candidates[0];
    return this.animateTo(next.anchor, duration);
  }
  snapTo(anchor: MatPaneExpansionAnchor): void {
    this.assertAlive();
    validateAnchor(anchor);
    this.cancelAnimation();
    this.dragging.set(false);
    this.save({ type: 'anchor', anchor: Object.freeze({ ...anchor }) });
  }
  animateTo(anchor: MatPaneExpansionAnchor, duration = this.duration): Promise<boolean> {
    this.assertAlive();
    validateAnchor(anchor);
    assertPaneDimension(duration, 'animation duration');
    if (!this.isRegisteredAnchor(anchor))
      throw new RangeError('animateTo requires an anchor registered on this expansion state.');
    this.cancelAnimation();
    this.dragging.set(false);
    if (!this.activePair()) return Promise.resolve(false);
    const b = this.bounds(),
      target = resolvePaneExpansionAnchor(anchor, b.width, b.min, b.max),
      start = this.resolveFirstPaneWidth() ?? target;
    if (!duration || start === target) {
      this.snapTo(anchor);
      return Promise.resolve(true);
    }
    const finalAnchor = Object.freeze({ ...anchor });
    this.transientWidth.set(start);
    this.animating.set(true);
    return new Promise((resolve) => {
      this.settle = resolve;
      const began = Date.now();
      const frame = () => {
        const progress = Math.min(1, (Date.now() - began) / duration);
        this.transientWidth.set(start + (target - start) * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) this.timer = setTimeout(frame, 16);
        else {
          this.timer = undefined;
          this.save({ type: 'anchor', anchor: finalAnchor });
          this.transientWidth.set(null);
          this.animating.set(false);
          this.settle = undefined;
          resolve(true);
        }
      };
      this.timer = setTimeout(frame, 0);
    });
  }
  /** Cancellation settles, never rejects, and retains the current visual position. */
  cancelAnimation(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    const current = this.transientWidth();
    if (current !== null) this.save({ type: 'width', width: current });
    this.transientWidth.set(null);
    this.animating.set(false);
    const settle = this.settle;
    this.settle = undefined;
    settle?.(false);
  }
  destroy(): void {
    this.cancelAnimation();
    this.dragging.set(false);
    this.destroyed = true;
  }
  private assertAlive(): void {
    if (this.destroyed) throw new Error('Pane expansion state has been destroyed.');
  }
  private isRegisteredAnchor(anchor: MatPaneExpansionAnchor): boolean {
    const matches = (candidate: MatPaneExpansionAnchor) =>
      candidate.type === anchor.type &&
      (candidate.type === 'proportion'
        ? anchor.type === 'proportion' && candidate.proportion === anchor.proportion
        : anchor.type === 'offset' &&
          candidate.edge === anchor.edge &&
          candidate.offset === anchor.offset);
    return this.anchors.some(matches) || (!!this.initialAnchor && matches(this.initialAnchor));
  }
  private clamp(width: number, available = this.bounds().width): number {
    const b = this.bounds();
    return Math.max(Math.min(b.min, available), Math.min(width, b.max, available));
  }
  private key(pair: MatPaneExpansionPair | null): string | null {
    return pair ? pair[0] + ':' + pair[1] : null;
  }
  private save(setting: Setting): void {
    const key = this.key(this.activePair());
    if (!key) return;
    const frozen = Object.freeze(setting);
    this.setting.set(frozen);
    this.saved.set(key, frozen);
  }
}
