import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import {
  MatNavigationItemBase,
  MatNavigationActiveIcon,
  MatNavigationIcon,
  MatNavigationLabel,
} from '@fairylights-studio/navigation-common';

@Component({
  selector: 'mat-navigation-bar-item',
  standalone: true,
  imports: [CommonModule, MatRippleModule, MatBadgeModule],
  templateUrl: './navigation-bar-item.component.html',
  styleUrl: './navigation-bar-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-navigation-bar-item',
    '[class.mat-navigation-bar-item-selected]': 'active()',
    '[class.mat-navigation-bar-item-always-show-label]':
      'alwaysShowLabel() || layout() === "horizontal"',
    '[class.mat-navigation-bar-item-disabled]': 'disabled()',
    '[class.mat-navigation-bar-item-horizontal]': 'layout() === "horizontal"',
  },
})
export class MatNavigationBarItemComponent extends MatNavigationItemBase {
  /**
   * Controls whether inactive items should always display their label.
   * This input has no effect when {@link layout} is `'horizontal'` — labels are always shown.
   *
   * 控制未激活项是否始终显示标签。当 {@link layout} 为 `'horizontal'` 时此输入无效，标签将始终显示。
   */
  alwaysShowLabel = input<boolean>(true);
  layout = input<'vertical' | 'horizontal'>('vertical');
}
