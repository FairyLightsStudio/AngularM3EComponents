import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import {
  MatNavigationActiveIcon,
  MatNavigationIcon,
  MatNavigationLabel,
} from '@fairylights-studio/navigation-common';
import {
  MatNavigationSuiteItem,
  MatNavigationSuitePrimaryAction,
  MatNavigationSuiteScaffoldComponent,
  type NavigationSuiteLayoutType,
} from './navigation-suite-scaffold.component';

import { MAT_NAVIGATION_SUITE_MODULES } from '@fairylights-studio/navigation-suite';

type NavigationSuiteStoryArgs = {
  selectedIndex: number;
  layout: 'auto' | NavigationSuiteLayoutType;
  expanded: boolean;
  indicatorShape: 'hug' | 'fill';
  showDivider: boolean;
  navigationItemVerticalArrangement: 'top' | 'center';
  primaryActionContentHorizontal: 'start' | 'center' | 'end';
};

const meta: Meta<NavigationSuiteStoryArgs> = {
  title: 'Navigation/Navigation Suite Scaffold',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatButtonModule, MatIconModule, ...MAT_NAVIGATION_SUITE_MODULES],
    }),
  ],
  argTypes: {
    selectedIndex: {
      control: { type: 'number', min: 0, max: 3 },
    },
    layout: {
      control: 'radio',
      options: ['auto', 'navigation-bar', 'navigation-rail', 'navigation-bar-horizontal', 'none'],
    },
    expanded: {
      control: 'boolean',
    },
    indicatorShape: {
      control: 'radio',
      options: ['hug', 'fill'],
    },
    showDivider: {
      control: 'boolean',
    },
    navigationItemVerticalArrangement: {
      control: 'radio',
      options: ['top', 'center'],
    },
    primaryActionContentHorizontal: {
      control: 'radio',
      options: ['start', 'center', 'end'],
    },
  },
  args: {
    selectedIndex: 0,
    layout: 'navigation-rail',
    expanded: false,
    indicatorShape: 'hug',
    showDivider: true,
    navigationItemVerticalArrangement: 'top',
    primaryActionContentHorizontal: 'end',
  },
};

export default meta;

type Story = StoryObj<NavigationSuiteStoryArgs>;

const renderSuite: Story['render'] = (args) => ({
  props: args,
  template: `
    <div>
      <mat-navigation-suite-scaffold
        [layout]="layout"
        [expanded]="expanded"
        [indicatorShape]="indicatorShape"
        [showDivider]="showDivider"
        [navigationItemVerticalArrangement]="navigationItemVerticalArrangement"
        [primaryActionContentHorizontal]="primaryActionContentHorizontal"
      >
        <button
          *matNavigationSuitePrimaryAction
          mat-fab
          aria-label="Create document"
        >
          <mat-icon aria-hidden="true">edit</mat-icon>
        </button>

        <mat-navigation-suite-item
          [active]="selectedIndex === 0"
          (selected)="selectedIndex = 0"
        >
          <mat-icon *matNavigationIcon>dashboard</mat-icon>
          <mat-icon *matNavigationActiveIcon>space_dashboard</mat-icon>
          <ng-template matNavigationLabel>Dashboard</ng-template>
        </mat-navigation-suite-item>

        <mat-navigation-suite-item
          [active]="selectedIndex === 1"
          badge="5"
          badgeDescription="5 active tasks"
          (selected)="selectedIndex = 1"
        >
          <mat-icon *matNavigationIcon>task_alt</mat-icon>
          <mat-icon *matNavigationActiveIcon>assignment_turned_in</mat-icon>
          <ng-template matNavigationLabel>Tasks</ng-template>
        </mat-navigation-suite-item>

        <mat-navigation-suite-item
          [active]="selectedIndex === 2"
          (selected)="selectedIndex = 2"
        >
          <mat-icon *matNavigationIcon>analytics</mat-icon>
          <mat-icon *matNavigationActiveIcon>monitoring</mat-icon>
          <ng-template matNavigationLabel>Reports</ng-template>
        </mat-navigation-suite-item>

        <mat-navigation-suite-item
          [active]="selectedIndex === 3"
          (selected)="selectedIndex = 3"
        >
          <mat-icon *matNavigationIcon>admin_panel_settings</mat-icon>
          <ng-template matNavigationLabel>Admin</ng-template>
        </mat-navigation-suite-item>

        <section style="padding: 32px">
          <h2 style="margin: 0 0 8px">Workspace</h2>
          <p style="margin: 0; max-width: 52ch">
            The scaffold switches between navigation rail and navigation bar
            layouts while preserving projected navigation items.
          </p>
        </section>
      </mat-navigation-suite-scaffold>
    </div>
  `,
});

export const Rail: Story = {
  render: renderSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Create document')).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Tasks'));
    await expect(canvas.getByText('Workspace')).toBeInTheDocument();
  },
};

export const ExpandedRail: Story = {
  args: {
    selectedIndex: 1,
    layout: 'navigation-rail',
    expanded: true,
    indicatorShape: 'fill',
    showDivider: true,
    navigationItemVerticalArrangement: 'center',
    primaryActionContentHorizontal: 'end',
  },
  render: renderSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(canvas.getByText('Reports')).toBeInTheDocument();
  },
};

export const Bar: Story = {
  args: {
    selectedIndex: 2,
    layout: 'navigation-bar',
    expanded: false,
    indicatorShape: 'hug',
    showDivider: false,
    navigationItemVerticalArrangement: 'top',
    primaryActionContentHorizontal: 'center',
  },
  render: renderSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Dashboard'));
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};

export const HorizontalBar: Story = {
  args: {
    selectedIndex: 0,
    layout: 'navigation-bar-horizontal',
    expanded: false,
    indicatorShape: 'hug',
    showDivider: false,
    navigationItemVerticalArrangement: 'top',
    primaryActionContentHorizontal: 'start',
  },
  render: renderSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Tasks')).toBeInTheDocument();
  },
};
