import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatNavigationItemBase, MatNavigationActiveIcon, MatNavigationIcon, MatNavigationLabel } from '@fairylights-studio/navigation-common';

@Component({
  selector: 'mat-navigation-bar-item',
  standalone: true,
  imports: [CommonModule, MatRippleModule],
  templateUrl: './navigation-bar-item.component.html',
  styleUrl: './navigation-bar-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'mat-navigation-bar-item',
    '[class.mat-navigation-bar-item-selected]': 'active()',
    '[class.mat-navigation-bar-item-always-show-label]': 'alwaysShowLabel()',
    '[class.mat-navigation-bar-item-disabled]': 'disabled()',
    '[class.mat-navigation-bar-item-horizontal]': 'layout() === "horizontal"'
  }
})
export class MatNavigationBarItemComponent extends MatNavigationItemBase {
  alwaysShowLabel = input<boolean>(true);
  layout = input<'vertical' | 'horizontal'>('vertical');
}
