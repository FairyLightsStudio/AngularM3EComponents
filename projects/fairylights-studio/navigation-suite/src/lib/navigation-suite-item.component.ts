import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatBadgePosition, MatBadgeSize } from '@angular/material/badge';
import { MatNavigationSuiteItemContent } from './navigation-suite.types';
const booleanTransform = (value: unknown) => value === '' || value === true || value === 'true';

/** Declarative item consumed by `mat-navigation-suite` and rendered as a bar or rail item. */
@Component({
  selector: 'mat-navigation-suite-item',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-navigation-suite-item',
    'aria-hidden': 'true',
    '[style.display]': '"none"',
  },
})
export class MatNavigationSuiteItemComponent {
  /** Whether this item represents the selected destination. */
  selected = input(false, { transform: booleanTransform });

  /** Default icon content, either text icon name or projected template content. */
  icon = input.required<MatNavigationSuiteItemContent>();

  /** Optional icon shown while the item is selected. */
  activeIcon = input<MatNavigationSuiteItemContent | null>(null);

  /** Item label content, either text or projected template content. */
  label = input.required<MatNavigationSuiteItemContent>();

  /** Badge content displayed on the item icon. */
  badge = input<string | number | undefined | null>(undefined);

  /** Theme color of the badge. */
  badgeColor = input<ThemePalette>(undefined);

  /** Position of the badge relative to the icon. */
  badgePosition = input<MatBadgePosition>('above after');

  /** Size of the badge. */
  badgeSize = input<MatBadgeSize>('medium');

  /** Whether the badge is hidden. */
  badgeHidden = input(false, { transform: booleanTransform });

  /** Whether the badge is disabled. */
  badgeDisabled = input(false, { transform: booleanTransform });

  /** Whether the badge overlaps the icon. */
  badgeOverlap = input(true, { transform: booleanTransform });

  /** Message used to describe the badge for assistive technology. */
  badgeDescription = input<string | undefined>(undefined);

  /** Emits when the rendered navigation item is clicked. */
  clicked = output<MouseEvent>({ alias: 'click' });
}
