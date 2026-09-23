import { type TestRunnerConfig, waitForPageReady } from '@storybook/test-runner';
import { checkA11y, injectAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page, context) {
    if (context.title.startsWith('Adaptive/')) {
      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
  },
  async postVisit(page, context) {
    if (!context.title.startsWith('Adaptive/')) return;
    await waitForPageReady(page);
    await injectAxe(page);
    await checkA11y(page, '#storybook-root', {
      axeOptions: {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
      },
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  },
};

export default config;
