// projects/demo-app/.storybook/preview.ts
import { Preview, applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    // 1. 💡 必须：为 Material 组件提供全局动画支持
    // applicationConfig({
    // }),

    // 2. 💡 必须：模拟 demo-app 里的 html/body 及外层 layout 环境
    componentWrapperDecorator((story) => `
      <div class="layout" dir="ltr" style="min-height: 100vh; padding: 16px; box-sizing: border-box;">
        ${story}
      </div>
    `),
  ],
};

export default preview;
