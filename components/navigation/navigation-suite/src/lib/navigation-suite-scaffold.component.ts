import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  OnDestroy,
  signal,
  untracked,
  viewChild,
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
  MatNavigationSuiteVisibility,
  type MatNavigationSuitePrimaryActionContext,
} from './navigation-suite.types';

const barMediumItemWidth = 168;

// `transitionend` is the primary settlement signal, but browsers can skip it
// when a transition is cancelled, reduced to zero duration, or interrupted by
// a fast state change. The timeout fallback waits slightly past the computed
// CSS duration so scaffold state promises do not hang.
const transitionEndFallbackBufferMs = 50;
const railWidthMeasurementTolerancePx = 1;

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
export class MatNavigationSuiteScaffoldComponent
  implements OnDestroy, MatNavigationSuiteScaffoldContext
{
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
  private readonly layoutElement = viewChild<ElementRef<HTMLElement>>('layout');
  private readonly navigationElement = viewChild<ElementRef<HTMLElement>>('navigation');
  private readonly requestedRailType = signal<'Collapsed' | 'Expanded' | null>(null);
  // Expanded rails can size to `max-content`, which is not broadly animatable
  // back to a fixed collapsed width. Cache the latest measured pixel width for
  // the content offset; the rail surface itself uses a separate freeze below.
  private readonly railExpandedSize = signal<number | null>(null);
  private readonly railSurfaceSize = signal<string | null>(null);
  private readonly viewportWidth = toSignal(
    this.viewportRuler.change().pipe(
      startWith(null),
      map(() => this.viewportRuler.getViewportSize().width),
    ),
    { initialValue: this.viewportRuler.getViewportSize().width },
  );
  private railMeasureFrame: number | null = null;
  private railMeasureTimeout: ReturnType<typeof setTimeout> | null = null;
  private railSurfaceSizeResetTimeout: ReturnType<typeof setTimeout> | null = null;
  private settlementFrame: number | null = null;
  private settlementTimeout: ReturnType<typeof setTimeout> | null = null;

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
  protected navigationSizeValue = computed(() =>
    this.defaultNavigationSize(this.currentNavSuiteType()),
  );
  protected navigationSurfaceSizeValue = computed(
    () => this.railSurfaceSize() ?? this.defaultNavigationSurfaceSize(this.currentNavSuiteType()),
  );

  private readonly railExpandedSizeEffect = effect(() => {
    if (this.currentNavSuiteType() === 'RailExpanded') {
      this.scheduleRailExpandedSizeMeasure();
    } else {
      this.clearRailExpandedSizeMeasure();
    }
  });

  private readonly transitionSettlementEffect = effect(() => {
    const state = this.currentState();
    const targetValue = state.targetValue();
    const isAnimating = state.isAnimating();
    const navSuiteType = this.currentNavSuiteType();

    if (isAnimating) {
      if (navSuiteType === 'RailExpanded') {
        // Visibility transitions use the cached expanded rail width only for
        // the content offset. The rail surface itself keeps its width and
        // slides like mat-sidenav.
        untracked(() => this.freezeCurrentRailExpandedSize());
      }

      this.scheduleTransitionSettlement(state, targetValue, navSuiteType);
    } else {
      this.clearTransitionSettlement();
    }
  });

  ngOnDestroy(): void {
    this.clearRailExpandedSizeMeasure();
    this.clearRailSurfaceSizeReset();
    this.clearTransitionSettlement();
  }

  toggleRailExpanded(): void {
    if (!this.currentNavSuiteType().startsWith('Rail')) {
      return;
    }

    if (this.isRailExpanded()) {
      // If the user collapses while the rail is still expanding, there may not
      // be a settled cached width yet. Freeze the rendered surface separately
      // so the inner rail can animate its max-width down to the collapsed size.
      const frozenWidth = this.freezeCurrentRailExpandedSize();
      this.requestedRailType.set('Collapsed');
      this.scheduleRailSurfaceSizeReset(frozenWidth);
      return;
    }

    this.clearRailSurfaceSizeReset();
    this.requestedRailType.set('Expanded');
    this.scheduleRailSurfaceSizeReset();
  }

  protected handleLayoutTransitionEnd(event: TransitionEvent): void {
    if (!this.currentState().isAnimating() || !this.isSettlementTransitionEnd(event)) {
      return;
    }

    this.completeCurrentTransition();
  }

  protected handleLayoutTransitionCancel(event: TransitionEvent): void {
    if (!this.isSettlementTransitionProperty(event)) {
      return;
    }

    const state = this.currentState();

    if (state.isAnimating()) {
      this.scheduleTransitionSettlement(state, state.targetValue(), this.currentNavSuiteType());
    }
  }

  // 如果用户放了很多的 item 在 BarMedium 中，那么在确定BarMedium撑不下去时，降级到 BarCompact，避免 item 标签重叠。
  private shouldAutoBarMediumDowngrade2Compact(
    navSuiteType: MatNavigationSuiteResolvedType,
  ): boolean {
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

  private scheduleRailExpandedSizeMeasure(): void {
    this.clearRailExpandedSizeMeasure();

    if (typeof window === 'undefined') {
      return;
    }

    this.railMeasureFrame = window.requestAnimationFrame(() => {
      this.railMeasureFrame = null;

      if (this.currentNavSuiteType() !== 'RailExpanded') {
        return;
      }

      const railElement = this.getRailElement();
      const delay = railElement === null ? 0 : this.transitionTotalMs(railElement, 'max-width');

      // Wait until the rail's own max-width transition settles before reading
      // its intrinsic expanded width. Measuring during the transition would
      // reintroduce the "chasing width" jank this cache is meant to avoid.
      this.railMeasureTimeout = setTimeout(() => {
        this.railMeasureTimeout = null;

        if (this.currentNavSuiteType() === 'RailExpanded') {
          this.measureRailExpandedSize();
        }
      }, delay + transitionEndFallbackBufferMs);
    });
  }

  private clearRailExpandedSizeMeasure(): void {
    if (this.railMeasureFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.railMeasureFrame);
      this.railMeasureFrame = null;
    }

    if (this.railMeasureTimeout !== null) {
      clearTimeout(this.railMeasureTimeout);
      this.railMeasureTimeout = null;
    }
  }

  private measureRailExpandedSize(): void {
    const width = this.measureCurrentRailWidth();

    if (width === null) {
      return;
    }

    this.setRailExpandedSize(width);
  }

  private freezeCurrentRailExpandedSize(): number | null {
    const layoutElement = this.layoutElement()?.nativeElement;
    const measuredWidth = this.measureCurrentRailWidth();

    if (layoutElement === undefined || measuredWidth === null) {
      return null;
    }

    const offsetWidth = this.setRailExpandedSize(measuredWidth);
    const offsetWidthValue = `${offsetWidth}px`;
    const surfaceWidthValue = `${measuredWidth}px`;

    this.railSurfaceSize.set(surfaceWidthValue);
    layoutElement.style.setProperty(
      '--flight-nav-suite-scaffold-navigation-size',
      offsetWidthValue,
    );
    layoutElement.style.setProperty(
      '--flight-nav-suite-scaffold-navigation-surface-size',
      surfaceWidthValue,
    );
    // Force the browser to commit the frozen custom properties before the
    // class change swaps the content offset to the collapsed value.
    void layoutElement.offsetWidth;

    return measuredWidth;
  }

  private measureCurrentRailWidth(): number | null {
    const railElement = this.getRailElement();

    if (railElement === null) {
      return null;
    }

    const width = railElement.offsetWidth || railElement.getBoundingClientRect().width;
    const roundedWidth = Math.round(width);

    return roundedWidth > 0 ? roundedWidth : null;
  }

  private setRailExpandedSize(width: number): number {
    const currentWidth = untracked(() => this.railExpandedSize());

    if (
      currentWidth !== null &&
      Math.abs(currentWidth - width) <= railWidthMeasurementTolerancePx
    ) {
      return currentWidth;
    }

    this.railExpandedSize.set(width);
    return width;
  }

  private scheduleRailSurfaceSizeReset(frozenWidth: number | null = null): void {
    this.clearRailSurfaceSizeReset();

    if (frozenWidth === null && untracked(() => this.railSurfaceSize()) === null) {
      return;
    }

    if (typeof window === 'undefined') {
      this.railSurfaceSize.set(null);
      return;
    }

    const railElement = this.getRailElement();
    const delay = railElement === null ? 0 : this.transitionTotalMs(railElement, 'max-width');

    this.railSurfaceSizeResetTimeout = setTimeout(() => {
      this.railSurfaceSizeResetTimeout = null;
      this.railSurfaceSize.set(null);
    }, delay + transitionEndFallbackBufferMs);
  }

  private clearRailSurfaceSizeReset(): void {
    if (this.railSurfaceSizeResetTimeout !== null) {
      clearTimeout(this.railSurfaceSizeResetTimeout);
      this.railSurfaceSizeResetTimeout = null;
    }
  }

  private getRailElement(): HTMLElement | null {
    return (
      this.navigationElement()?.nativeElement.querySelector<HTMLElement>('mat-navigation-rail') ??
      null
    );
  }

  private scheduleTransitionSettlement(
    state: MatNavigationSuiteScaffoldState,
    targetValue: MatNavigationSuiteVisibility,
    navSuiteType: MatNavigationSuiteResolvedType,
  ): void {
    this.clearTransitionSettlement();

    if (typeof window === 'undefined') {
      state._completeTransition();
      return;
    }

    this.settlementFrame = window.requestAnimationFrame(() => {
      this.settlementFrame = null;

      if (!this.isExpectedTransition(state, targetValue)) {
        return;
      }

      const totalTransitionMs = this.settlementTransitionTotalMs(navSuiteType);

      if (this.prefersReducedMotion() || totalTransitionMs === 0) {
        this.completeCurrentTransition();
        return;
      }

      // Fallback for missing transitionend events. The state check inside the
      // callback keeps old timers from completing a newer interrupted transition.
      this.settlementTimeout = setTimeout(() => {
        if (this.isExpectedTransition(state, targetValue)) {
          this.completeCurrentTransition();
        }
      }, totalTransitionMs + transitionEndFallbackBufferMs);
    });
  }

  private clearTransitionSettlement(): void {
    if (this.settlementFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.settlementFrame);
      this.settlementFrame = null;
    }

    if (this.settlementTimeout !== null) {
      clearTimeout(this.settlementTimeout);
      this.settlementTimeout = null;
    }
  }

  private completeCurrentTransition(): void {
    this.clearTransitionSettlement();
    this.railSurfaceSize.set(null);
    this.currentState()._completeTransition();
  }

  private isExpectedTransition(
    state: MatNavigationSuiteScaffoldState,
    targetValue: MatNavigationSuiteVisibility,
  ): boolean {
    return (
      this.currentState() === state && state.targetValue() === targetValue && state.isAnimating()
    );
  }

  private isLayoutTransitionProperty(propertyName: string): boolean {
    return (
      propertyName === 'grid-template-rows' ||
      propertyName === 'grid-template-columns' ||
      propertyName === 'all'
    );
  }

  private isTransformTransitionProperty(propertyName: string): boolean {
    return propertyName === 'transform' || propertyName === 'all';
  }

  private layoutTransitionProperty(navSuiteType: MatNavigationSuiteResolvedType): string {
    return this.isNavigationBar(navSuiteType) ? 'grid-template-rows' : 'grid-template-columns';
  }

  private isSettlementTransitionEnd(event: TransitionEvent): boolean {
    if (!this.isSettlementTransitionProperty(event)) {
      return false;
    }

    const navSuiteType = this.currentNavSuiteType();
    const eventTotalMs = this.transitionTotalMs(event.target as HTMLElement, event.propertyName);

    return eventTotalMs >= this.settlementTransitionTotalMs(navSuiteType);
  }

  private isSettlementTransitionProperty(event: TransitionEvent): boolean {
    const layoutElement = this.layoutElement()?.nativeElement;
    const navigationElement = this.navigationElement()?.nativeElement;
    const eventTarget = event.target;

    if (eventTarget === layoutElement && this.isLayoutTransitionProperty(event.propertyName)) {
      return true;
    }

    return (
      !this.isNavigationBar(this.currentNavSuiteType()) &&
      eventTarget === navigationElement &&
      this.isTransformTransitionProperty(event.propertyName)
    );
  }

  private settlementTransitionTotalMs(navSuiteType: MatNavigationSuiteResolvedType): number {
    const layoutElement = this.layoutElement()?.nativeElement;

    if (layoutElement === undefined) {
      return 0;
    }

    const layoutTotalMs = this.transitionTotalMs(
      layoutElement,
      this.layoutTransitionProperty(navSuiteType),
    );

    if (this.isNavigationBar(navSuiteType)) {
      return layoutTotalMs;
    }

    const navigationElement = this.navigationElement()?.nativeElement;
    const navigationTotalMs =
      navigationElement === undefined ? 0 : this.transitionTotalMs(navigationElement, 'transform');

    // Rail mode mirrors mat-sidenav: the surface slides with transform while
    // the content offset animates separately. State promises settle after the
    // slower of those two transitions.
    return Math.max(layoutTotalMs, navigationTotalMs);
  }

  private transitionTotalMs(element: HTMLElement, propertyName: string): number {
    const styles = getComputedStyle(element);
    const properties = styles.transitionProperty.split(',').map((property) => property.trim());
    const durations = this.parseTransitionTimeList(styles.transitionDuration);
    const delays = this.parseTransitionTimeList(styles.transitionDelay);
    let totalMs = 0;

    for (let index = 0; index < properties.length; index += 1) {
      const property = properties[index];

      if (property !== propertyName && property !== 'all') {
        continue;
      }

      const duration = durations[index % durations.length] ?? 0;
      const delay = delays[index % delays.length] ?? 0;
      totalMs = Math.max(totalMs, duration + delay);
    }

    return totalMs;
  }

  private parseTransitionTimeList(value: string): number[] {
    return value.split(',').map((time) => {
      const trimmed = time.trim();
      const parsed = Number.parseFloat(trimmed);

      if (!Number.isFinite(parsed)) {
        return 0;
      }

      return trimmed.endsWith('ms') ? parsed : parsed * 1000;
    });
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
  }

  private defaultNavigationSize(navSuiteType: MatNavigationSuiteResolvedType): string {
    switch (navSuiteType) {
      case 'BarCompact':
        return 'var(--flight-nav-suite-scaffold-bar-compact-height, var(--flight-nav-bar-container-height, 80px))';
      case 'BarMedium':
        return 'var(--flight-nav-suite-scaffold-bar-medium-height, var(--flight-nav-bar-container-horizontal-height, 64px))';
      case 'RailCollapsed':
        return 'var(--flight-nav-rail-container-collapsed-width, 80px)';
      case 'RailExpanded': {
        const measuredWidth = this.railExpandedSize();
        // The absolutely positioned rail surface can size itself with
        // max-content, but the grid track cannot infer that intrinsic width.
        // Keep content at the collapsed offset until the expanded rail has
        // settled and we have a real pixel width to animate toward.
        return measuredWidth === null
          ? 'var(--flight-nav-suite-scaffold-rail-expanded-width, var(--flight-nav-rail-container-collapsed-width, 80px))'
          : `${measuredWidth}px`;
      }
    }
  }

  private defaultNavigationSurfaceSize(navSuiteType: MatNavigationSuiteResolvedType): string {
    switch (navSuiteType) {
      case 'BarCompact':
      case 'BarMedium':
      case 'RailCollapsed':
        return this.defaultNavigationSize(navSuiteType);
      case 'RailExpanded':
        // Only the absolutely positioned surface may fall back to max-content.
        // The grid content offset uses a real length until measurement.
        return 'var(--flight-nav-suite-scaffold-rail-expanded-width, max-content)';
    }
  }

  private isNavigationBar(navSuiteType: MatNavigationSuiteResolvedType): boolean {
    return navSuiteType === 'BarCompact' || navSuiteType === 'BarMedium';
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
