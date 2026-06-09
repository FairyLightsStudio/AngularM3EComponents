import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExtendedFabCollapsedDirective } from '@fairylights-studio/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import {
  MAT_NAVIGATION_SUITE_MODULES,
  MatNavigationSuiteComponent,
  MatNavigationSuiteScaffoldState,
  MatNavigationSuiteScaffoldComponent,
  MatNavigationSuiteItemComponent,
  MatNavigationSuitePrimaryAction,
  type MatNavigationSuiteType,
} from '@fairylights-studio/navigation-suite';

type NavigationSuiteStoryArgs = {
  selectedIndex: number;
  navSuiteType: MatNavigationSuiteType;
  alwaysShowItemLabel: boolean;
  verticalArrangement: 'top' | 'center';
  primaryActionAlignment: 'start' | 'center' | 'end';
  railShowToggle: boolean;
};

type NavigationSuiteStoryItem = {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
};

const navItems: readonly NavigationSuiteStoryItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: 'task_alt',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'analytics',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'admin_panel_settings',
  },
];

const meta: Meta<NavigationSuiteStoryArgs> = {
  title: 'Navigation/Navigation Suite Scaffold',
  component: MatNavigationSuiteScaffoldComponent,
  subcomponents: {
    MatNavigationSuiteComponent,
    MatNavigationSuiteItemComponent,
    MatNavigationSuitePrimaryAction,
  },
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatExtendedFabCollapsedDirective,
        ...MAT_NAVIGATION_SUITE_MODULES,
      ],
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
    alwaysShowItemLabel: {
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
    alwaysShowItemLabel: true,
    verticalArrangement: 'top',
    primaryActionAlignment: 'end',
    railShowToggle: true,
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
        [railShowToggle]="railShowToggle"
      >
        <ng-template matNavigationSuitePrimaryAction let-collapsed="collapsed">
          <button
            matFab
            extended
            [collapsed]="collapsed"
            aria-label="Create document"
          >
            <mat-icon aria-hidden="true">edit</mat-icon>
            Compose
          </button>
        </ng-template>

        <mat-navigation-suite [alwaysShowItemLabel]="alwaysShowItemLabel" ariaLabel="Workspace">
          @for (item of navItems; track item.id; let index = $index) {
            <mat-navigation-suite-item
              [selected]="selectedIndex === index"
              [icon]="item.icon"
              [activeIcon]="item.activeIcon ?? null"
              [label]="item.label"
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


export const AutoSuiteType: Story = {
  args: {
    selectedIndex: 0,
    navSuiteType: undefined,
  },
  render: renderProjectedSuite,
};

/** Demonstrates restricting the PAB to only show when a specific destination
 *  (e.g, Dashboard) is active, rather than globally across all destinations. */
export const BarCompactPabConditional: Story = {
  args: {
    selectedIndex: 0,
    navSuiteType: 'BarCompact',
    primaryActionAlignment: 'end',
  },
  globals: {
    viewport: { value: 'mobile2', isRotated: false },
  },
  render: (args) => ({
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
        [railShowToggle]="railShowToggle"
      >
        @if (selectedIndex === 0) {
          <ng-template matNavigationSuitePrimaryAction let-collapsed="collapsed">
            <button
              matFab
              extended
              [collapsed]="collapsed"
              aria-label="Create document"
            >
              <mat-icon aria-hidden="true">edit</mat-icon>
              Compose
            </button>
          </ng-template>
        }

        <mat-navigation-suite [alwaysShowItemLabel]="alwaysShowItemLabel" ariaLabel="Workspace">
          @for (item of navItems; track item.id; let index = $index) {
            <mat-navigation-suite-item
              [selected]="selectedIndex === index"
              [icon]="item.icon"
              [activeIcon]="item.activeIcon ?? null"
              [label]="item.label"
              (click)="selectedIndex = index"
            />
          }
        </mat-navigation-suite>

        <section style="padding: 32px 16px">
          <h2 style="margin: 0 0 8px">{{ navItems[selectedIndex].label }}</h2>
          <p style="margin: 0; max-width: 52ch" data-testid="pab-status">
            @if (selectedIndex === 0) {
              PAB is visible: only the Dashboard destination shows the compose button.
            } @else {
              Navigate back to Dashboard to reveal the PAB.
            }
          </p>
        </section>
      </mat-navigation-suite-scaffold>
    `,
  }),
};

export const RailCollapsed: Story = {
  render: renderProjectedSuite,
  globals: {
    viewport: { value: 'tablet', isRotated: false },
  },
};

export const RailExpanded: Story = {
  args: {
    selectedIndex: 1,
    navSuiteType: 'RailExpanded',
    verticalArrangement: 'center',
  },
  globals: {
    viewport: { value: 'desktop', isRotated: false },
  },
  render: renderProjectedSuite,
};

export const BarCompact: Story = {
  args: {
    selectedIndex: 2,
    navSuiteType: 'BarCompact',
    primaryActionAlignment: 'end',
  },
  globals: {
    viewport: { value: 'mobile2', isRotated: false },
  },
  render: renderProjectedSuite,
};

export const BarMedium: Story = {
  args: {
    selectedIndex: 0,
    navSuiteType: 'BarMedium',
    primaryActionAlignment: 'end',
  },
  globals: {
    viewport: { value: 'tablet', isRotated: true },
  },
  render: renderProjectedSuite,
};
