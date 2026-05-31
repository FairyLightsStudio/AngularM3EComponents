import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { MAT_NAVIGATION_BAR_MODULES } from '@fairylights-studio/navigation-bar';
import { MatNavigationBarComponent } from './navigation-bar.component';
import { MatNavigationBarItemComponent } from './navigation-bar-item.component';

type NavigationBarStoryArgs = {
  selectedIndex: number;
  layout: 'vertical' | 'horizontal';
  alwaysShowLabel: boolean;
};

const meta: Meta<NavigationBarStoryArgs> = {
  title: 'Navigation/Navigation Bar',
  component: MatNavigationBarComponent,
  subcomponents: {
    MatNavigationBarItemComponent,
  },
  decorators: [
    moduleMetadata({
      imports: [MatIconModule, MatBadgeModule, ...MAT_NAVIGATION_BAR_MODULES],
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
      <div>
        <mat-navigation-bar aria-label="Primary navigation">
          <mat-navigation-bar-item
            [active]="selectedIndex === 0"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            (click)="selectedIndex = 0"
          >
            <mat-icon *matNavigationIcon>home</mat-icon>
            <ng-template matNavigationLabel>Home</ng-template>
          </mat-navigation-bar-item>

          <mat-navigation-bar-item
            [active]="selectedIndex === 1"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            (click)="selectedIndex = 1"
          >
            <mat-icon *matNavigationIcon>search</mat-icon>
            <ng-template matNavigationLabel>Search</ng-template>
          </mat-navigation-bar-item>

          <mat-navigation-bar-item
            [active]="selectedIndex === 2"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            (click)="selectedIndex = 2"
          >
            <mat-icon *matNavigationIcon matBadge="3" matBadgeDescription="3 unread notifications">notifications</mat-icon>
            <ng-template matNavigationLabel>Alerts</ng-template>
          </mat-navigation-bar-item>

          <mat-navigation-bar-item
            [active]="selectedIndex === 3"
            [alwaysShowLabel]="alwaysShowLabel"
            [layout]="layout"
            (click)="selectedIndex = 3"
          >
            <mat-icon *matNavigationIcon>person</mat-icon>
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
  globals: {
    viewport: { value: 'tablet', isRotated: false },
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
