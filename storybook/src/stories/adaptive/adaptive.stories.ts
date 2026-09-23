import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import {
  AdaptiveDemoComponent,
  type AdaptiveDemoAdaptation,
  type AdaptiveDemoKind,
} from './adaptive-demo.component';

export interface AdaptiveStoryArgs {
  kind: AdaptiveDemoKind;
  width: number;
  height: number;
  direction: 'ltr' | 'rtl';
  adaptation: AdaptiveDemoAdaptation;
  modal: boolean;
  scrim: boolean;
  position: 'auto' | 'popover' | 'center' | 'top' | 'bottom' | 'start' | 'end';
  tertiary: boolean;
  controlled?: boolean;
}

const meta: Meta<AdaptiveStoryArgs> = {
  title: 'Adaptive/Pane Scaffolds',
  decorators: [moduleMetadata({ imports: [AdaptiveDemoComponent] })],
  parameters: { layout: 'padded' },
  args: {
    kind: 'list-detail',
    width: 1000,
    height: 560,
    direction: 'ltr',
    adaptation: 'default',
    modal: false,
    scrim: true,
    position: 'auto',
    tertiary: false,
    controlled: false,
  },
  argTypes: {
    width: { control: { type: 'number', min: 320, max: 1600, step: 20 } },
    height: { control: { type: 'number', min: 360, max: 1200, step: 20 } },
    kind: { control: 'select', options: ['list-detail', 'supporting', 'three'] },
    direction: { control: 'radio', options: ['ltr', 'rtl'] },
    adaptation: { control: 'select', options: ['default', 'levitate', 'conditional'] },
    scrim: { control: 'boolean' },
    position: {
      control: 'select',
      options: ['auto', 'popover', 'center', 'top', 'bottom', 'start', 'end'],
    },
    controlled: { control: 'boolean' },
  },
  render: (args) => ({
    props: args,
    template: `
      <adaptive-demo [kind]="kind" [width]="width" [height]="height" [direction]="direction"
        [adaptation]="adaptation" [modal]="modal" [scrim]="scrim" [position]="position" [tertiary]="tertiary"
        [controlled]="controlled" />
    `,
  }),
};
export default meta;
type Story = StoryObj<AdaptiveStoryArgs>;

/* -------------------------------------------------------------------------
 * Pure static default-state stories (side-effect free, no play functions)
 * ------------------------------------------------------------------------- */

export const ListDetail: Story = {};
export const NarrowListDetail: Story = { args: { width: 420 } };
export const Supporting: Story = { args: { kind: 'supporting' } };
export const TallSupportingReflow: Story = {
  args: { kind: 'supporting', width: 600, height: 980 },
};
export const ThreePanes: Story = { args: { kind: 'three', width: 1400 } };
export const RightToLeft: Story = { args: { direction: 'rtl' } };

export const ConditionalLevitation: Story = {
  args: { kind: 'supporting', width: 420, adaptation: 'conditional' },
};

/** Default floating pane: it draws a scrim and the panes behind it stop responding. */
export const ScrimmedLevitation: Story = {
  args: { kind: 'supporting', adaptation: 'levitate', position: 'auto' },
};

/** Anchored to the control that opened it, like a menu: aligned to the trigger and flipped when tight. */
export const PopoverLevitation: Story = {
  args: { kind: 'supporting', adaptation: 'levitate', position: 'popover' },
};

/** Opt out of the scrim when a floating pane should leave the layout behind it fully usable. */
export const NonmodalLevitation: Story = {
  args: { kind: 'supporting', adaptation: 'levitate', position: 'end', scrim: false },
};

export const ModalLevitation: Story = {
  args: { kind: 'supporting', adaptation: 'levitate', modal: true },
};

export const ReducedMotion: Story = {
  args: { kind: 'supporting', adaptation: 'levitate' },
  parameters: {
    docs: {
      description: {
        story:
          'Enable prefers-reduced-motion: reduce in browser emulation. The adaptive test runner also uses reduced motion; this example does not override the user preference.',
      },
    },
  },
};

export const ControlledMode: Story = {
  args: { kind: 'supporting', adaptation: 'levitate', modal: true, controlled: true },
};

/* -------------------------------------------------------------------------
 * Behavior/* interaction tests using semantic, accessible properties
 * ------------------------------------------------------------------------- */

/**
 * Verifies modal floating pane opens with role="dialog" and aria-modal="true",
 * places initial focus inside the dialog, and dismissing with Escape emits
 * dismissal and returns focus to the invoking button.
 */
