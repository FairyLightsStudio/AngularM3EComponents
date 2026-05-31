import type { StorybookConfig } from '@storybook/angular';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: [
    '../../projects/fairylights-studio/**/*.stories.@(ts|tsx)',
    '../../projects/fairylights-studio/**/*.mdx',
  ],
  addons: [
    // Other addons go here
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {
    defaultName: 'Docs',
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs
