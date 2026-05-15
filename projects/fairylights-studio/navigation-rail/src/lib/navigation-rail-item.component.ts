import { Component, HostBinding, inject, forwardRef, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { MatNavigationRailComponent } from './navigation-rail.component';
import { MatNavigationItemBase } from '@fairylights-studio/navigation-common';

@Component({
  selector: 'mat-navigation-rail-item',
  standalone: true,
  imports: [CommonModule, MatRippleModule, MatBadgeModule],
  template: `
    <button class="mat-nav-rail-item-button" [class.active]="active()" [attr.dir]="dir.value" #buttonEl [disabled]="disabled()">

      <!-- 指示器容器 (Hug 还是 Fill) -->
      <div class="mat-nav-rail-indicator"
           [class.indicator-fill]="rail?.indicatorShape === 'fill'"
           [class.indicator-hug]="rail?.indicatorShape === 'hug'">

        <!-- 单独的涟漪层 (避免 overflow hidden 切断外界的 Badge) -->
        <div class="mat-nav-rail-ripple" matRipple [matRippleTrigger]="buttonEl" [matRippleDisabled]="disabled()"></div>

        <!-- 图标及徽标区域 -->
        <div class="mat-nav-rail-icon-box"
             [matBadge]="badge()"
             [matBadgeColor]="badgeColor()"
             [matBadgePosition]="badgePosition()"
             [matBadgeSize]="badgeSize()"
             [matBadgeHidden]="badgeHidden()"
             [matBadgeDisabled]="badgeDisabled()"
             [matBadgeOverlap]="badgeOverlap()">
          <span class="icon-default"><ng-content select="[matNavigationIcon], [matNavIcon]"></ng-content></span>
          <span class="icon-active"><ng-content select="[matNavigationActiveIcon], [matNavActiveIcon]"></ng-content></span>
        </div>

        <!-- 侧边文字 (展开态) -->
        <div class="mat-nav-rail-label-side">
          <!-- 💡 增加一个 inner 容器配合 Grid 动画 -->
          <div class="mat-nav-rail-label-inner">
            <ng-container *ngTemplateOutlet="label?.templateRef"></ng-container>
          </div>
        </div>

      </div>

      <!-- 底部文字 (收起态) -->
      <div class="mat-nav-rail-label-bottom">
        <!-- 💡 增加一层 inner 容器，专门负责垂直擦除的裁剪 -->
        <div class="mat-nav-rail-label-bottom-inner">
          <ng-container *ngTemplateOutlet="label?.templateRef"></ng-container>
        </div>
      </div>


    </button>
  `,
  styleUrls: ['./navigation-rail-item.component.scss'],
  host: {
    '[class.mat-nav-rail-item-disabled]': 'disabled()'
  }
})
export class MatNavigationRailItemComponent extends MatNavigationItemBase implements AfterViewInit, OnDestroy {
  rail = inject(forwardRef(() => MatNavigationRailComponent), { optional: true });
  private focusMonitor = inject(FocusMonitor);
  private el = inject(ElementRef);
  public dir = inject(Directionality, { optional: true }) || { value: 'ltr' };

  @HostBinding('class.mat-nav-rail-item-expanded')
  get expandedClass() {
    return this.rail?.expanded;
  }

  ngAfterViewInit() { this.focusMonitor.monitor(this.el, true); }
  ngOnDestroy() { this.focusMonitor.stopMonitoring(this.el); }
}
