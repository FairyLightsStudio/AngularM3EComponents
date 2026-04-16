import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MatNavRailIndicatorShape = 'hug' | 'fill';

@Component({
  selector: 'mat-navigation-rail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mat-nav-rail-container">
      <!-- 头部内容 (如汉堡菜单、FAB) -->
      <ng-content select="mat-navigation-rail-header"></ng-content>

      <!-- 主内容区域，使用 flex 允许内部自由分布(如使用 spacer) -->
      <div class="mat-nav-rail-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./navigation-rail.component.scss']
})
export class MatNavigationRailComponent {
  @Input() expanded = false;
  @Input() indicatorShape: MatNavRailIndicatorShape = 'hug';
  @Input() showDivider = false;

  @HostBinding('class.mat-nav-rail-expanded')
  get getExpandedClass() {
    return this.expanded;
  }

  @HostBinding('class.mat-nav-rail-has-divider')
  get getDividerClass() {
    return this.showDivider;
  }
}
