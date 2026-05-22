
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { MAT_NAVIGATION_BAR_MODULES } from '@fairylights-studio/navigation-bar';

type NavigationBarStoryArgs = {
  selectedIndex: number;
  layout: 'vertical' | 'horizontal';
  alwaysShowLabel: boolean;
};

const meta: Meta<NavigationBarStoryArgs> = {
  title: 'Fairylights Studio/Navigation Bar',
  decorators: [
    moduleMetadata({
      imports: [
        MatIconModule,
        ...MAT_NAVIGATION_BAR_MODULES,
      ],
    }),
  ],
  argTypes: {
    selectedIndex: {
      control: { type: 'number', min: 0, max: 3 },
    },
    layout: {
      control: 'radio',
      options: ['vertical', 'horizontal'],
    },
    alwaysShowLabel: {
      control: 'boolean',
    },
  },
  args: {
    selectedIndex: 0,
    layout: 'vertical',
    alwaysShowLabel: true,
  },
};

export default meta;

type Story = StoryObj<NavigationBarStoryArgs>;

export const Basic: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:500px;">
        <mat-navigation-bar aria-label="Primary navigation">
          <mat-navigation-bar-item
            [active]="selectedIndex === 0"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            (click)="selectedIndex = 0"
          >
            <mat-icon matNavigationIcon aria-hidden="true">home</mat-icon>
            <mat-icon matNavigationActiveIcon aria-hidden="true">home</mat-icon>
            <ng-template matNavigationLabel>Home</ng-template>
          </mat-navigation-bar-item>

          <mat-navigation-bar-item
            [active]="selectedIndex === 1"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            (click)="selectedIndex = 1"
          >
            <mat-icon matNavigationIcon aria-hidden="true">search</mat-icon>
            <mat-icon matNavigationActiveIcon aria-hidden="true">saved_search</mat-icon>
            <ng-template matNavigationLabel>Search</ng-template>
          </mat-navigation-bar-item>

          <mat-navigation-bar-item
            [active]="selectedIndex === 2"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            badge="3"
            badgeDescription="3 unread notifications"
            (click)="selectedIndex = 2"
          >
            <mat-icon matNavigationIcon aria-hidden="true">notifications</mat-icon>
            <mat-icon matNavigationActiveIcon aria-hidden="true">notifications_active</mat-icon>
            <ng-template matNavigationLabel>Alerts</ng-template>
          </mat-navigation-bar-item>

          <mat-navigation-bar-item
            [active]="selectedIndex === 3"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            [disabled]="true"
          >
            <mat-icon matNavigationIcon aria-hidden="true">person</mat-icon>
            <ng-template matNavigationLabel>Profile</ng-template>
          </mat-navigation-bar-item>
        </mat-navigation-bar>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Home')).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Search'));
    await expect(canvas.getByText('Search')).toBeInTheDocument();
  },
};

export const HorizontalLabels: Story = {
  args: {
    selectedIndex: 1,
    layout: 'horizontal',
    alwaysShowLabel: true,
  },
  render: Basic.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Search')).toBeInTheDocument();
    await expect(canvas.getByText('Alerts')).toBeInTheDocument();
  },
};

export const CompactLabels: Story = {
  args: {
    selectedIndex: 2,
    layout: 'vertical',
    alwaysShowLabel: false,
  },
  render: Basic.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Home'));
    await expect(canvas.getByText('Home')).toBeInTheDocument();
  },
};
