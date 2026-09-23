import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { BidiModule } from '@angular/cdk/bidi';
import { MatButtonModule } from '@angular/material/button';
import {
  MatPaneDirective,
  MatSupportingPaneScaffoldComponent,
  MatPaneExpansionState,
  MatPaneDragToResizeState,
  createSupportingPaneNavigator,
  type MatPaneAdaptStrategies,
  type MatPaneDismissRequest,
  type MatPaneExpansionAnchor,
} from '@fairylights-studio/ngx-m3-adaptive';

/**
 * The five anchors the AndroidX samples register: collapse either side, a narrow pane pinned to each
 * edge, and an even split. The narrow start anchor is also the resting position, so the layout opens
 * as a narrow first pane with a wide second pane instead of an even split.
 */
const collapsed: MatPaneExpansionAnchor = { type: 'proportion', proportion: 0 };
const narrowStart: MatPaneExpansionAnchor = { type: 'offset', offset: 280, edge: 'start' };
const half: MatPaneExpansionAnchor = { type: 'proportion', proportion: 0.5 };
const narrowEnd: MatPaneExpansionAnchor = { type: 'offset', offset: 280, edge: 'end' };
const full: MatPaneExpansionAnchor = { type: 'proportion', proportion: 1 };
@Component({
  selector: 'adaptive-resize-demo',
  imports: [BidiModule, MatButtonModule, MatPaneDirective, MatSupportingPaneScaffoldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="controls">
      <button matButton (click)="width.set(420)">Narrow resize container</button>
      <button matButton (click)="width.set(1000)">Wide resize container</button>
      <button matButton (click)="split.snapTo(half)">Restore equal split</button>
      <button matButton (click)="split.snapTo(narrowStart)">Snap to narrow editor</button>
      @if (sheet()) {
        <button matButton (click)="navigator.navigateTo('tertiary', 'tools')">
          Show resizable sheet
        </button>
        <button matButton (click)="sheetState.snapTo('partial')">Restore partial sheet</button>
      }
    </div>
    <p role="status">
      Split dragging: {{ split.isDragging() }}; sheet dragging: {{ sheetState.isDragging() }}; sheet
      stop: {{ sheetState.value() }}
    </p>
    <div [style.width.px]="width()" style="max-width: 100%" [dir]="direction()">
      <mat-supporting-pane-scaffold
        [height]="560"
        [navigator]="navigator"
        [expansionState]="split"
        [strategies]="strategies"
        (dismissRequest)="onDismissRequest($event)"
      >
        <ng-template matPane="primary" label="Editor">
          <section>
            <h2>Editor</h2>
            <p>Use the separator with arrow keys, Home, and End.</p>
            <button matButton (click)="navigator.navigateTo('secondary')">Show reference</button>
          </section>
        </ng-template>
        <ng-template matPane="secondary" label="Reference">
          <section>
            <h2>Reference</h2>
            <p>Split sizes are restored when this pair returns.</p>
            <button matButton (click)="navigator.navigateTo('primary')">Show editor</button>
          </section>
        </ng-template>
        @if (sheet()) {
          <ng-template
            matPane="tertiary"
            label="Resizable tools"
            [levitationPosition]="edge()"
            [dragToResizeState]="sheetState"
            [preferredWidth]="360"
            [preferredHeight]="300"
          >
            <section>
              <h2>Tools</h2>
              <p>Drag the sheet edge, or use its keyboard separator.</p>
              <button matButton (click)="navigator.navigateBack('PopLatest')">Close tools</button>
            </section>
          </ng-template>
        }
      </mat-supporting-pane-scaffold>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        color: var(--mat-sys-on-surface);
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      section {
        padding: 20px;
      }
    `,
  ],
})
export class AdaptiveResizeDemoComponent {
  readonly sheet = input(false);
  readonly edge = input<'start' | 'end' | 'top' | 'bottom'>('end');
  readonly direction = input<'ltr' | 'rtl'>('ltr');
  readonly width = signal(1000);
  readonly navigator = createSupportingPaneNavigator();
  readonly half = half;
  readonly narrowStart = narrowStart;
  readonly split = new MatPaneExpansionState({
    anchors: [collapsed, narrowStart, half, narrowEnd, full],
    initialAnchor: narrowStart,
  });
  readonly sheetState = new MatPaneDragToResizeState({
    minSize: 96,
    maxSize: 520,
    partialSize: 320,
  });
  readonly strategies: MatPaneAdaptStrategies = {
    primary: { type: 'Hide' },
    secondary: { type: 'Hide' },
    tertiary: { type: 'Levitate' },
  };
  readonly lastDismissRequest = signal<MatPaneDismissRequest | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.split.destroy();
      this.sheetState.destroy();
    });
  }

  onDismissRequest(request: MatPaneDismissRequest): void {
    this.lastDismissRequest.set(request);
  }
}
