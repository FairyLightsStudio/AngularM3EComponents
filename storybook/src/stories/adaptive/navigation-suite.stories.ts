import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_NAVIGATION_SUITE_MODULES } from '@fairylights-studio/ngx-m3-navigation-suite';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AdaptiveDemoComponent } from './adaptive-demo.component';

@Component({
  selector: 'adaptive-suite-demo',
  imports: [MatButtonModule, ...MAT_NAVIGATION_SUITE_MODULES, AdaptiveDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button matButton="tonal" (click)="expanded.set(!expanded())" [attr.aria-pressed]="expanded()">
      Expand navigation rail
    </button>
    <p>The pane observes the suite content area, not the browser viewport.</p>
    <div style="width: 1080px; max-width: 100%; height: 740px; position: relative">
      <mat-navigation-suite-scaffold
        [navSuiteType]="expanded() ? 'RailExpanded' : 'RailCollapsed'"
        [railShowToggle]="true"
      >
        <mat-navigation-suite ariaLabel="Mail destinations">
          <mat-navigation-suite-item
            icon="inbox"
            label="Inbox"
            [selected]="selected() === 'Inbox'"
            (click)="selected.set('Inbox')"
          />
          <mat-navigation-suite-item
            icon="drafts"
            label="Drafts"
            [selected]="selected() === 'Drafts'"
            (click)="selected.set('Drafts')"
          />
        </mat-navigation-suite>
        <section style="padding: 16px; min-width: 0">
          <h2>{{ selected() }}</h2>
          <adaptive-demo [fluid]="true" [height]="540" />
        </section>
      </mat-navigation-suite-scaffold>
    </div>
  `,
})
class AdaptiveSuiteDemoComponent {
  readonly expanded = signal(false);
  readonly selected = signal('Inbox');
}

const meta: Meta = {
  title: 'Adaptive/Navigation Suite',
  decorators: [moduleMetadata({ imports: [AdaptiveSuiteDemoComponent] })],
  parameters: { layout: 'padded' },
  render: () => ({ template: '<adaptive-suite-demo />' }),
};
export default meta;
type Story = StoryObj;

/* -------------------------------------------------------------------------
 * Pure static default-state story
 * ------------------------------------------------------------------------- */
export const RailContentResize: Story = {};

/* -------------------------------------------------------------------------
 * Behavior/* interaction test
 * ------------------------------------------------------------------------- */
export const RailExpansionPreservesDraft: Story = {
  name: 'Behavior/RailExpansionPreservesDraft',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Open launch notes' }));
    const draft = await canvas.findByRole('textbox', { name: 'Draft reply' });
    await userEvent.type(draft, 'Keep this reply while the rail expands');
    const toggle = canvas.getByRole('button', { name: 'Expand navigation rail' });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Draft reply' })).toHaveValue(
        'Keep this reply while the rail expands',
      ),
    );
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('textbox', { name: 'Draft reply' })).toBe(draft);
  },
};
