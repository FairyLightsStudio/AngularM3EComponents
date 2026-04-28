/*
 * Public API Surface of navigation-suite
 */

export * from './lib/navigation-suite-scaffold.component';

import { MatNavigationSuiteScaffoldComponent, MatNavigationSuiteItem, MatNavigationSuitePrimaryAction } from './lib/navigation-suite-scaffold.component';
export const MAT_NAVIGATION_SUITE_MODULES = [
  MatNavigationSuiteScaffoldComponent,
  MatNavigationSuiteItem,
  MatNavigationSuitePrimaryAction
] as const;
