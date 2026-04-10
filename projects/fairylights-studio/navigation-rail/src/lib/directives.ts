import { Directive, TemplateRef } from '@angular/core';

@Directive({ selector: '[matNavRailIcon]', standalone: true })
export class MatNavigationRailIcon {}


@Directive({ selector: 'ng-template[matNavRailLabel]', standalone: true })
export class MatNavigationRailLabel {
  constructor(public templateRef: TemplateRef<any>) {}
}
