import { Component, ElementRef, AfterViewInit, OnDestroy, inject, forwardRef } from '@angular/core';
import { MatNavigationRailComponent } from './navigation-rail.component';

@Component({
  selector: 'mat-navigation-rail-header',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styleUrls: ['./navigation-rail-header.component.scss']
})
export class MatNavigationRailHeaderComponent implements AfterViewInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  // 获取父级 Rail 组件，以判断当前是否处于展开状态
  private rail = inject(forwardRef(() => MatNavigationRailComponent), { optional: true });

  private resizeObserver!: ResizeObserver;
  private mutationObserver!: MutationObserver;

  ngAfterViewInit() {
    // 1. 使用 ResizeObserver 精确测量元素宽度
    this.resizeObserver = new ResizeObserver((entries) => {
      // 🚨 核心逻辑：如果在展开状态，元素(如扩展FAB)的宽度正在变大，此时测量是不准确的。
      // 我们只在“闭合状态(Collapsed)”下测量它的原生静态宽度，锁定锚点！
      if (this.rail?.expanded) return;

      for (const entry of entries) {
        const existingMeasuredMargin = (entry.target as HTMLElement).style
          .getPropertyValue('--_measured-margin')
          .trim();
        if (existingMeasuredMargin) continue;

        const target = entry.target as HTMLElement;
        const width = target.offsetWidth;

        if (width > 0) {
          // Rail 闭合时的总宽度是 80px，计算出完美居中的左外边距
          const offset = (80 - width) / 2;
          // 将计算结果作为一个局部的 CSS 变量写入该 DOM 元素
          target.style.setProperty('--_measured-margin', `${offset}px`);
        }
      }
    });

    // 2. 使用 MutationObserver 监听动态添加的元素 (比如用户用了 *ngIf 延迟显示按钮)
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.resizeObserver.observe(node as Element);
          }
        });
      });
    });

    // 开启 DOM 监听
    this.mutationObserver.observe(this.el.nativeElement, { childList: true });

    // 初始化时，监听当前已经存在的直接子元素
    Array.from(this.el.nativeElement.children).forEach((child) => {
      this.resizeObserver.observe(child);
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}
