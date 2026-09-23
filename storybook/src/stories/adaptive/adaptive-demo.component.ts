import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { BidiModule } from '@angular/cdk/bidi';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaneDirective,
  MatListDetailPaneScaffoldComponent,
  MatSupportingPaneScaffoldComponent,
  MatThreePaneScaffoldComponent,
  MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
  MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
  createListDetailPaneNavigator,
  createSupportingPaneNavigator,
  type MatPaneAdaptStrategies,
  type MatPaneDestination,
  type MatPaneDismissRequest,
  type MatPaneRole,
} from '@fairylights-studio/ngx-m3-adaptive';

export type AdaptiveDemoKind = 'list-detail' | 'supporting' | 'three';
export type AdaptiveDemoAdaptation = 'default' | 'levitate' | 'conditional';

const panes = `
  <ng-template matPane="secondary" label="Message list" [preferredWidth]="320">
    <section class="pane-content">
      <h2>Inbox</h2>
      <p>Select a message. Resize the container without changing the destination.</p>
      <button matButton="filled" (click)="navigate('primary', 'launch')">Open launch notes</button>
      <button matButton (click)="navigate('primary', 'review')">Open design review</button>
      <mat-form-field><mat-label>List filter</mat-label><input matInput placeholder="Filter messages" /></mat-form-field>
    </section>
  </ng-template>
  <ng-template matPane="primary" label="Message detail" [preferredWidth]="520">
    <section class="pane-content">
      <h2>Message detail</h2>
      <p>Current key: {{ activeDestination()?.contentKey ?? 'No selection' }}</p>
      <mat-form-field><mat-label>Draft reply</mat-label><input matInput placeholder="Write a reply" /></mat-form-field>
      <button matButton="tonal" (click)="navigate('secondary')">Show message list</button>
      @if (showTertiary()) {
        <button matButton="filled" (click)="navigate('tertiary', 'inspector')">Open inspector</button>
      }
    </section>
  </ng-template>
  @if (showTertiary()) {
    <ng-template matPane="tertiary" label="Message inspector" [preferredWidth]="300"
      [preferredHeight]="320" [modal]="modal()" [scrim]="scrim()" [levitationPosition]="position()"
      initialFocus="input">
      <section class="pane-content">
        <h2>Inspector</h2>
        <mat-form-field><mat-label>Inspector note</mat-label><input matInput /></mat-form-field>
        <p>Inspector contents use a persistent pane template.</p>
        <button matButton (click)="closeInspector()">Close inspector</button>
      </section>
    </ng-template>
  }
`;

