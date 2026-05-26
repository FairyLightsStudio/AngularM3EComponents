import { Directive, ContentChild, input } from '@angular/core';
import { MatNavigationIcon, MatNavigationActiveIcon, MatNavigationLabel } from './directives';
import { ThemePalette } from '@angular/material/core';
import { MatBadgePosition, MatBadgeSize } from '@angular/material/badge';

const booleanTransform = (v: string | boolean) => v === '' || v === true || v === 'true';

@Directive()
export class MatNavigationItemBase {
  /** Whether the navigation item is active/selected. */
  active = input<boolean>(false);

  /** Content query for the default icon. */
  @ContentChild(MatNavigationIcon) icon?: MatNavigationIcon;

  /** Content query for the active/selected icon. */
  @ContentChild(MatNavigationActiveIcon) activeIcon?: MatNavigationActiveIcon;

  /** Content query for the label. */
  @ContentChild(MatNavigationLabel) label?: MatNavigationLabel;

  /** The content for the badge */
  badge = input<string | number | undefined | null>(undefined);

  /** Theme color of the badge */
  badgeColor = input<ThemePalette>(undefined);

  /** Position the badge should reside */
  badgePosition = input<MatBadgePosition>('above after');

  /** Size of the badge */
  badgeSize = input<MatBadgeSize>('medium');

  /** Whether the badge is hidden */
  badgeHidden = input(false, { transform: booleanTransform });

  /** Whether the badge is disabled */
  badgeDisabled = input(false, { transform: booleanTransform });

  /** Whether the badge should overlap its contents */
  badgeOverlap = input(true, { transform: booleanTransform });

  /** Message used to describe the decorated element via aria-describedby */
  badgeDescription = input<string | undefined>(undefined);
}
