
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { MatNavigationRailToggleComponent } from '@fairylights-studio/navigation-rail';

type NavigationRailStoryArgs = {
  selectedIndex: number;
  expanded: boolean;
  indicatorShape: 'hug' | 'fill';
  showDivider: boolean;
  verticalArrangement: 'top' | 'center' | 'bottom';
};

const meta: Meta<NavigationRailStoryArgs> = {
  title: 'Navigation/Navigation Rail/Toggle',
  decorators: [
    moduleMetadata({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatNavigationRailToggleComponent,
      ],
    }),
  ],
  argTypes: {
    expanded: {
      control: 'boolean',
    },
  },
  args: {
    expanded: false,
  },
};


export default meta;

type Story = StoryObj<NavigationRailStoryArgs>;

export const Toggle: Story = {
  render: (args) => ({
    props: args,
    template: `
   <mat-navigation-rail-toggle [expanded]="expanded" (click)="expanded = !expanded"></mat-navigation-rail-toggle>
    `,
  }),
  args: {
    expanded: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByRole('button')).toBeInTheDocument();
  },
};

export const Expanded: Story = {
  args: {
    expanded: true,
  },
  render: Toggle.render,
  // play: async ({ canvasElement }) => {
  //   const canvas = within(canvasElement);
  //   await expect(canvas.getByText('Inbox')).toBeInTheDocument();
  //   await expect(canvas.getByText('Calendar')).toBeInTheDocument();
  // },
};
