import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[matNavigationIcon], [matNavIcon]',
})
export class MatNavigationIcon {
  public templateRef = inject(TemplateRef<unknown>, { optional: true });
}

@Directive({
  selector: '[matNavigationActiveIcon], [matNavActiveIcon]',
})
export class MatNavigationActiveIcon {
  public templateRef = inject(TemplateRef<unknown>, { optional: true });
}

@Directive({
  selector: '[matNavigationLabel], [matNavLabel]',
})
export class MatNavigationLabel {
  public templateRef = inject(TemplateRef<unknown>, { optional: true });
}
