import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
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
    '[class.mat-navigation-bar-item-horizontal]': 'layout() === "horizontal"',
    '[attr.tabindex]': '_tabIndex',
    '[attr.role]': 'role()',
    '[attr.aria-selected]': 'active()',
    '[attr.aria-current]': 'active() ? "page" : null',
  },
})
export class MatNavigationBarItemComponent
  extends MatNavigationItemBase
  implements AfterViewInit, OnDestroy
{
  alwaysShowLabel = input<boolean>(true);
  layout = input<'vertical' | 'horizontal'>('vertical');
  role = input<string>('tab');

  private _focusMonitor = inject(FocusMonitor);
  private _el = inject<ElementRef<HTMLElement>>(ElementRef);

  _tabIndex = -1;

  focus(origin?: FocusOrigin): void {
    this._el.nativeElement.focus({ preventScroll: origin === 'keyboard' });
  }

  _getHostElement(): HTMLElement {
    return this._el.nativeElement;
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._el, true);
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._el);
  }
}