@Component({
  selector: 'adaptive-demo',
  imports: [
    BidiModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaneDirective,
    MatListDetailPaneScaffoldComponent,
    MatSupportingPaneScaffoldComponent,
    MatThreePaneScaffoldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="controls" aria-label="Adaptive example controls">
      @if (!fluid()) {
        <mat-form-field>
          <mat-label>Container width (px)</mat-label>
          <input
            matInput
            type="number"
            min="320"
            max="1600"
            step="20"
            [value]="actualWidth()"
            (input)="setWidth($event)"
          />
        </mat-form-field>
        <button matButton (click)="changedWidth.set(420)">Narrow container</button>
        <button matButton (click)="changedWidth.set(1000)">Wide container</button>
      }
      <button matButton [disabled]="!canGoBack()" (click)="paneBack()">Pane back</button>
    </div>
    <p role="status">
      Destination: {{ activeDestination()?.pane ?? 'none' }}; history entries: {{ historyCount() }}
    </p>
    <div
      class="demo-container"
      [style.width.px]="fluid() ? null : actualWidth()"
      [dir]="direction()"
    >
      @if (controlled()) {
        @switch (kind()) {
          @case ('supporting') {
            <mat-supporting-pane-scaffold
              [destination]="controlledDestination() ?? defaultDestination()"
              [strategies]="strategies()"
              [height]="height()"
              (dismissRequest)="onDismissRequest($event)"
            >
              ${panes}
            </mat-supporting-pane-scaffold>
          }
          @case ('three') {
            <mat-three-pane-scaffold
              [destination]="controlledDestination() ?? defaultDestination()"
              [strategies]="strategies()"
              [height]="height()"
              (dismissRequest)="onDismissRequest($event)"
            >
              ${panes}
            </mat-three-pane-scaffold>
          }
          @default {
            <mat-list-detail-pane-scaffold
              [destination]="controlledDestination() ?? defaultDestination()"
              [strategies]="strategies()"
              [height]="height()"
              (dismissRequest)="onDismissRequest($event)"
            >
              ${panes}
            </mat-list-detail-pane-scaffold>
          }
        }
      } @else {
        @switch (kind()) {
          @case ('supporting') {
            <mat-supporting-pane-scaffold
              [navigator]="navigator()"
              [strategies]="strategies()"
              [height]="height()"
              (dismissRequest)="onDismissRequest($event)"
            >
              ${panes}
            </mat-supporting-pane-scaffold>
          }
          @case ('three') {
            <mat-three-pane-scaffold
              [navigator]="navigator()"
              [strategies]="strategies()"
              [height]="height()"
              (dismissRequest)="onDismissRequest($event)"
            >
              ${panes}
            </mat-three-pane-scaffold>
          }
          @default {
            <mat-list-detail-pane-scaffold
              [navigator]="navigator()"
              [strategies]="strategies()"
              [height]="height()"
              (dismissRequest)="onDismissRequest($event)"
            >
              ${panes}
            </mat-list-detail-pane-scaffold>
          }
        }
      }
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
        align-items: center;
        gap: 8px;
      }
      .controls mat-form-field {
        width: 220px;
      }
      .demo-container {
        max-width: 100%;
        background: var(--mat-sys-surface);
      }
      .pane-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pane-content h2,
      .pane-content p {
        margin: 0;
      }
      .pane-content mat-form-field {
        width: 100%;
      }
      .pane-content button {
        align-self: flex-start;
      }
    `,
  ],
})
export class AdaptiveDemoComponent {
  readonly kind = input<AdaptiveDemoKind>('list-detail');
  readonly width = input(1000);
  readonly height = input(560);
  readonly direction = input<'ltr' | 'rtl'>('ltr');
  readonly adaptation = input<AdaptiveDemoAdaptation>('default');
  readonly modal = input(false);
  readonly scrim = input(true);
  readonly position = input<'center' | 'top' | 'bottom' | 'start' | 'end' | 'auto' | 'popover'>(
    'auto',
  );
  readonly tertiary = input(false);
  readonly fluid = input(false);
  readonly controlled = input(false);
  readonly changedWidth = signal<number | null>(null);
  readonly actualWidth = computed(() => this.changedWidth() ?? this.width());
  readonly lastDismissRequest = signal<MatPaneDismissRequest | null>(null);

  private readonly listNavigator = createListDetailPaneNavigator();
  private readonly supportingNavigator = createSupportingPaneNavigator();
  readonly navigator = computed(() =>
    this.kind() === 'supporting' ? this.supportingNavigator : this.listNavigator,
  );

  readonly defaultDestination = computed<MatPaneDestination>(() => ({
    pane: this.kind() === 'list-detail' ? 'secondary' : 'primary',
    contentKey: null,
  }));
  readonly controlledDestination = signal<MatPaneDestination | null>(null);

  readonly activeDestination = computed<MatPaneDestination | null>(() => {
    if (this.controlled()) {
      return this.controlledDestination() ?? this.defaultDestination();
    }
    return this.navigator().currentDestination();
  });

  readonly historyCount = computed(() => {
    if (this.controlled()) {
      return this.controlledDestination() ? 2 : 1;
    }
    return this.navigator().history().length;
  });

  readonly canGoBack = computed(() => {
    if (this.controlled()) {
      return this.controlledDestination() !== null;
    }
    return this.navigator().canNavigateBack('PopLatest');
  });

  readonly showTertiary = computed(
    () => this.tertiary() || this.kind() === 'three' || this.adaptation() !== 'default',
  );
  readonly strategies = computed<MatPaneAdaptStrategies>(() => {
    const defaults =
      this.kind() === 'supporting'
        ? MAT_SUPPORTING_PANE_ADAPT_STRATEGIES
        : MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES;
    return this.adaptation() === 'default'
      ? defaults
      : {
          ...defaults,
          tertiary: { type: 'Levitate', onlyIfSinglePane: this.adaptation() === 'conditional' },
        };
  });

  setWidth(event: Event): void {
    const width = (event.target as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(width)) this.changedWidth.set(Math.min(1600, Math.max(320, width)));
  }

  navigate(pane: MatPaneRole, contentKey: string | null = null): void {
    if (this.controlled()) {
      this.controlledDestination.set({ pane, contentKey });
    } else {
      this.navigator().navigateTo(pane, contentKey);
    }
  }

  paneBack(): void {
    if (this.controlled()) {
      this.controlledDestination.set(null);
    } else {
      this.navigator().navigateBack('PopLatest');
    }
  }

  closeInspector(): void {
    if (this.controlled()) {
      this.controlledDestination.set(null);
    } else {
      this.navigator().navigateBack('PopLatest');
    }
  }

  onDismissRequest(request: MatPaneDismissRequest): void {
    this.lastDismissRequest.set(request);
    if (this.controlled()) {
      // In controlled mode without a navigator, the handler owns the state change.
      this.controlledDestination.set(null);
    }
    // When a navigator is attached, MatPaneScaffoldBase.dismiss() already walks
    // history back to the previous non-floating destination. We do NOT call
    // navigator().navigateBack('PopLatest') here, preventing double dismissal.
  }
}