export const ModalFocusAndEscape: Story = {
  name: 'Behavior/ModalFocusAndEscape',
  args: { kind: 'supporting', adaptation: 'levitate', modal: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByRole('button', { name: 'Open inspector' });
    await expect(openButton).toBeVisible();
    openButton.focus();
    await expect(openButton).toHaveFocus();

    await userEvent.click(openButton);

    const inspectorNote = await canvas.findByRole('textbox', { name: 'Inspector note' });
    await expect(inspectorNote).toBeVisible();

    const dialog = inspectorNote.closest('dialog');
    await expect(dialog).not.toBeNull();
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // matPane initialFocus="input" places focus on the inspector input
    await expect(inspectorNote).toHaveFocus();

    // Escape closes modal and returns focus to the invoking button
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(canvas.queryByRole('textbox', { name: 'Inspector note' })).not.toBeVisible();
    });

    await waitFor(() => {
      expect(openButton).toHaveFocus();
    });

    // Verify history popped back to 1 entry (no double-dismissal bug)
    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent(/history entries: 1/);
  },
};

/**
 * Verifies a nonmodal floating pane remains an ordinary region, does not trap focus,
 * does not have aria-modal="true", and leaves background controls reachable and focusable.
 */
export const NonmodalDoesNotTrapFocus: Story = {
  name: 'Behavior/NonmodalDoesNotTrapFocus',
  args: { kind: 'supporting', adaptation: 'levitate', position: 'end', scrim: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByRole('button', { name: 'Open inspector' });
    await userEvent.click(openButton);

    const inspectorNote = await canvas.findByRole('textbox', { name: 'Inspector note' });
    await expect(inspectorNote).toBeVisible();

    const dialog = inspectorNote.closest('dialog');
    await expect(dialog).not.toBeNull();
    await expect(dialog).not.toHaveAttribute('aria-modal', 'true');
    await expect(dialog).not.toHaveAttribute('inert');

    // Background controls remain reachable and interactive
    const wideContainerBtn = canvas.getByRole('button', { name: 'Wide container' });
    await expect(wideContainerBtn).toBeVisible();
    wideContainerBtn.focus();
    await expect(wideContainerBtn).toHaveFocus();

    const showListBtn = canvas.getByRole('button', { name: 'Show message list' });
    await expect(showListBtn).toBeVisible();
    showListBtn.focus();
    await expect(showListBtn).toHaveFocus();
  },
};

/**
 * Verifies popover levitation anchors to the control that opened it instead of a configured edge.
 */
export const PopoverAnchorsToTrigger: Story = {
  name: 'Behavior/PopoverAnchorsToTrigger',
  args: { kind: 'supporting', adaptation: 'levitate', position: 'popover' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByRole('button', { name: 'Open inspector' });
    await userEvent.click(openButton);
    const inspectorNote = await canvas.findByRole('textbox', { name: 'Inspector note' });
    await expect(inspectorNote).toBeVisible();

    const pane = inspectorNote.closest('dialog') as HTMLElement | null;
    await expect(pane).not.toBeNull();
    const paneRect = (pane as HTMLElement).getBoundingClientRect();
    const triggerRect = openButton.getBoundingClientRect();

    // Aligned to the trigger's leading edge rather than centred in the scaffold.
    expect(Math.abs(paneRect.left - triggerRect.left)).toBeLessThan(60);
    // And it never covers the control that opened it.
    expect(paneRect.top >= triggerRect.bottom || paneRect.bottom <= triggerRect.top).toBe(true);
  },
};

/**
 * Verifies that a default floating pane blocks the layout behind it: the panes behind become inert,
 * and dismissing through the scrim closes the floating pane.
 */
export const ScrimBlocksBackground: Story = {
  name: 'Behavior/ScrimBlocksBackground',
  args: { kind: 'supporting', adaptation: 'levitate', position: 'auto' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByRole('button', { name: 'Open inspector' });
    await userEvent.click(openButton);

    const inspectorNote = await canvas.findByRole('textbox', { name: 'Inspector note' });
    await expect(inspectorNote).toBeVisible();

    const floatingPane = inspectorNote.closest('dialog');
    await expect(floatingPane).not.toBeNull();
    await expect(floatingPane).not.toHaveAttribute('inert');

    // The pane behind the floating one is inert, so pointer and keyboard both stop at the scrim.
    const blockedPane = canvasElement.querySelector('dialog[aria-label="Message detail"]');
    await expect(blockedPane).not.toBeNull();
    await expect(blockedPane).toHaveAttribute('inert');

    // The scaffold owns dismissal, so activating the scrim closes the floating pane.
    const scrim = canvasElement.querySelector<HTMLElement>('.mat-pane-scaffold__scrim');
    await expect(scrim).not.toBeNull();
    fireEvent.click(scrim as HTMLElement);

    await waitFor(() => {
      expect(canvas.queryByRole('textbox', { name: 'Inspector note' })).not.toBeVisible();
    });
  },
};

/**
 * Verifies that typing into a pane input retains both the form value and the
 * exact component/DOM element instance when the layout adapts between two
 * columns and one column across container width changes.
 */
