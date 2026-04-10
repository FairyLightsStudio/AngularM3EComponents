/*
 * Public API Surface of navigation-rail
 */

export * from './lib/navigation-rail.component';
export * from './lib/navigation-rail-header.component';
export * from './lib/navigation-rail-item.component';
export * from './lib/directives';

import { MatNavigationRailComponent } from './lib/navigation-rail.component';
import { MatNavigationRailHeaderComponent } from './lib/navigation-rail-header.component';
import { MatNavigationRailItemComponent } from './lib/navigation-rail-item.component';
import { MatNavigationRailLabel,MatNavigationRailIcon } from './lib/directives';

export const MAT_NAVIGATION_RAIL_MODULES = [
  MatNavigationRailComponent,
  MatNavigationRailHeaderComponent,
  MatNavigationRailItemComponent,
  MatNavigationRailIcon,
  MatNavigationRailLabel
] as const;

