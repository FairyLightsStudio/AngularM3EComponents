import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MatNavRailIndicatorShape = 'hug' | 'fill';

@Component({
  selector: 'mat-navigation-rail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mat-nav-rail-container">
      <ng-content select="mat-navigation-rail-header"></ng-content>
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
  @Input() verticalArrangement: 'top' | 'center' | 'bottom' = 'top';

  @HostBinding('class.mat-nav-rail-expanded')
  get getExpandedClass() {
    return this.expanded;
  }

  @HostBinding('class.mat-nav-rail-has-divider')
  get getDividerClass() {
    return this.showDivider;
  }

  @HostBinding('attr.data-indicator-shape')
  get getIndicatorShapeAttr() {
    return this.indicatorShape;
  }

  @HostBinding('attr.data-vertical-arrangement')
  get getVerticalArrangementAttr() {
    return this.verticalArrangement;
  }
}
