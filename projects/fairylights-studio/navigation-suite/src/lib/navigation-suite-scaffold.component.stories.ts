import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import {
  MAT_NAVIGATION_SUITE_MODULES,
  MatNavigationSuiteScaffoldState,
  type MatNavigationSuiteType,
} from '@fairylights-studio/navigation-suite';

type NavigationSuiteStoryArgs = {
  selectedIndex: number;
  navSuiteType: MatNavigationSuiteType;
  alwaysShowLabel: boolean;
  verticalArrangement: 'top' | 'center';
  primaryActionAlignment: 'start' | 'center' | 'end';
};

type NavigationSuiteStoryItem = {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
  badge?: string;
  badgeDescription?: string;
};

const navItems: readonly NavigationSuiteStoryItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    activeIcon: 'space_dashboard',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: 'task_alt',
    activeIcon: 'assignment_turned_in',
    badge: '5',
    badgeDescription: '5 active tasks',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'analytics',
    activeIcon: 'monitoring',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'admin_panel_settings',
  },
];

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
    navSuiteType: {
      control: 'radio',
      options: ['BarCompact', 'BarMedium', 'RailCollapsed', 'RailExpanded'],
    },
    alwaysShowLabel: {
      control: 'boolean',
    },
    verticalArrangement: {
      control: 'radio',
      options: ['top', 'center'],
    },
    primaryActionAlignment: {
      control: 'radio',
      options: ['start', 'center', 'end'],
    },
  },
  args: {
    selectedIndex: 0,
    navSuiteType: 'RailCollapsed',
    alwaysShowLabel: true,
    verticalArrangement: 'top',
    primaryActionAlignment: 'end',
  },
};

export default meta;

type Story = StoryObj<NavigationSuiteStoryArgs>;

const renderProjectedSuite: Story['render'] = (args) => ({
  props: {
    ...args,
    navItems,
    scaffoldState: new MatNavigationSuiteScaffoldState(),
  },
  template: `
      <mat-navigation-suite-scaffold
        [navSuiteType]="navSuiteType"
        [state]="scaffoldState"
        [verticalArrangement]="verticalArrangement"
        [primaryActionAlignment]="primaryActionAlignment"
      >
        <button
          *matNavigationSuitePrimaryAction
          mat-fab
          aria-label="Create document"
        >
          <mat-icon aria-hidden="true">edit</mat-icon>
        </button>

        <mat-navigation-suite [alwaysShowLabel]="alwaysShowLabel" ariaLabel="Workspace">
          @for (item of navItems; track item.id; let index = $index) {
            <mat-navigation-suite-item
              [selected]="selectedIndex === index"
              [icon]="item.icon"
              [activeIcon]="item.activeIcon ?? null"
              [label]="item.label"
              [badge]="item.badge"
              [badgeDescription]="item.badgeDescription"
              (click)="selectedIndex = index"
            />
          }
        </mat-navigation-suite>

        <section style="padding: 32px">
          <h2 style="margin: 0 0 8px">Workspace</h2>
          <p style="margin: 0; max-width: 52ch">
            The scaffold switches between navigation rail and navigation bar layouts.
          </p>
        </section>
      </mat-navigation-suite-scaffold>
  `,
});

export const RailCollapsed: Story = {
  render: renderProjectedSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Create document')).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Tasks'));
    await expect(canvas.getByText('Workspace')).toBeInTheDocument();
  },
};

export const RailExpanded: Story = {
  args: {
    selectedIndex: 1,
    navSuiteType: 'RailExpanded',
    verticalArrangement: 'center',
  },
  render: renderProjectedSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(canvas.getByText('Reports')).toBeInTheDocument();
  },
};

export const BarCompact: Story = {
  args: {
    selectedIndex: 2,
    navSuiteType: 'BarCompact',
    primaryActionAlignment: 'center',
  },
  render: renderProjectedSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Dashboard'));
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};

export const BarMedium: Story = {
  args: {
    selectedIndex: 0,
    navSuiteType: 'BarMedium',
    primaryActionAlignment: 'start',
  },
  render: renderProjectedSuite,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Tasks')).toBeInTheDocument();
  },
};