export const StateRetentionAcrossResize: Story = {
  name: 'Behavior/StateRetentionAcrossResize',
  args: { kind: 'list-detail', width: 1000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state (1000px): two columns (list and detail) are expanded
    const draftInput = await canvas.findByRole('textbox', { name: 'Draft reply' });
    const listInput = await canvas.findByRole('textbox', { name: 'List filter' });

    await expect(draftInput).toBeVisible();
    await expect(listInput).toBeVisible();

    const draftText = 'Draft message preserved across container resize';
    const filterText = 'Filter query preserved';

    await userEvent.type(draftInput, draftText);
    await userEvent.type(listInput, filterText);

    await expect(draftInput).toHaveValue(draftText);
    await expect(listInput).toHaveValue(filterText);

    // Resize container to narrow (420px) -> single column
    const narrowBtn = canvas.getByRole('button', { name: 'Narrow container' });
    await userEvent.click(narrowBtn);

    // Switch to list destination to inspect the list input in single-column mode
    const showListBtn = canvas.getByRole('button', { name: 'Show message list' });
    await userEvent.click(showListBtn);

    await waitFor(() => {
      expect(canvas.getByRole('textbox', { name: 'List filter' })).toBeVisible();
    });

    const currentListInput = canvas.getByRole('textbox', { name: 'List filter' });
    await expect(currentListInput).toHaveValue(filterText);
    await expect(currentListInput).toBe(listInput);

    // Switch back to wide container (1000px) -> two columns
    const wideBtn = canvas.getByRole('button', { name: 'Wide container' });
    await userEvent.click(wideBtn);

    await waitFor(() => {
      expect(canvas.getByRole('textbox', { name: 'Draft reply' })).toBeVisible();
    });

    const currentDraftInput = canvas.getByRole('textbox', { name: 'Draft reply' });
    await expect(currentDraftInput).toBeVisible();
    await expect(currentDraftInput).toHaveValue(draftText);
    await expect(currentDraftInput).toBe(draftInput);
  },
};

/**
 * Verifies navigating between List and Detail updates destination and history
 * count in the status element, enables the Pane back button, and activating
 * Pane back navigates back and updates the status element.
 */
export const BackPolicies: Story = {
  name: 'Behavior/BackPolicies',
  args: { kind: 'list-detail', width: 1000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    const backButton = canvas.getByRole('button', { name: 'Pane back' });

    // Initially on secondary with 1 history entry; back is disabled
    await expect(status).toHaveTextContent(/Destination:\s*secondary;\s*history entries:\s*1/);
    await expect(backButton).toBeDisabled();

    // Navigate to primary (Detail)
    const openLaunchBtn = await canvas.findByRole('button', { name: 'Open launch notes' });
    await userEvent.click(openLaunchBtn);

    // Destination is primary, history entries count is 2; back is enabled
    await waitFor(() => {
      expect(status).toHaveTextContent(/Destination:\s*primary;\s*history entries:\s*2/);
    });
    await expect(backButton).toBeEnabled();

    // Click Pane back
    await userEvent.click(backButton);

    // Returned to secondary, history entries count is 1; back is disabled again
    await waitFor(() => {
      expect(status).toHaveTextContent(/Destination:\s*secondary;\s*history entries:\s*1/);
    });
    await expect(backButton).toBeDisabled();
  },
};

/**
 * Verifies conditional levitation floats only when the container is single-pane.
 */
export const ConditionalLevitationBehavior: Story = {
  name: 'Behavior/ConditionalLevitation',
  args: { kind: 'supporting', width: 420, adaptation: 'conditional' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByRole('button', { name: 'Open inspector' });
    await userEvent.click(openButton);

    const inspectorNote = await canvas.findByRole('textbox', { name: 'Inspector note' });
    await expect(inspectorNote).toBeVisible();

    const closeBtn = canvas.getByRole('button', { name: 'Close inspector' });
    await userEvent.click(closeBtn);

    await waitFor(() => {
      expect(canvas.queryByRole('textbox', { name: 'Inspector note' })).not.toBeVisible();
    });
  },
};

/**
 * Verifies controlled mode where destination is supplied directly without a navigator,
 * and dismissRequest is handled by the parent component.
 */
export const ControlledDismissal: Story = {
  name: 'Behavior/ControlledDismissal',
  args: { kind: 'supporting', adaptation: 'levitate', modal: true, controlled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByRole('button', { name: 'Open inspector' });
    await userEvent.click(openButton);

    const inspectorNote = await canvas.findByRole('textbox', { name: 'Inspector note' });
    await expect(inspectorNote).toBeVisible();

    // Dismiss with Escape in controlled mode
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(canvas.queryByRole('textbox', { name: 'Inspector note' })).not.toBeVisible();
    });

    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent(/Destination:\s*primary;\s*history entries:\s*1/);
  },
};
