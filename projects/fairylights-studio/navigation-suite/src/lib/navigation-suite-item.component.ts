import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatBadgePosition, MatBadgeSize } from '@angular/material/badge';
import { MatNavigationSuiteItemContent } from './navigation-suite.types';
const booleanTransform = (value: unknown) => value === '' || value === true || value === 'true';

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
  selected = input(false, { transform: booleanTransform });
  icon = input.required<MatNavigationSuiteItemContent>();
  activeIcon = input<MatNavigationSuiteItemContent | null>(null);
  label = input.required<MatNavigationSuiteItemContent>();

  badge = input<string | number | undefined | null>(undefined);
  badgeColor = input<ThemePalette>(undefined);
  badgePosition = input<MatBadgePosition>('above after');
  badgeSize = input<MatBadgeSize>('medium');
  badgeHidden = input(false, { transform: booleanTransform });
  badgeDisabled = input(false, { transform: booleanTransform });
  badgeOverlap = input(true, { transform: booleanTransform });
  badgeDescription = input<string | undefined>(undefined);

  clicked = output<MouseEvent>({ alias: 'click' });
}
