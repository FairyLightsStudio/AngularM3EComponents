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
import { ViewportRuler } from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs/operators';
import { MatNavigationSuiteComponent } from './navigation-suite.component';
import { MatNavigationSuitePrimaryAction } from './navigation-suite-primary-action.directive';
import { MatNavigationSuiteScaffoldDefaults } from './navigation-suite-scaffold-defaults';
import { MatNavigationSuiteScaffoldState } from './navigation-suite-scaffold-state';
import {
  MAT_NAVIGATION_SUITE_SCAFFOLD_CONTEXT,
  MatNavigationSuitePrimaryActionAlignment,
  MatNavigationSuiteResolvedType,
  MatNavigationSuiteScaffoldContext,
  MatNavigationSuiteType,
  MatNavigationSuiteVerticalArrangement,
  type MatNavigationSuitePrimaryActionContext,
} from './navigation-suite.types';

const barMediumItemWidth = 168;

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
  /** Explicit navigation layout, or `Auto` to use the responsive default. */
  navSuiteType = input<MatNavigationSuiteType>('Auto');

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
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly defaultNavSuiteType = this.defaults.navSuiteType();
  private readonly defaultNavSuiteTypeIsAuto = this.defaults.navSuiteTypeIsAuto();
  private readonly fallbackState = new MatNavigationSuiteScaffoldState();
  private readonly primaryAction = contentChild(MatNavigationSuitePrimaryAction);
  private readonly navigationSuite = contentChild(MatNavigationSuiteComponent);
  private readonly requestedRailType = signal<'Collapsed' | 'Expanded' | null>(null);
  private readonly viewportWidth = toSignal(
    this.viewportRuler.change().pipe(
      startWith(null),
      map(() => this.viewportRuler.getViewportSize().width),
    ),
    { initialValue: this.viewportRuler.getViewportSize().width },
  );

  currentNavSuiteType = computed<MatNavigationSuiteResolvedType>(() => {
    const requestedNavSuiteType = this.navSuiteType();
    const isAutoNavSuiteType = requestedNavSuiteType === 'Auto';
    const navSuiteType = this.resolveRequestedNavSuiteType(requestedNavSuiteType);
    const requestedRailType = this.requestedRailType();

    if (navSuiteType.startsWith('Rail') && requestedRailType !== null) {
      return requestedRailType === 'Expanded' ? 'RailExpanded' : 'RailCollapsed';
    }

    if (
      isAutoNavSuiteType &&
      this.defaultNavSuiteTypeIsAuto() &&
      this.shouldAutoBarMediumDowngrade2Compact(navSuiteType)
    ) {
      return 'BarCompact';
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

  // 如果用户放了很多的 item 在 BarMedium 中，那么在确定BarMedium撑不下去时，降级到 BarCompact，避免 item 标签重叠。
  private shouldAutoBarMediumDowngrade2Compact(navSuiteType: MatNavigationSuiteResolvedType): boolean {
    if (navSuiteType !== 'BarMedium') {
      return false;
    }

    const itemCount = this.navigationSuite()?.itemCount() ?? 0;
    return itemCount > 0 && this.viewportWidth() < itemCount * barMediumItemWidth;
  }

  private resolveRequestedNavSuiteType(
    navSuiteType: MatNavigationSuiteType,
  ): MatNavigationSuiteResolvedType {
    return navSuiteType === 'Auto' ? this.defaultNavSuiteType() : navSuiteType;
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
