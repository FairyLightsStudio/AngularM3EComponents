/*
 * Public API Surface of navigation-bar
 */

export * from './lib/navigation-bar.component';
export * from './lib/navigation-bar-item.component';

import { MatNavigationBarComponent } from './lib/navigation-bar.component';
import { MatNavigationBarItemComponent } from './lib/navigation-bar-item.component';

export const MAT_NAVIGATION_BAR_MODULES = [
  MatNavigationBarComponent,
  MatNavigationBarItemComponent
] as const;
