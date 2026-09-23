import { Directive, TemplateRef, computed, inject, input } from '@angular/core';
import { MatPaneDragToResizeState } from './pane-drag-to-resize-state';
import {
  MAT_PANE_LEVITATION_POSITIONS,
  MatPaneRole,
  assertPaneDimension,
  assertPaneRole,
  type MatPaneLevitationPosition,
} from './pane-types';

/** A pane is instantiated once, including while hidden. Labels name its accessible region. */
@Directive({ selector: 'ng-template[matPane]', exportAs: 'matPane' })
export class MatPaneDirective {
  readonly matPane = input.required<MatPaneRole>();
  readonly label = input<string | null>(null);
  readonly labelledBy = input<string | null>(null);
  readonly preferredWidth = input<number | null>(null);
  readonly preferredHeight = input<number | null>(null);
  /** CSS selector within this pane; falls back to the first focusable element. */
  readonly initialFocus = input<string | null>(null);
  readonly levitationPosition = input<MatPaneLevitationPosition>('center');
  readonly modal = input(false);
  /**
   * Whether a levitated pane draws a scrim over the scaffold and makes the panes behind it inert.
   * Ignored while `modal` is set, because the browser already blocks and dims everything then.
   */
  readonly scrim = input(true);
  /** Edge sheets only. Centered panes intentionally have no resize handle. */
  readonly dragToResizeState = input<MatPaneDragToResizeState | null>(null);
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  readonly role = computed(() => {
    const role = this.matPane();
    assertPaneRole(role);
    for (const [name, value] of [
      ['preferredWidth', this.preferredWidth()],
      ['preferredHeight', this.preferredHeight()],
    ] as const) {
      if (value !== null) assertPaneDimension(value, name);
    }
    if (!this.label()?.trim() && !this.labelledBy()?.trim()) {
      throw new Error('matPane="' + role + '" requires a non-empty label or labelledBy.');
    }
    if (!MAT_PANE_LEVITATION_POSITIONS.includes(this.levitationPosition())) {
      throw new TypeError('Invalid pane levitationPosition.');
    }
    if (this.initialFocus() !== null && !this.initialFocus()?.trim()) {
      throw new TypeError('initialFocus must be null or a non-empty CSS selector.');
    }
    return role;
  });
}
