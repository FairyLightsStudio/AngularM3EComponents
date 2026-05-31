import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { MAT_NAVIGATION_BAR_MODULES } from '@fairylights-studio/navigation-bar';
import { MatNavigationActiveIcon, MatNavigationIcon, MatNavigationLabel } from './directives';

const meta: Meta<MatNavigationIcon> = {
  title: 'Navigation/Common/Projection Directives',
  component: MatNavigationIcon,
  subcomponents: {
    MatNavigationActiveIcon,
    MatNavigationLabel,
  },
  decorators: [
    moduleMetadata({
      imports: [MatIconModule, ...MAT_NAVIGATION_BAR_MODULES],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Shared content-projection directives used by navigation bar, navigation rail, and navigation suite items.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<MatNavigationIcon>;

export const IconLabelProjection: Story = {
  render: () => ({
    template: `
      <mat-navigation-bar aria-label="Projection directive example">
        <mat-navigation-bar-item active>
          <mat-icon *matNavigationIcon>home</mat-icon>
          <mat-icon *matNavigationActiveIcon>home_filled</mat-icon>
          <ng-template matNavigationLabel>Home</ng-template>
        </mat-navigation-bar-item>
      </mat-navigation-bar>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Home')).toBeInTheDocument();
  },
};
