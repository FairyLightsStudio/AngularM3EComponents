import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatPaneExpansionState } from './pane-expansion-state';

/** Logical keyboard increment in CSS pixels of the first pane. */
const keyboardStep = 16;
/** Pointer samples older than this window are dropped before computing release velocity. */
const velocityWindowMs = 100;
/** Below this sample interval the velocity estimate is too noisy to trust. */
const minimumVelocitySeconds = 0.005;

interface PointerSample {
  readonly x: number;
  readonly time: number;
}

/**
 * Splitter between exactly two expanded panes. The owning scaffold positions the host; this component
 * owns separator semantics, pointer capture, keyboard control and release velocity.
 */
@Component({
  selector: 'mat-pane-resize-handle',
  template: '<div class="mat-pane-resize-handle-line" aria-hidden="true"></div>',
  styleUrl: './pane-resize-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'separator',
    'aria-orientation': 'vertical',
    tabindex: '0',
    '[attr.aria-label]': 'label() || "Pane sizes"',
    '[attr.aria-controls]': 'controls() || null',
    '[attr.aria-valuenow]': 'value()',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-disabled]': 'expansionState() ? null : "true"',
    '[attr.data-dragging]': 'isDragging() ? "true" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerCancel($event)',
    '(lostpointercapture)': 'onLostPointerCapture($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class MatPaneResizeHandleComponent {
  /** Pair sizing controller. A null state leaves the handle labeled but inert. */
  readonly expansionState = input<MatPaneExpansionState | null>(null);
  readonly direction = input<'ltr' | 'rtl'>('ltr');
  /** Space separated ids of the panes this separator controls. */
  readonly controls = input('');
  readonly label = input('');
  /** First pane width as a whole percentage of the available width, excluding the gutter. */
  readonly value = input(50);
  /** Available width in CSS pixels, excluding the gutter. */
  readonly availableSize = input(0);
  protected readonly isDragging = signal(false);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private activePointerId: number | null = null;
  private capturedPointerId: number | null = null;
  private lastX = 0;
  private samples: PointerSample[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanupDrag());
  }

  protected onPointerDown(event: PointerEvent): void {
    // Only the primary mouse button starts a drag, and one pointer at a time owns the separator.
    if (event.button !== 0 || this.activePointerId !== null) return;
    const state = this.getState();
    if (!state) return;
    event.preventDefault();
    try {
      this.elementRef.nativeElement.setPointerCapture(event.pointerId);
      this.capturedPointerId = event.pointerId;
    } catch {
      // Capture can fail for an already released pointer; dragging still works without it.
      this.capturedPointerId = null;
    }
    this.activePointerId = event.pointerId;
    this.lastX = event.clientX;
    const now = event.timeStamp || performance.now();
    this.samples = [{ x: event.clientX, time: now }];
    this.isDragging.set(true);
    // Seed the drag with the width actually painted so the first delta never teleports the divider.
    const available = this.availableSize();
    const painted = state.resolveFirstPaneWidth(available);
    if (painted !== null && Number.isFinite(painted) && painted >= 0) state.beginDrag(painted);
    else if (available > 0 && Number.isFinite(this.value()))
      state.beginDrag(available * (this.value() / 100));
    else state.beginDrag();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    const state = this.getState();
    if (!state) return;
    const physicalDelta = event.clientX - this.lastX;
    this.lastX = event.clientX;
    const now = event.timeStamp || performance.now();
    this.samples.push({ x: event.clientX, time: now });
    while (this.samples.length > 1 && now - this.samples[0].time > velocityWindowMs)
      this.samples.shift();
    state.dragBy(this.toLogical(physicalDelta));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    this.releaseCapture();
    const state = this.getState();
    const wasDragging = this.isDragging();
    this.activePointerId = null;
    this.isDragging.set(false);
    if (!state || !wasDragging) {
      this.samples = [];
      return;
    }
    const now = event.timeStamp || performance.now();
    const velocity = this.releaseVelocity(now);
    this.samples = [];
    void state.endDrag(velocity, this.motionDuration());
  }

  protected onPointerCancel(event: PointerEvent): void {
    this.handleCancel(event.pointerId);
  }

  protected onLostPointerCapture(event: PointerEvent): void {
    this.handleCancel(event.pointerId);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const state = this.getState();
    if (!state || event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const grow = (event.key === 'ArrowRight' ? 1 : -1) * (this.direction() === 'rtl' ? -1 : 1);
        this.setFirstPaneWidth(state, this.currentWidth(state) + grow * keyboardStep);
        break;
      }
      case 'Home':
        this.setFirstPaneWidth(state, 0);
        break;
      case 'End':
        this.setFirstPaneWidth(state, this.availableSize());
        break;
      case 'Enter':
      case ' ':
        // Explicit cycling is the only keyboard action that snaps to a configured anchor.
        void state.cycleAnchor(this.motionDuration());
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Arrow, Home and End set an exact width so stepping stays predictable regardless of anchors. */
  private setFirstPaneWidth(state: MatPaneExpansionState, width: number): void {
    const available = this.availableSize();
    const upperBound = available > 0 ? available : width;
    state.setFirstPaneWidth(Math.max(0, Math.min(width, upperBound)));
  }
  private currentWidth(state: MatPaneExpansionState): number {
    const available = this.availableSize();
    return state.resolveFirstPaneWidth(available) ?? (this.value() / 100) * available;
  }
  private releaseVelocity(now: number): number {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const seconds = (last.time - first.time) / 1000;
    // A slow finish must not be reported as a fling, so stale or tiny samples yield no velocity.
    if (seconds <= minimumVelocitySeconds || now - last.time >= velocityWindowMs) return 0;
    return this.toLogical(last.x - first.x) / seconds;
  }
  private toLogical(physicalDelta: number): number {
    return this.direction() === 'rtl' ? -physicalDelta : physicalDelta;
  }
  private handleCancel(pointerId: number): void {
    if (this.activePointerId !== null && this.activePointerId !== pointerId) return;
    this.releaseCapture();
    this.activePointerId = null;
    this.samples = [];
    const wasDragging = this.isDragging();
    this.isDragging.set(false);
    // Cancellation preserves the reached width instead of snapping.
    if (wasDragging) this.getState()?.cancelDrag();
  }
  private releaseCapture(): void {
    if (this.capturedPointerId === null) return;
    const hostEl = this.elementRef.nativeElement;
    try {
      if (hostEl.hasPointerCapture(this.capturedPointerId))
        hostEl.releasePointerCapture(this.capturedPointerId);
    } catch {
      // The pointer is already gone; there is nothing left to release.
    }
    this.capturedPointerId = null;
  }
  private cleanupDrag(): void {
    this.releaseCapture();
    this.activePointerId = null;
    this.samples = [];
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    this.expansionState()?.cancelDrag();
  }
  private getState(): MatPaneExpansionState | null {
    // A detached handle must not reach back into state it no longer presents.
    if (!this.elementRef.nativeElement.isConnected) return null;
    return this.expansionState();
  }
  /** Reduced motion settles immediately; otherwise the state keeps its configured duration. */
  private motionDuration(): number | undefined {
    const view = this.elementRef.nativeElement.ownerDocument.defaultView;
    return view?.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : undefined;
  }
}
