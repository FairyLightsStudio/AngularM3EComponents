import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  forwardRef,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { MatNavigationRailComponent } from './navigation-rail.component';
import { MatNavigationItemBase } from '@fairylights-studio/navigation-common';

@Component({
  selector: 'mat-navigation-rail-item',
  standalone: true,
  imports: [CommonModule, MatRippleModule, MatBadgeModule],
  template: `
    <button
      class="mat-nav-rail-item-button"
      [class.active]="active()"
      [attr.dir]="dir.value"
      #buttonEl
    >
      <div
        class="mat-nav-rail-indicator"
        [class.indicator-fill]="rail?.indicatorShape === 'fill'"
        [class.indicator-hug]="rail?.indicatorShape === 'hug'"
      >
        <div class="mat-nav-rail-ripple" matRipple [matRippleTrigger]="buttonEl"></div>

        <div
          class="mat-nav-rail-icon-box"
          [matBadge]="badge()"
          [matBadgeColor]="badgeColor()"
          [matBadgePosition]="badgePosition()"
          [matBadgeSize]="badgeSize()"
          [matBadgeHidden]="badgeHidden()"
          [matBadgeDisabled]="badgeDisabled()"
          [matBadgeOverlap]="badgeOverlap()"
        >
          <span class="icon-default"
            ><ng-content select="[matNavigationIcon], [matNavIcon]"></ng-content
          ></span>
          <span class="icon-active"
            ><ng-content select="[matNavigationActiveIcon], [matNavActiveIcon]"></ng-content
          ></span>
        </div>

        <div class="mat-nav-rail-label-side">
          <div class="mat-nav-rail-label-inner">
            <ng-container *ngTemplateOutlet="label?.templateRef"></ng-container>
          </div>
        </div>
      </div>

      <div class="mat-nav-rail-label-bottom">
        <div class="mat-nav-rail-label-bottom-inner">
          <ng-container *ngTemplateOutlet="label?.templateRef"></ng-container>
        </div>
      </div>
    </button>
  `,
  styleUrl: './navigation-rail-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.mat-nav-rail-item-expanded]': 'rail?.expanded',
    '[attr.tabindex]': '_tabIndex',
    '[attr.role]': '"tab"',
    '[attr.aria-selected]': 'active()',
    '[attr.aria-current]': 'active() ? "page" : null',
  },
})
export class MatNavigationRailItemComponent
  extends MatNavigationItemBase
  implements AfterViewInit, OnDestroy
{
  rail = inject(
    forwardRef(() => MatNavigationRailComponent),
    {
      optional: true,
    },
  );
  private _focusMonitor = inject(FocusMonitor);
  private _el = inject<ElementRef<HTMLElement>>(ElementRef);
  dir = inject(Directionality, { optional: true }) || { value: 'ltr' };

  _tabIndex = -1;

  focus(origin?: FocusOrigin): void {
    this._el.nativeElement.focus({
      preventScroll: origin === 'keyboard',
    });
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
