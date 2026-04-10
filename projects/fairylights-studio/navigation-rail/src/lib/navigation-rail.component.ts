import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mat-navigation-rail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mat-nav-rail-container">
      <ng-content select="mat-navigation-rail-header"></ng-content>
      <div class="mat-nav-rail-content">
        <ng-content select="mat-navigation-rail-item"></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./navigation-rail.component.scss']
})
export class MatNavigationRailComponent {
  @Input() expanded = true;

  @HostBinding('class.mat-nav-rail-expanded')
  get getExpandedClass() {
    return this.expanded;
  }
}
