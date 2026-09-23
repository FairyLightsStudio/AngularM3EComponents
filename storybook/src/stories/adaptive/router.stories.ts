import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideRouter, Router, withDisabledInitialNavigation } from '@angular/router';
import {
  MatListDetailPaneScaffoldComponent,
  MatPaneDirective,
  type MatPaneRole,
} from '@fairylights-studio/ngx-m3-adaptive';
import {
  createMatPaneQueryParamCodec,
  createMatPaneRouterNavigator,
} from '@fairylights-studio/ngx-m3-adaptive/router';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

@Component({
  selector: 'adaptive-route-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class AdaptiveRoutePlaceholderComponent {}

@Component({
  selector: 'adaptive-router-demo',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListDetailPaneScaffoldComponent,
    MatPaneDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>URL-backed pane navigation</h2>
    <p>Open this story in its own Canvas tab before testing browser Back and Forward.</p>
    <button
      matButton
      [disabled]="!ready() || !navigator.canNavigateBack('PopLatest')"
      (click)="back()"
    >
      Pane-policy back
    </button>
    <p role="status">
      {{ message() }}; committed entries: {{ navigator.history().length }}; destination:
      {{ navigator.currentDestination()?.pane ?? 'none' }}
    </p>
    <p style="overflow-wrap: anywhere">Committed Router URL: {{ url() }}</p>
    <div style="width: 620px; max-width: 100%">
      <mat-list-detail-pane-scaffold [navigator]="navigator" [height]="480">
        <ng-template matPane="secondary" label="Routed message list">
          <section style="padding: 24px">
            <h3>Messages</h3>
            <button matButton="filled" [disabled]="!ready()" (click)="open('primary', 'release')">
              Open routed release
            </button>
          </section>
        </ng-template>
        <ng-template matPane="primary" label="Routed message detail">
          <section style="padding: 24px">
            <h3>{{ navigator.currentDestination()?.contentKey ?? 'Message detail' }}</h3>
            <mat-form-field><mat-label>Routed draft</mat-label><input matInput /></mat-form-field>
            <button matButton [disabled]="!ready()" (click)="open('primary', 'follow-up')">
              Open routed follow-up
            </button>
          </section>
        </ng-template>
      </mat-list-detail-pane-scaffold>
    </div>
  `,
})
class AdaptiveRouterDemoComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly navigator = createMatPaneRouterNavigator(
    createMatPaneQueryParamCodec({
      queryParam: 'adaptiveDemoTrail',
      fallbackRoot: { pane: 'secondary', contentKey: null },
    }),
  );
  readonly ready = signal(false);
  readonly message = signal('Initializing the iframe URL');
  readonly url = signal('');
  constructor() {
    // Keep Storybook's id/viewMode query parameters. Never initialize this demo at '/'.
    const view = this.document.defaultView;
    const originalUrl = view
      ? view.location.pathname + view.location.search + view.location.hash
      : '/';
    const originalState: unknown = view?.history.state;
    inject(DestroyRef).onDestroy(() => {
      // This removes the codec parameter from the current entry, not older browser entries.
      // Therefore this example is intentionally isolated from the other story modules.
      view?.history.replaceState(originalState, '', originalUrl);
    });
    void this.initialize(originalUrl);
  }
  private async initialize(url: string): Promise<void> {
    try {
      const committed = await this.router.navigateByUrl(url, { replaceUrl: true });
      this.ready.set(committed);
      this.message.set(committed ? 'Ready' : 'Initial navigation cancelled');
      this.url.set(this.router.url);
    } catch (error: unknown) {
      this.message.set(String(error));
    }
  }
  async open(pane: MatPaneRole, key: string): Promise<void> {
    await this.navigate(() => this.navigator.navigateTo(pane, key));
  }
  async back(): Promise<void> {
    await this.navigate(() => this.navigator.navigateBack('PopLatest'));
  }
  private async navigate(action: () => void | boolean | Promise<boolean>): Promise<void> {
    try {
      const committed = await Promise.resolve(action());
      this.message.set(committed === false ? 'Navigation cancelled' : 'Navigation committed');
      this.url.set(this.router.url);
    } catch (error: unknown) {
      this.message.set(String(error));
    }
  }
}

const meta: Meta = {
  title: 'Adaptive/Router',
  decorators: [
    applicationConfig({
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        provideRouter(
          [{ path: '**', component: AdaptiveRoutePlaceholderComponent }],
          withDisabledInitialNavigation(),
        ),
      ],
    }),
    moduleMetadata({ imports: [AdaptiveRouterDemoComponent] }),
  ],
  parameters: {
    docs: {
      story: { inline: false },
      description: {
        component:
          'Dedicated iframe-history example. Pane-policy Back replaces the current URL; browser Back traverses real browser entries. Use a standalone Canvas tab and reload after testing.',
      },
    },
  },
  render: () => ({ template: '<adaptive-router-demo />' }),
};
export default meta;
export const QueryParamNavigation: StoryObj = {};
