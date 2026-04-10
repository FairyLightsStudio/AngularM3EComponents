import { Component, Input, HostBinding, inject, forwardRef, ElementRef, AfterViewInit, OnDestroy, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { MatNavigationRailComponent } from './navigation-rail.component';
import { MatNavigationRailLabel } from './directives';

@Component({
  selector: 'mat-navigation-rail-item',
  standalone: true,
  imports: [CommonModule, MatRippleModule],
  template: `
    <button class="mat-nav-rail-item-button" [class.active]="active" [attr.dir]="dir.value" #buttonEl>
      <!-- 状态/涟漪层 -->
      <div class="mat-nav-rail-state-layer" matRipple></div>

      <!-- Icon 层 -->
      <div class="mat-nav-rail-icon-container">
        <ng-content select="[matNavRailIcon]"></ng-content>
      </div>

      <!-- 核心修复 2：底部文字 (收起时显示，向上淡出) -->
      <div class="mat-nav-rail-label-bottom" [class.show]="!isExpanded">
        <ng-container *ngTemplateOutlet="label?.templateRef || null"></ng-container>
      </div>

      <!-- 核心修复 2：侧边文字 (展开时显示，向右淡入) -->
      <div class="mat-nav-rail-label-side" [class.show]="isExpanded">
        <ng-container *ngTemplateOutlet="label?.templateRef || null"></ng-container>
      </div>
    </button>
  `,
  styleUrls: ['./navigation-rail-item.component.scss']
})
export class MatNavigationRailItemComponent implements AfterViewInit, OnDestroy {
  @Input() active = false;

  // 捕获用户传入的 ng-template
  @ContentChild(MatNavigationRailLabel) label?: MatNavigationRailLabel;

  rail = inject(forwardRef(() => MatNavigationRailComponent), { optional: true });

  // 引入 CDK
  private focusMonitor = inject(FocusMonitor);
  private el = inject(ElementRef);
  public dir = inject(Directionality, { optional: true }) || { value: 'ltr' };

  get isExpanded() {
    return this.rail?.expanded;
  }

  @HostBinding('class.mat-nav-rail-item-expanded')
  get expandedClass() {
    return this.isExpanded;
  }

  // CDK FocusMonitor 接管焦点行为，增强 A11y 可访问性
  ngAfterViewInit() {
    this.focusMonitor.monitor(this.el, true);
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.el);
  }
}
