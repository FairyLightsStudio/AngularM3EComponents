
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { MAT_NAVIGATION_RAIL_MODULES, MatNavRailIndicatorShape } from '@fairylights-studio/navigation-rail';

type NavigationRailStoryArgs = {
  selectedIndex: number;
  expanded: boolean;
  indicatorShape: 'hug' | 'fill';
  showDivider: boolean;
  verticalArrangement: 'top' | 'center' | 'bottom';
};

const meta: Meta<NavigationRailStoryArgs> = {
  title: 'Navigation/Navigation Rail/Rail',
  decorators: [
    moduleMetadata({
      imports: [
        MatButtonModule,
        MatIconModule,
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
      options: ['top', 'center', 'bottom'],
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

export const Collapsed: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div>
        <mat-navigation-rail
          [expanded]="expanded"
          [indicatorShape]="indicatorShape"
          [showDivider]="showDivider"
          [verticalArrangement]="verticalArrangement"
          aria-label="Primary navigation"
        >
          <mat-navigation-rail-header>
            <mat-navigation-rail-toggle [expanded]="expanded" (click)="expanded = !expanded"></mat-navigation-rail-toggle>
            <button mat-fab aria-label="Create item">
              <mat-icon aria-hidden="true">add</mat-icon>
            </button>
          </mat-navigation-rail-header>

          <mat-navigation-rail-item
            [active]="selectedIndex === 0"
            (click)="selectedIndex = 0"
          >
            <mat-icon matNavigationIcon aria-hidden="true">inbox</mat-icon>
            <mat-icon matNavigationActiveIcon aria-hidden="true">move_to_inbox</mat-icon>
            <ng-template matNavigationLabel>Inbox</ng-template>
          </mat-navigation-rail-item>

          <mat-navigation-rail-item
            [active]="selectedIndex === 1"
            badge="8"
            badgeDescription="8 unread messages"
            (click)="selectedIndex = 1"
          >
            <mat-icon matNavigationIcon aria-hidden="true">chat_bubble</mat-icon>
            <mat-icon matNavigationActiveIcon aria-hidden="true">mark_chat_unread</mat-icon>
            <ng-template matNavigationLabel>Messages</ng-template>
          </mat-navigation-rail-item>

          <mat-navigation-rail-item
            [active]="selectedIndex === 2"
            (click)="selectedIndex = 2"
          >
            <mat-icon matNavigationIcon aria-hidden="true">calendar_month</mat-icon>
            <mat-icon matNavigationActiveIcon aria-hidden="true">event_available</mat-icon>
            <ng-template matNavigationLabel>Calendar</ng-template>
          </mat-navigation-rail-item>

          <mat-navigation-rail-item
            [active]="selectedIndex === 3"
            [disabled]="true"
          >
            <mat-icon matNavigationIcon aria-hidden="true">settings</mat-icon>
            <ng-template matNavigationLabel>Settings</ng-template>
          </mat-navigation-rail-item>
        </mat-navigation-rail>
      </div>
    `,
  }),
  // play: async ({ canvasElement }) => {
  //   const canvas = within(canvasElement);
  //   await expect(canvas.getByLabelText('Create item')).toBeInTheDocument();
  //   await userEvent.click(canvas.getByText('Messages'));
  //   await expect(canvas.getByText('Messages')).toBeInTheDocument();
  // },
};

export const Expanded: Story = {
  args: {
    selectedIndex: 1,
    expanded: true,
    indicatorShape: 'fill',
    showDivider: true,
    verticalArrangement: 'center',
  },
  render: Collapsed.render,
  // play: async ({ canvasElement }) => {
  //   const canvas = within(canvasElement);
  //   await expect(canvas.getByText('Inbox')).toBeInTheDocument();
  //   await expect(canvas.getByText('Calendar')).toBeInTheDocument();
  // },
};

export const BottomAligned: Story = {
  args: {
    selectedIndex: 2,
    expanded: false,
    indicatorShape: 'hug',
    showDivider: false,
    verticalArrangement: 'bottom',
  },
  render: Collapsed.render,
  // play: async ({ canvasElement }) => {
  //   const canvas = within(canvasElement);
  //   await userEvent.click(canvas.getByText('Inbox'));
  //   await expect(canvas.getByText('Inbox')).toBeInTheDocument();
  // },
};
