// projects/demo-app/.storybook/preview.ts
import { Preview, applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      viewport: {
        options: INITIAL_VIEWPORTS,
      },
    },
    layout: 'fullscreen',
  },
  initialGlobals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  decorators: [],
};

export default preview;
