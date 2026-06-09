import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatNavigationSuiteComponent } from './navigation-suite.component';
import { MatNavigationSuitePrimaryAction } from './navigation-suite-primary-action.directive';
import { MatNavigationSuiteScaffoldDefaults } from './navigation-suite-scaffold-defaults';
import { MatNavigationSuiteScaffoldState } from './navigation-suite-scaffold-state';
import {
  MAT_NAVIGATION_SUITE_SCAFFOLD_CONTEXT,
  MatNavigationSuitePrimaryActionAlignment,
  MatNavigationSuiteScaffoldContext,
  MatNavigationSuiteType,
  MatNavigationSuiteVerticalArrangement,
  type MatNavigationSuitePrimaryActionContext,
} from './navigation-suite.types';

/** Responsive scaffold that switches between navigation bar and navigation rail layouts. */
@Component({
  selector: 'mat-navigation-suite-scaffold',
  imports: [NgTemplateOutlet, MatNavigationSuiteComponent, MatNavigationSuitePrimaryAction],
  providers: [
    {
      provide: MAT_NAVIGATION_SUITE_SCAFFOLD_CONTEXT,
      useExisting: forwardRef(() => MatNavigationSuiteScaffoldComponent),
    },
  ],
  templateUrl: './navigation-suite-scaffold.component.html',
  styleUrl: './navigation-suite-scaffold.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-navigation-suite-scaffold',
    '[class.mat-navigation-suite-scaffold--bar-compact]': 'currentNavSuiteType() === "BarCompact"',
    '[class.mat-navigation-suite-scaffold--bar-medium]': 'currentNavSuiteType() === "BarMedium"',
    '[class.mat-navigation-suite-scaffold--rail-collapsed]':
      'currentNavSuiteType() === "RailCollapsed"',
    '[class.mat-navigation-suite-scaffold--rail-expanded]':
      'currentNavSuiteType() === "RailExpanded"',
    '[class.mat-navigation-suite-scaffold--navigation-hidden]':
      'currentState().targetValue() === "hidden"',
    '[class.mat-navigation-suite-scaffold--navigation-animating]': 'currentState().isAnimating()',
  },
})
export class MatNavigationSuiteScaffoldComponent implements MatNavigationSuiteScaffoldContext {
  /** Explicit navigation layout, or `null` to use the responsive default. */
  navSuiteType = input<MatNavigationSuiteType | null>(null);

  /** External visibility/animation state controller. */
  state = input<MatNavigationSuiteScaffoldState | null>(null);

  /** Container background color token, CSS custom property, or raw CSS color. */
  containerColor = input('surface');

  /** Vertical placement of rail navigation items. */
  verticalArrangement = input<MatNavigationSuiteVerticalArrangement>('top');

  /** Placement of the primary action in bar layouts. */
  primaryActionAlignment = input<MatNavigationSuitePrimaryActionAlignment>('end');

  /** Whether the scaffold auto manages a rail expand/collapse toggle. Set to false to hide it. */
  railShowToggle = input(true);

  private readonly defaults = inject(MatNavigationSuiteScaffoldDefaults);
  private readonly defaultNavSuiteType = this.defaults.navSuiteType();
  private readonly fallbackState = new MatNavigationSuiteScaffoldState();
  private readonly primaryAction = contentChild(MatNavigationSuitePrimaryAction);
  private readonly requestedRailType = signal<'Collapsed' | 'Expanded' | null>(null);

  currentNavSuiteType = computed(() => {
    const navSuiteType = this.navSuiteType() ?? this.defaultNavSuiteType();
    const requestedRailType = this.requestedRailType();

    if (navSuiteType.startsWith('Rail') && requestedRailType !== null) {
      return requestedRailType === 'Expanded' ? 'RailExpanded' : 'RailCollapsed';
    }

    return navSuiteType;
  });
  currentState = computed(() => this.state() ?? this.fallbackState);
  isBar = computed(() => {
    const navSuiteType = this.currentNavSuiteType();
    return navSuiteType === 'BarCompact' || navSuiteType === 'BarMedium';
  });
  isRailExpanded = computed(() => this.currentNavSuiteType() === 'RailExpanded');
  barLayout = computed<'vertical' | 'horizontal'>(() =>
    this.currentNavSuiteType() === 'BarMedium' ? 'horizontal' : 'vertical',
  );
  primaryActionTemplate = computed(() => this.primaryAction()?.templateRef ?? null);
  primaryActionContext = computed<MatNavigationSuitePrimaryActionContext>(() => {
    const isBar = this.isBar();
    const isRailExpanded = this.isRailExpanded();
    const collapsed = isBar ? false : !isRailExpanded;

    return {
      $implicit: collapsed,
      collapsed,
      isBar,
      isRailExpanded,
    };
  });

  protected containerColorValue = computed(() => this.toCssColor(this.containerColor()));

  toggleRailExpanded(): void {
    if (!this.currentNavSuiteType().startsWith('Rail')) {
      return;
    }

    this.requestedRailType.set(this.isRailExpanded() ? 'Collapsed' : 'Expanded');
  }

  private toCssColor(color: string): string {
    const trimmed = color.trim();

    if (
      trimmed.startsWith('var(') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('rgb') ||
      trimmed.startsWith('hsl') ||
      trimmed === 'transparent'
    ) {
      return trimmed;
    }

    if (trimmed.startsWith('--')) {
      return `var(${trimmed})`;
    }

    return `var(--mat-sys-${trimmed}, ${trimmed})`;
  }
}
