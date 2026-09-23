import { signal } from '@angular/core';
import { assertPaneDimension } from './pane-types';
export type MatPaneDragToResizeValue = 'collapsed' | 'partial' | 'expanded';
export type MatPaneDockEdge = 'start' | 'end' | 'top' | 'bottom';
/** Owner-supplied bounds. An omitted partial size keeps the previously requested stop. */
export interface MatPaneDragToResizeBounds {
  readonly minSize: number;
  readonly maxSize: number;
  readonly partialSize?: number;
}
/** Effective bounds after container clamping, where every stop resolves to a concrete size. */
export interface MatPaneResolvedResizeBounds {
  readonly minSize: number;
  readonly maxSize: number;
  readonly partialSize: number;
}
export interface MatPaneDragToResizeStateOptions {
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly partialSize?: number;
  readonly initialValue?: MatPaneDragToResizeValue;
  readonly animationDuration?: number;
}
/** Translate physical pointer movement to growth of a sheet docked on a logical edge. */
export function paneResizeDelta(
  deltaX: number,
  deltaY: number,
  edge: MatPaneDockEdge,
  direction: 'ltr' | 'rtl' = 'ltr',
): number {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY))
    throw new RangeError('Pointer deltas must be finite.');
  if (edge === 'top') return deltaY;
  if (edge === 'bottom') return -deltaY;
  const logical = direction === 'rtl' ? -deltaX : deltaX;
  if (edge === 'start') return logical;
  if (edge === 'end') return -logical;
  throw new TypeError('Invalid dock edge.');
}
function validateValue(value: MatPaneDragToResizeValue): void {
  if (!['collapsed', 'partial', 'expanded'].includes(value))
    throw new TypeError('Invalid sheet resize value.');
}
/** A sheet has its own size state; it never writes the scaffold split expansion state. */
export class MatPaneDragToResizeState {
  private readonly currentValue = signal<MatPaneDragToResizeValue>('partial');
  private readonly currentSize = signal(0);
  private readonly dragging = signal(false);
  private readonly animating = signal(false);
  private readonly duration: number;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private settle: ((completed: boolean) => void) | undefined;
  private destroyed = false;
  readonly value = this.currentValue.asReadonly();
  readonly size = this.currentSize.asReadonly();
  readonly isDragging = this.dragging.asReadonly();
  readonly isAnimating = this.animating.asReadonly();
  private readonly effectiveBounds = signal<MatPaneResolvedResizeBounds>({
    minSize: 0,
    maxSize: 0,
    partialSize: 0,
  });
  /** Effective bounds after container clamping; renderers read these for aria-valuemin/max. */
  readonly bounds = this.effectiveBounds.asReadonly();
  /** Size the owner asked for, retained across container-driven re-clamping. */
  private requestedPartialSize: number | null = null;
  constructor(options: MatPaneDragToResizeStateOptions = {}) {
    const initial = options.initialValue ?? 'partial';
    validateValue(initial);
    this.duration = options.animationDuration ?? 200;
    assertPaneDimension(this.duration, 'animation duration');
    this.currentValue.set(initial);
    this.requestedPartialSize = options.partialSize ?? null;
    this.configure({
      minSize: options.minSize ?? 0,
      maxSize: options.maxSize ?? 600,
      partialSize: options.partialSize,
    });
  }
  configure(bounds: MatPaneDragToResizeBounds): void {
    this.assertAlive();
    assertPaneDimension(bounds.minSize, 'minimum sheet size');
    assertPaneDimension(bounds.maxSize, 'maximum sheet size');
    if (bounds.minSize > bounds.maxSize)
      throw new RangeError('Minimum sheet size exceeds maximum sheet size.');
    // An explicit call wins; otherwise a previously requested partial size survives re-clamping so a
    // narrower container never silently discards the owner’s preferred stop.
    if (bounds.partialSize !== undefined) this.requestedPartialSize = bounds.partialSize;
    const requested = this.requestedPartialSize ?? (bounds.minSize + bounds.maxSize) / 2;
    assertPaneDimension(requested, 'partial sheet size');
    const partial = Math.max(bounds.minSize, Math.min(requested, bounds.maxSize));
    const next: MatPaneResolvedResizeBounds = {
      minSize: bounds.minSize,
      maxSize: bounds.maxSize,
      partialSize: partial,
    };
    const previous = this.bounds();
    if (
      next.minSize === previous.minSize &&
      next.maxSize === previous.maxSize &&
      next.partialSize === previous.partialSize
    )
      return;
    this.cancelAnimation();
    this.dragging.set(false);
    this.effectiveBounds.set(next);
    this.currentSize.set(this.position(this.currentValue()));
  }
  /** Abandons an in-flight pointer interaction without snapping, keeping the current size. */
  cancelDrag(): void {
    this.assertAlive();
    this.dragging.set(false);
  }
  /** Advances collapsed → partial → expanded → collapsed. */
  cycle(duration = this.duration): Promise<boolean> {
    this.assertAlive();
    const order: readonly MatPaneDragToResizeValue[] = ['collapsed', 'partial', 'expanded'];
    const current = order.indexOf(this.currentValue());
    return this.animateTo(order[(current + 1) % order.length], duration);
  }
  snapTo(value: MatPaneDragToResizeValue): void {
    this.assertAlive();
    validateValue(value);
    this.cancelAnimation();
    this.dragging.set(false);
    this.currentValue.set(value);
    this.currentSize.set(this.position(value));
  }
  animateTo(value: MatPaneDragToResizeValue, duration = this.duration): Promise<boolean> {
    this.assertAlive();
    validateValue(value);
    assertPaneDimension(duration, 'animation duration');
    this.cancelAnimation();
    this.dragging.set(false);
    const start = this.size(),
      target = this.position(value);
    if (!duration || start === target) {
      this.snapTo(value);
      return Promise.resolve(true);
    }
    this.animating.set(true);
    return new Promise((resolve) => {
      this.settle = resolve;
      const began = Date.now();
      const frame = () => {
        const progress = Math.min(1, (Date.now() - began) / duration);
        this.currentSize.set(start + (target - start) * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) this.timer = setTimeout(frame, 16);
        else {
          this.timer = undefined;
          this.currentValue.set(value);
          this.animating.set(false);
          this.settle = undefined;
          resolve(true);
        }
      };
      this.timer = setTimeout(frame, 0);
    });
  }
  beginDrag(): void {
    this.assertAlive();
    this.cancelAnimation();
    this.dragging.set(true);
  }
  dragBy(delta: number): void {
    this.assertAlive();
    if (!Number.isFinite(delta)) throw new RangeError('Drag delta must be finite.');
    if (!this.dragging()) this.beginDrag();
    const bounds = this.bounds();
    this.currentSize.update((size) =>
      Math.max(bounds.minSize, Math.min(size + delta, bounds.maxSize)),
    );
  }
  endDrag(velocity = 0, duration = this.duration): Promise<boolean> {
    this.assertAlive();
    if (!Number.isFinite(velocity)) throw new RangeError('Drag velocity must be finite.');
    this.dragging.set(false);
    const candidates: readonly MatPaneDragToResizeValue[] = ['collapsed', 'partial', 'expanded'];
    const current = this.size();
    let target = candidates.reduce((a, b) =>
      Math.abs(this.position(b) - current) < Math.abs(this.position(a) - current) ? b : a,
    );
    if (velocity >= 400)
      target = candidates.find((value) => this.position(value) > current + 0.5) ?? 'expanded';
    else if (velocity <= -400)
      target =
        candidates
          .slice()
          .reverse()
          .find((value) => this.position(value) < current - 0.5) ?? 'collapsed';
    return this.animateTo(target, duration);
  }
  cancelAnimation(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
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
  private position(value: MatPaneDragToResizeValue): number {
    const bounds = this.bounds();
    return value === 'collapsed'
      ? bounds.minSize
      : value === 'expanded'
        ? bounds.maxSize
        : bounds.partialSize;
  }
  private assertAlive(): void {
    if (this.destroyed) throw new Error('Pane resize state has been destroyed.');
  }
}
