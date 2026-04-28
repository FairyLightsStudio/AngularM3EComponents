import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[matNavigationIcon], [matNavIcon]',
  standalone: true,
})
export class MatNavigationIcon {
  public templateRef = inject(TemplateRef<any>, { optional: true });
}

@Directive({
  selector: '[matNavigationActiveIcon], [matNavActiveIcon]',
  standalone: true,
})
export class MatNavigationActiveIcon {
  public templateRef = inject(TemplateRef<any>, { optional: true });
}

@Directive({
  selector: '[matNavigationLabel], [matNavLabel]',
  standalone: true,
})
export class MatNavigationLabel {
  public templateRef = inject(TemplateRef<any>, { optional: true });
}
