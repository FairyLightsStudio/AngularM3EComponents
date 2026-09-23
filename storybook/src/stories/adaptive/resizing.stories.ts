import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AdaptiveResizeDemoComponent } from './resize-demo.component';

type ResizeArgs = {
  sheet: boolean;
  edge: 'start' | 'end' | 'top' | 'bottom';
  direction: 'ltr' | 'rtl';
};
const meta: Meta<ResizeArgs> = {
  title: 'Adaptive/Resizing',
  decorators: [moduleMetadata({ imports: [AdaptiveResizeDemoComponent] })],
  args: { sheet: false, edge: 'end', direction: 'ltr' },
  argTypes: {
    edge: { control: 'select', options: ['start', 'end', 'top', 'bottom'] },
    direction: { control: 'radio', options: ['ltr', 'rtl'] },
  },
  render: (args) => ({
    props: args,
    template: '<adaptive-resize-demo [sheet]="sheet" [edge]="edge" [direction]="direction" />',
  }),
};
export default meta;
type Story = StoryObj<ResizeArgs>;

/* -------------------------------------------------------------------------
 * Pure static default-state stories (side-effect free, no play functions)
 * ------------------------------------------------------------------------- */

export const SplitAndAnchors: Story = {};
export const RtlSplit: Story = { args: { direction: 'rtl' } };
export const EndSheet: Story = { args: { sheet: true } };
export const BottomSheet: Story = { args: { sheet: true, edge: 'bottom' } };
export const RtlStartSheet: Story = { args: { sheet: true, edge: 'start', direction: 'rtl' } };

/* -------------------------------------------------------------------------
 * Behavior/* interaction tests
 * ------------------------------------------------------------------------- */

/**
 * Verifies focusing the split separator, using ArrowLeft/ArrowRight and Home/End,
 * and asserts aria-valuenow changes in the expected logical direction.
 */
export const SplitDragAndKeyboard: Story = {
  name: 'Behavior/SplitDragAndKeyboard',
  args: { direction: 'ltr' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = await canvas.findByRole('separator');
    await expect(separator).toBeVisible();

    const initialValue = Number(separator.getAttribute('aria-valuenow'));
    separator.focus();
    await expect(separator).toHaveFocus();

    // ArrowRight in LTR increases logical first pane size
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      const val = Number(separator.getAttribute('aria-valuenow'));
      expect(val).toBeGreaterThan(initialValue);
    });

    // ArrowLeft in LTR decreases logical first pane size
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      const val = Number(separator.getAttribute('aria-valuenow'));
      expect(val).toBeLessThanOrEqual(initialValue);
    });

    // Home sets to min
    await userEvent.keyboard('{Home}');
    await waitFor(() => {
      expect(separator).toHaveAttribute('aria-valuenow', '0');
    });

    // End sets to max
    await userEvent.keyboard('{End}');
    await waitFor(() => {
      expect(separator).toHaveAttribute('aria-valuenow', '100');
    });
  },
};

/**
 * Verifies that under RTL, physical movement is inverted:
 * ArrowLeft increases the logical first pane width and ArrowRight decreases it.
 */
export const RtlSplitDragAndKeyboard: Story = {
  name: 'Behavior/RtlSplitDragAndKeyboard',
  args: { direction: 'rtl' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = await canvas.findByRole('separator');
    await expect(separator).toBeVisible();

    separator.focus();
    await expect(separator).toHaveFocus();

    const initialValue = Number(separator.getAttribute('aria-valuenow'));

    // In RTL, ArrowLeft physically moves left, increasing the first pane's logical width
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      const val = Number(separator.getAttribute('aria-valuenow'));
      expect(val).toBeGreaterThan(initialValue);
    });

    // ArrowRight physically moves right, decreasing the first pane's logical width
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      const val = Number(separator.getAttribute('aria-valuenow'));
      expect(val).toBeLessThanOrEqual(initialValue);
    });
  },
};

/**
 * Verifies pressing Enter or Space advances through every configured anchor and wraps around.
 * The demo registers the five AndroidX sample anchors, so this also guards the snap points
 * themselves: narrow start, even split, narrow end, collapsed and full.
 */
