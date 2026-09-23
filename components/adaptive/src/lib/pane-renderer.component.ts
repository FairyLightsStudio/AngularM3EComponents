import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatPaneDirective } from './pane.directive';
import {
  MAT_PANE_DEFAULT_LEVITATED_WIDTH,
  MatPaneAdaptedValue,
  MatPaneLevitationPosition,
  MatPaneRect,
} from './pane-types';
import { MatPanePopoverPlacement } from './pane-layout';
import { MatPaneExpansionState } from './pane-expansion-state';

const focusable =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** One permanent dialog and one permanent embedded view per pane declaration. */
@Component({
  selector: 'mat-pane-renderer',
  imports: [NgTemplateOutlet],
  templateUrl: './pane-renderer.component.html',
  styleUrl: './pane-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class MatPaneRendererComponent {
  readonly pane = input.required<MatPaneDirective>();
  readonly value = input.required<MatPaneAdaptedValue>();
  readonly rect = input<MatPaneRect | undefined>();
  readonly paneId = input.required<string>();
  readonly constrained = input(false);
  readonly collapsed = input(false);
  readonly direction = input<'ltr' | 'rtl'>('ltr');
  readonly expansionState = input<MatPaneExpansionState | null>(null);
  /** True while an overlay covers this pane, so it leaves the tab order and the accessibility tree. */
  readonly blocked = input(false);
  readonly dismissRequest = output<'escape' | 'scrim'>();
  readonly focusEntered = output<HTMLElement>();
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly floating = computed(() => this.value().type === 'Levitated');
  readonly modal = computed(() => this.floating() && this.pane().modal());
  readonly hidden = computed(() => this.value().type === 'Hidden' || this.collapsed());
  /** Scaffold-resolved placement, used when the pane asked for `auto`. */
  readonly resolvedPosition = input<MatPaneLevitationPosition | null>(null);
  /** Scaffold-resolved geometry, used when the pane asked for `popover`. */
  readonly placement = input<MatPanePopoverPlacement | null>(null);
  readonly position = computed<MatPaneLevitationPosition>(() => {
    const resolved = this.resolvedPosition() ?? this.pane().levitationPosition();
    // A modal pane is laid out against the viewport, so a scaffold-relative anchor cannot apply.
    return resolved === 'popover' && this.modal() ? 'center' : resolved;
  });
  readonly width = computed(() =>
    this.floating()
      ? (this.pane().preferredWidth() ?? MAT_PANE_DEFAULT_LEVITATED_WIDTH)
      : this.rect()?.width,
  );
  readonly height = computed(() =>
    this.floating()
      ? this.pane().preferredHeight()
      : this.constrained()
        ? this.rect()?.height
        : null,
  );
  private openedModal = false;
  private previousFocus: HTMLElement | null = null;
  private lastRect: DOMRect | null = null;
  private animation: Animation | null = null;
  private selector: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      const modal = this.modal() && !this.hidden();
      const selector = this.pane().initialFocus();
      if (selector !== this.selector) {
        if (selector) {
          try {
            dialog.querySelector(selector);
          } catch {
            throw new TypeError('matPane initialFocus is not a valid CSS selector: ' + selector);
          }
        }
        this.selector = selector;
      }
      if (modal !== this.openedModal) {
        if (this.openedModal && dialog.open) dialog.close();
        if (modal) {
          this.previousFocus = dialog.ownerDocument.activeElement as HTMLElement | null;
          dialog.showModal();
          this.openedModal = true;
          this.focus();
        } else {
          this.openedModal = false;
          this.restoreFocus();
        }
      }
      this.rect();
      this.width();
      this.height();
      this.position();
      this.direction();
      this.expansionState();
      this.animateBounds(dialog);
    });
    inject(DestroyRef).onDestroy(() => {
      this.animation?.cancel();
      const dialog = this.dialog().nativeElement;
      if (this.openedModal && dialog.open) dialog.close();
      this.restoreFocus();
    });
  }

  focus(): void {
    const dialog = this.dialog().nativeElement;
    const preferred = this.selector ? dialog.querySelector<HTMLElement>(this.selector) : null;
    const candidates = preferred
      ? [preferred, ...dialog.querySelectorAll<HTMLElement>(focusable)]
      : [...dialog.querySelectorAll<HTMLElement>(focusable)];
    const target = candidates.find(
      (element) => !element.closest('[inert], [hidden]') && element.getClientRects().length > 0,
    );
    (target ?? dialog).focus({ preventScroll: true });
  }
  contains(element: Element | null): boolean {
    return !!element && this.dialog().nativeElement.contains(element);
  }
  onFocus(event: FocusEvent): void {
    if (event.target instanceof this.dialog().nativeElement.ownerDocument.defaultView!.HTMLElement)
      this.focusEntered.emit(event.target);
  }
  onCancel(event: Event): void {
    event.preventDefault();
    this.dismissRequest.emit('escape');
  }
  onDialogClick(event: MouseEvent): void {
    if (!this.modal() || event.target !== this.dialog().nativeElement) return;
    const rect = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      this.dismissRequest.emit('scrim');
  }
  private restoreFocus(): void {
    const target = this.previousFocus;
    this.previousFocus = null;
    if (
      target?.isConnected &&
      !target.closest('[inert], [hidden]') &&
      target.getClientRects().length
    )
      target.focus?.({ preventScroll: true });
  }
  private animateBounds(dialog: HTMLDialogElement): void {
    const previous = this.lastRect;
    this.animation?.cancel();
    this.animation = null;
    const next = dialog.getBoundingClientRect();
    this.lastRect = this.hidden() ? null : next;
    const state = this.expansionState();
    if (state && (state.isDragging() || state.isAnimating())) return;
    if (
      this.hidden() ||
      dialog.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !dialog.animate
    )
      return;
    if (!previous) {
      this.animation = dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 180,
        easing: 'ease-out',
      });
    } else if (
      previous.x !== next.x ||
      previous.y !== next.y ||
      previous.width !== next.width ||
      previous.height !== next.height
    ) {
      this.animation = dialog.animate(
        [
          {
            transform: 'translate(' + (previous.x - next.x) + 'px,' + (previous.y - next.y) + 'px)',
            width: previous.width + 'px',
            height: previous.height + 'px',
          },
          { transform: 'translate(0,0)', width: next.width + 'px', height: next.height + 'px' },
        ],
        { duration: 220, easing: 'cubic-bezier(.2,0,0,1)' },
      );
    }
  }
}
