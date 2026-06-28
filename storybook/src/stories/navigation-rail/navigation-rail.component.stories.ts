import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExtendedFabCollapsedDirective } from '@fairylights-studio/ngx-m3-button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import {
  MAT_NAVIGATION_RAIL_MODULES,
  MatNavRailIndicatorShape,
  MatNavigationRailComponent,
  MatNavigationRailHeaderComponent,
  MatNavigationRailItemComponent,
  MatNavigationRailToggleComponent,
} from '@fairylights-studio/ngx-m3-navigation-rail';

type NavigationRailStoryArgs = {
  selectedIndex: number;
  expanded: boolean;
  indicatorShape: 'hug' | 'fill';
  showDivider: boolean;
  verticalArrangement: 'top' | 'center';
};

const TEMPLATE = `
  <div>
    <mat-navigation-rail
      [expanded]="expanded"
      [indicatorShape]="indicatorShape"
      [showDivider]="showDivider"
      [verticalArrangement]="verticalArrangement"
      [ariaLabel]="'Primary navigation'"
    >
      <mat-navigation-rail-header>
        <mat-navigation-rail-toggle [expanded]="expanded" (click)="expanded = !expanded"></mat-navigation-rail-toggle>
        <button matFab extended [collapsed]="!expanded" aria-label="Create item">
          <mat-icon aria-hidden="true">add</mat-icon>
          Create
        </button>
      </mat-navigation-rail-header>

      <mat-navigation-rail-item
        [active]="selectedIndex === 0"
        (click)="selectedIndex = 0"
      >
        <mat-icon *matNavigationIcon>inbox</mat-icon>
        <ng-template matNavigationLabel>Inbox</ng-template>
      </mat-navigation-rail-item>

      <mat-navigation-rail-item
        [active]="selectedIndex === 1"
        (click)="selectedIndex = 1"
      >
        <mat-icon *matNavigationIcon matBadge="8" matBadgeDescription="8 unread messages">chat_bubble</mat-icon>
        <ng-template matNavigationLabel>Messages</ng-template>
      </mat-navigation-rail-item>

      <mat-navigation-rail-item
        [active]="selectedIndex === 2"
        (click)="selectedIndex = 2"
      >
        <mat-icon *matNavigationIcon>calendar_month</mat-icon>
        <ng-template matNavigationLabel>Calendar</ng-template>
      </mat-navigation-rail-item>

      <mat-navigation-rail-item
        [active]="selectedIndex === 3"
        (click)="selectedIndex = 3"
      >
        <mat-icon *matNavigationIcon>settings</mat-icon>
        <ng-template matNavigationLabel>Settings</ng-template>
      </mat-navigation-rail-item>
    </mat-navigation-rail>
  </div>
`;

const meta: Meta<NavigationRailStoryArgs> = {
  title: 'Navigation/Navigation Rail/Rail',
  component: MatNavigationRailComponent,
  subcomponents: {
    MatNavigationRailHeaderComponent,
    MatNavigationRailItemComponent,
    MatNavigationRailToggleComponent,
  },
  decorators: [
    moduleMetadata({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        MatExtendedFabCollapsedDirective,
        ...MAT_NAVIGATION_RAIL_MODULES,
      ],
    }),
  ],
  argTypes: {
    selectedIndex: {
      control: { type: 'number', min: 0, max: 3 },
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
    verticalArrangement: {
      control: 'radio',
      options: ['top', 'center'],
    },
  },
  args: {
    selectedIndex: 0,
    expanded: false,
    indicatorShape: 'hug',
    showDivider: true,
    verticalArrangement: 'top',
  },
};

export default meta;

type Story = StoryObj<NavigationRailStoryArgs>;

/**
 * Collapsed rail with items, badge, FAB, and toggle.
 * Verifies collapsed state, divider, initial selection, badge presence,
 * FAB collapsed class, toggle state, and click-driven selection change.
 */
export const Collapsed: Story = {
  render: (args) => ({
    props: args,
    template: TEMPLATE,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvas.getByRole('navigation', { name: 'Primary navigation' });

    // Collapsed: no expanded class on host
    await expect(rail).not.toHaveClass('mat-nav-rail-expanded');

    // Divider class present (showDivider=true)
    await expect(rail).toHaveClass('mat-nav-rail-has-divider');

    // Indicator shape data attribute
    await expect(rail).toHaveAttribute('data-indicator-shape', 'hug');

    // FAB is collapsed when rail is collapsed
    const fab = canvas.getByLabelText('Create item');
    await expect(fab).toHaveClass('mat-mdc-extended-fab-collapsed');

    // Toggle button: collapsed state
    const toggle = within(rail).getByRole('button', { name: 'Expand navigation' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Four rail items rendered as buttons with role="tab"
    const railItems = within(rail).getAllByRole('tab');
    await expect(railItems).toHaveLength(4);

    // "Inbox" (index 0) is the selected item
    await expect(railItems[0]).toHaveAttribute('aria-selected', 'true');

    // Messages item has badge "8"
    await expect(within(railItems[1]).getByText('8')).toBeInTheDocument();

    // Click "Messages" — selection moves
    await userEvent.click(railItems[1]);
    await expect(railItems[0]).toHaveAttribute('aria-selected', 'false');
    await expect(railItems[1]).toHaveAttribute('aria-selected', 'true');

    // Click toggle — rail expands
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(rail).toHaveClass('mat-nav-rail-expanded');
  },
};

/**
 * Expanded rail with center arrangement and fill indicator shape.
 * Verifies expanded class, selection, FAB expansion, label visibility,
 * center arrangement, and toggle collapse.
 */
export const Expanded: Story = {
  args: {
    selectedIndex: 1,
    expanded: true,
    indicatorShape: 'fill',
    showDivider: true,
    verticalArrangement: 'center',
  },
  render: Collapsed.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvas.getByRole('navigation', { name: 'Primary navigation' });

    // Expanded class present
    await expect(rail).toHaveClass('mat-nav-rail-expanded');

    // Fill indicator shape
    await expect(rail).toHaveAttribute('data-indicator-shape', 'fill');

    // Center vertical arrangement
    await expect(rail).toHaveAttribute('data-vertical-arrangement', 'center');

    // FAB is NOT collapsed when rail is expanded
    const fab = canvas.getByLabelText('Create item');
    await expect(fab).not.toHaveClass('mat-mdc-extended-fab-collapsed');

    // Toggle shows expanded state
    const toggle = within(rail).getByRole('button', { name: 'Collapse navigation' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Rail items: "Messages" (index 1) is selected
    const railItems = within(rail).getAllByRole('tab');
    await expect(railItems[1]).toHaveAttribute('aria-selected', 'true');

    // Labels visible when expanded (each label appears in both side & bottom containers)
    await expect(within(rail).getAllByText('Inbox').length).toBeGreaterThan(0);
    await expect(within(rail).getAllByText('Calendar').length).toBeGreaterThan(0);
    await expect(within(rail).getAllByText('Settings').length).toBeGreaterThan(0);

    // Click toggle to collapse
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(rail).not.toHaveClass('mat-nav-rail-expanded');
  },
};
