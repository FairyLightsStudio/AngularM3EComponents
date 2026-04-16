import { Directive, TemplateRef } from '@angular/core';

@Directive({ selector: '[matNavRailIcon]', standalone: true })
export class MatNavigationRailIcon {}

// 选中状态下的实心图标
@Directive({ selector: '[matNavRailActiveIcon]', standalone: true })
export class MatNavigationRailActiveIcon {}

@Directive({ selector: 'ng-template[matNavRailLabel]', standalone: true })
export class MatNavigationRailLabel {
  constructor(public templateRef: TemplateRef<any>) {}
}
