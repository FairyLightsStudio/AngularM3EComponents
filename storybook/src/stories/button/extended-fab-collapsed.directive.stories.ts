import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type ExtendedFabStoryArgs = {
  collapsed: boolean;
  disabled: boolean;
};

import { MatExtendedFabCollapsedDirective } from '@fairylights-studio/button';
const meta: Meta<ExtendedFabStoryArgs> = {
  title: 'Button/Extended FAB',
  component: MatExtendedFabCollapsedDirective,
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, MatExtendedFabCollapsedDirective],
    }),
  ],
  argTypes: {
    collapsed: {
      control: 'boolean',
    },
  },
  args: {
    collapsed: false,
  },
};

export default meta;

type Story = StoryObj<ExtendedFabStoryArgs>;

export const CollapsibleFABButton: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 24px; padding: 32px">
        <button matFab extended [collapsed]="collapsed" aria-label="Compose message">
          <mat-icon >edit</mat-icon>
          Compose
        </button>

        <button matFab extended [collapsed]="collapsed" aria-label="Search workspace">
          <mat-icon >search</mat-icon>
          Search
          <mat-icon iconPositionEnd >arrow_forward</mat-icon>
        </button>
      </div>
    `,
  }),
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
  render: CollapsibleFABButton.render,
};
