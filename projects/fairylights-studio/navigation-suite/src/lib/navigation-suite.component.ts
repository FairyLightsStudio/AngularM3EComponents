import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatNavigationBarComponent,
  MatNavigationBarItemComponent,
} from '@fairylights-studio/navigation-bar';
import {
  MAT_NAVIGATION_RAIL_MODULES
} from '@fairylights-studio/navigation-rail';
import {
  MatNavigationActiveIcon,
  MatNavigationIcon,
  MatNavigationLabel,
} from '@fairylights-studio/navigation-common';
import { MatNavigationSuiteItemComponent } from './navigation-suite-item.component';
import {
  MAT_NAVIGATION_SUITE_SCAFFOLD_CONTEXT,
  MatNavigationSuiteItemContent,
} from './navigation-suite.types';

/**
 * Projection adapter owned by `mat-navigation-suite-scaffold`.
 *
 * This component intentionally requires `MAT_NAVIGATION_SUITE_SCAFFOLD_CONTEXT`.
 * Do not add standalone fallback state here; scaffold is the single owner of
 * responsive navigation type, rail expansion, and primary action placement.
 */
@Component({
  selector: 'mat-navigation-suite',
  imports: [
    NgTemplateOutlet,
    MatIconModule,
    MatNavigationBarComponent,
    MatNavigationBarItemComponent,
    MAT_NAVIGATION_RAIL_MODULES,
    MatNavigationIcon,
    MatNavigationActiveIcon,
    MatNavigationLabel,
  ],
  templateUrl: './navigation-suite.component.html',
  styleUrl: './navigation-suite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-navigation-suite',
  },
})
export class MatNavigationSuiteComponent {
  readonly alwaysShowLabel = input(true);
  readonly ariaLabel = input('');

  readonly projectedItems = contentChildren(MatNavigationSuiteItemComponent);

  private readonly scaffold = inject(MAT_NAVIGATION_SUITE_SCAFFOLD_CONTEXT);

  readonly currentVerticalArrangement = this.scaffold.verticalArrangement;
  readonly primaryActionTemplate = this.scaffold.primaryActionTemplate;
  readonly isBar = this.scaffold.isBar;
  readonly barLayout = this.scaffold.barLayout;
  readonly isRailExpanded = this.scaffold.isRailExpanded;
  readonly currentAlwaysShowLabel = computed(
    () => this.barLayout() === 'horizontal' || this.alwaysShowLabel(),
  );

  toggleRailExpanded(): void {
    this.scaffold.toggleRailExpanded();
  }

  asTemplateRef(value: MatNavigationSuiteItemContent | null | undefined): TemplateRef<unknown> | null {
    return value instanceof TemplateRef ? value : null;
  }

  asText(value: MatNavigationSuiteItemContent | null | undefined): string {
    return typeof value === 'string' ? value : '';
  }

  emitProjectedItemClick(item: MatNavigationSuiteItemComponent, event: Event): void {
    item.clicked.emit(event as MouseEvent);
  }
}
