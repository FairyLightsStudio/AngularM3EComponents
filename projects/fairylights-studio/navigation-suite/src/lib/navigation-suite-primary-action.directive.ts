import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[matNavigationSuitePrimaryAction]',
})
export class MatNavigationSuitePrimaryAction {
  readonly templateRef: TemplateRef<unknown> = inject(TemplateRef);
}