export const AnchorCycling: Story = {
  name: 'Behavior/AnchorCycling',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = await canvas.findByRole('separator');
    await expect(separator).toBeVisible();

    separator.focus();
    await expect(separator).toHaveFocus();

    // The layout rests on the narrow start anchor (280px of the 976px usable width).
    expect(separator).toHaveAttribute('aria-valuenow', '29');

    // Enter walks every registered anchor in positional order and wraps back to the first one.
    for (const value of ['50', '71', '100', '0', '29']) {
      await userEvent.keyboard('{Enter}');
      await waitFor(
        () => {
          expect(separator).toHaveAttribute('aria-valuenow', value);
        },
        { timeout: 3000 },
      );
    }
  },
};

/**
 * Verifies dragging or moving the separator to an edge collapses that side
 * and marks it non-interactive, then restores it with the keyboard.
 */
export const EdgeCollapseAndRestore: Story = {
  name: 'Behavior/EdgeCollapseAndRestore',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = await canvas.findByRole('separator');
    const editorBtn = await canvas.findByRole('button', { name: 'Show reference' });
    await expect(editorBtn).toBeVisible();

    // Collapse Editor by moving separator to min (0%)
    separator.focus();
    await userEvent.keyboard('{Home}');

    await waitFor(() => {
      expect(separator).toHaveAttribute('aria-valuenow', '0');
    });

    // The collapsed side is removed from interaction and accessibility tree
    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: 'Show reference' })).not.toBeVisible();
    });

    // The separator remains accessible to restore the collapsed pane
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => {
      const val = Number(separator.getAttribute('aria-valuenow'));
      expect(val).toBeGreaterThan(0);
    });

    // Editor is restored and interactive again
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Show reference' })).toBeVisible();
    });
  },
};

/**
 * Verifies opening an edge sheet and resizing it with the keyboard,
 * asserting aria-valuenow moves within [aria-valuemin, aria-valuemax].
 */
export const SheetResizeKeyboard: Story = {
  name: 'Behavior/SheetResizeKeyboard',
  args: { sheet: true, edge: 'end' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openSheetBtn = await canvas.findByRole('button', { name: 'Show resizable sheet' });
    await userEvent.click(openSheetBtn);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: 'Tools' })).toBeVisible();
    });

    // Find the sheet resize separator
    const separators = await canvas.findAllByRole('separator');
    const sheetSeparator = separators[separators.length - 1];

    sheetSeparator.focus();
    await expect(sheetSeparator).toHaveFocus();

    const min = Number(sheetSeparator.getAttribute('aria-valuemin') ?? 96);
    const max = Number(sheetSeparator.getAttribute('aria-valuemax') ?? 520);
    const current = Number(sheetSeparator.getAttribute('aria-valuenow') ?? 320);

    expect(current).toBeGreaterThanOrEqual(min);
    expect(current).toBeLessThanOrEqual(max);

    // Resize with keyboard
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      const val = Number(sheetSeparator.getAttribute('aria-valuenow'));
      expect(val).toBeGreaterThanOrEqual(min);
      expect(val).toBeLessThanOrEqual(max);
    });

    // End snaps to max
    await userEvent.keyboard('{End}');
    await waitFor(() => {
      expect(sheetSeparator).toHaveAttribute('aria-valuenow', String(max));
    });

    // Home snaps to min
    await userEvent.keyboard('{Home}');
    await waitFor(() => {
      expect(sheetSeparator).toHaveAttribute('aria-valuenow', String(min));
    });
  },
};

export const EndSheetBehavior: Story = {
  name: 'Behavior/EndSheet',
  args: { sheet: true, edge: 'end' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Show resizable sheet' }));
    await expect(await canvas.findByRole('heading', { name: 'Tools' })).toBeVisible();
  },
};

export const BottomSheetBehavior: Story = {
  name: 'Behavior/BottomSheet',
  args: { sheet: true, edge: 'bottom' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Show resizable sheet' }));
    await expect(await canvas.findByRole('heading', { name: 'Tools' })).toBeVisible();
  },
};

export const RtlStartSheetBehavior: Story = {
  name: 'Behavior/RtlStartSheet',
  args: { sheet: true, edge: 'start', direction: 'rtl' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Show resizable sheet' }));
    await expect(await canvas.findByRole('heading', { name: 'Tools' })).toBeVisible();
  },
};
