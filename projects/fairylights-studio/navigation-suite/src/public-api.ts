/*
 * Public API Surface of navigation-suite
 */

export * from './lib/navigation-suite-scaffold.component';

import {
  MatNavigationSuiteScaffoldComponent,
  MatNavigationSuiteItem,
  MatNavigationSuitePrimaryAction,
} from './lib/navigation-suite-scaffold.component';
import {
  MatNavigationIcon,
  MatNavigationActiveIcon,
  MatNavigationLabel,
} from '@fairylights-studio/navigation-common';

export const MAT_NAVIGATION_SUITE_MODULES = [
  MatNavigationSuiteScaffoldComponent,
  MatNavigationSuiteItem,
  MatNavigationSuitePrimaryAction,
  MatNavigationIcon,
  MatNavigationActiveIcon,
  MatNavigationLabel,
] as const;
