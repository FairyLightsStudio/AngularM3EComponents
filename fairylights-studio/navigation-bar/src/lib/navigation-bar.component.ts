import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'mat-navigation-bar',
  template: `
    <div class="mat-nav-bar-content">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './navigation-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatNavigationBarComponent {}
