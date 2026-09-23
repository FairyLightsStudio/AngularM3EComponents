import { Directionality } from '@angular/cdk/bidi';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { MatPaneDirective } from './pane.directive';
import { MatPaneRendererComponent } from './pane-renderer.component';
import { MatPaneResizeHandleComponent } from './pane-resize-handle.component';
import { MatPaneExpansionState } from './pane-expansion-state';
import { MatPaneNavigator } from './pane-navigator';
import {
  calculatePanePopoverPlacement,
  calculatePaneRects,
  resolveAutoLevitationPosition,
  type MatPanePopoverPlacement,
  calculatePaneScaffoldDirective,
  calculatePaneScaffoldValue,
} from './pane-layout';
import {
  MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES,
  MAT_LIST_DETAIL_PANE_ORDER,
  MAT_PANE_ROLES,
  MAT_SUPPORTING_PANE_ADAPT_STRATEGIES,
  MAT_SUPPORTING_PANE_ORDER,
  MatPaneAdaptStrategies,
  MAT_PANE_ASSUMED_LEVITATED_HEIGHT,
  MAT_PANE_DEFAULT_LEVITATED_WIDTH,
  MatPaneDestination,
  MatPaneLayoutConfig,
  MatPaneLevitationPosition,
  MatPaneRole,
  MatPaneScaffoldDirective,
  assertPaneDimension,
  assertPaneRole,
  validatePaneHistory,
} from './pane-types';

export interface MatPaneDismissRequest {
  readonly pane: MatPaneRole;
  readonly reason: 'escape' | 'scrim';
}
interface MatPaneActivation {
  /** Exact click position, when the destination change came from a pointer. */
  readonly point: { readonly x: number; readonly y: number } | null;
  /** Bounding box of the control behind the change, in scaffold coordinates. */
  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } | null;
}
/** Nearest interactive ancestor, so clicking a button's icon still anchors to the button itself. */
const activationSelector =
  'button, a, [role="button"], [role="link"], [role="menuitem"], input, select, textarea';
function activationOrigin(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  return target.closest(activationSelector) ?? target;
}
function relativeRect(element: Element, hostRect: DOMRect): NonNullable<MatPaneActivation['rect']> {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - hostRect.left,
    y: rect.top - hostRect.top,
    width: rect.width,
    height: rect.height,
  };
}
function centreOf(
  rect: MatPaneActivation['rect'] | undefined,
): { readonly x: number; readonly y: number } | null {
  return rect ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } : null;
}
let nextScaffoldId = 0;

/** Shared renderer/controller; specialized scaffolds change only semantic defaults. */
@Directive()
export abstract class MatPaneScaffoldBase {
  readonly directive = input<MatPaneScaffoldDirective | null>(null);
  readonly strategies = input<MatPaneAdaptStrategies | null>(null);
  readonly order = input<readonly MatPaneRole[] | null>(null);
  readonly navigator = input<MatPaneNavigator | null>(null);
  readonly destination = input<MatPaneDestination | null>(null);
  readonly expansionState = input<MatPaneExpansionState | null>(null);
  readonly autofocus = input(true);
  /** Explicit constrained CSS-pixel block size. Null allows natural content height and disables height-based reflow. */
  readonly height = input<number | null>(null);
  readonly isDestinationHistoryAware = input(true);
  readonly dismissRequest = output<MatPaneDismissRequest>();
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bidi = inject(Directionality, { optional: true });
  private readonly declarations = contentChildren(MatPaneDirective);
  protected readonly renderers = viewChildren(MatPaneRendererComponent);
  private readonly measuredWidth = signal(0);
  private readonly measuredHeight = signal(0);
  /** Control that most recently asked for a destination change, in scaffold coordinates. */
  private readonly activation = signal<MatPaneActivation | null>(null);
  private pendingActivation: MatPaneActivation | null = null;
  protected readonly direction = signal<'ltr' | 'rtl'>(this.bidi?.value ?? 'ltr');
  protected readonly id = 'mat-pane-scaffold-' + nextScaffoldId++;
  protected readonly kind: 'three' | 'list-detail' | 'supporting' = 'three';
  private readonly lastFocus = new Map<MatPaneRole, HTMLElement>();
  private focusedRole: MatPaneRole | null = null;
  private previousDestination: MatPaneDestination | null | undefined;
  private attachedNavigator: MatPaneNavigator | null = null;

  readonly panes = computed(() => {
    const panes = this.declarations();
    const roles = panes.map((pane) => pane.role());
    if (new Set(roles).size !== roles.length)
      throw new Error('Each matPane role may be declared only once in a scaffold.');
    if (!roles.includes('primary')) throw new Error('A pane scaffold requires a primary template.');
    if (this.kind !== 'three' && !roles.includes('secondary'))
      throw new Error(
        'List/detail and supporting scaffolds require primary and secondary templates.',
      );
    const order = this.resolvedOrder();
    return [...panes].sort((a, b) => order.indexOf(a.role()) - order.indexOf(b.role()));
  });
  readonly resolvedOrder = computed(() => {
    const order =
      this.order() ??
      (this.kind === 'list-detail' ? MAT_LIST_DETAIL_PANE_ORDER : MAT_SUPPORTING_PANE_ORDER);
    order.forEach(assertPaneRole);
    if (order.length !== 3 || new Set(order).size !== 3)
      throw new Error(
        'Pane order must contain each of primary, secondary and tertiary exactly once.',
      );
    return order;
  });
  readonly resolvedDirective = computed(() => {
    const height = this.height();
    if (height !== null) assertPaneDimension(height, 'height');
    return this.directive() ?? calculatePaneScaffoldDirective(this.measuredWidth(), height ?? 0);
  });
  private readonly config = computed<MatPaneLayoutConfig>(() => ({
    directive: this.resolvedDirective(),
    availableRoles: this.panes().map((pane) => pane.role()),
    adaptStrategies:
      this.strategies() ??
      (this.kind === 'supporting'
        ? MAT_SUPPORTING_PANE_ADAPT_STRATEGIES
        : MAT_LIST_DETAIL_PANE_ADAPT_STRATEGIES),
    isDestinationHistoryAware: this.isDestinationHistoryAware(),
  }));
  readonly currentDestination = computed(() => {
    if (this.navigator() && this.destination())
      throw new Error('navigator and destination are mutually exclusive.');
    const destination = this.navigator()?.currentDestination() ?? this.destination();
    if (destination) return validatePaneHistory([destination])[0];
    return {
      pane: this.kind === 'list-detail' ? 'secondary' : 'primary',
      contentKey: null,
    } as MatPaneDestination;
  });
  readonly scaffoldValue = computed(() => {
    const destination = this.currentDestination();
    const history = this.navigator()?.history();
    const effectiveHistory = history && history.length > 0 ? history : [destination];
    return calculatePaneScaffoldValue(this.config(), effectiveHistory);
  });
  readonly expandedRoles = computed(() =>
    this.resolvedOrder().filter((role) => this.scaffoldValue()[role].type === 'Expanded'),
  );
  /**
   * Docked edge for panes that asked for `auto`, derived from the control that opened them. Resolved
   * here because only the scaffold knows both the activation point and its own measured size.
   */
  private readonly autoLevitationPosition = computed(() => {
    const activation = this.activation();
    const point = activation?.point ?? centreOf(activation?.rect);
    return resolveAutoLevitationPosition(point, this.measuredWidth(), this.measuredHeight());
  });
  /** Geometry for panes that asked for `popover`, anchored to the control that opened them. */
  protected readonly popoverPlacements = computed<
    Partial<Record<MatPaneRole, MatPanePopoverPlacement>>
  >(() => {
    const placements: Partial<Record<MatPaneRole, MatPanePopoverPlacement>> = {};
    const trigger = this.activation()?.rect;
    const width = this.measuredWidth();
    const height = this.measuredHeight();
    if (!trigger || !(width > 0) || !(height > 0)) return placements;
    for (const pane of this.panes()) {
      // A modal pane is laid out against the viewport, so an anchored placement cannot apply.
      if (pane.levitationPosition() !== 'popover' || pane.modal()) continue;
      placements[pane.role()] = calculatePanePopoverPlacement({
        trigger,
        scaffoldWidth: width,
        scaffoldHeight: height,
        paneWidth: pane.preferredWidth() ?? MAT_PANE_DEFAULT_LEVITATED_WIDTH,
        paneHeight: pane.preferredHeight() ?? MAT_PANE_ASSUMED_LEVITATED_HEIGHT,
        direction: this.direction(),
      });
    }
    return placements;
  });
  /** Position overrides for every pane that asked for `auto`; others keep their configured value. */
  protected readonly resolvedPositions = computed<
    Partial<Record<MatPaneRole, MatPaneLevitationPosition>>
  >(() => {
    const auto = this.autoLevitationPosition();
    const resolved: Partial<Record<MatPaneRole, MatPaneLevitationPosition>> = {};
    for (const pane of this.panes())
      if (pane.levitationPosition() === 'auto') resolved[pane.role()] = auto;
    return resolved;
  });
  readonly paneRects = computed(() => {
    if (this.measuredWidth() <= 0) return {};
    const preferredWidths: Partial<Record<MatPaneRole, number>> = {};
    const preferredHeights: Partial<Record<MatPaneRole, number>> = {};
    for (const pane of this.panes()) {
      const width = pane.preferredWidth(),
        height = pane.preferredHeight();
      if (width !== null) preferredWidths[pane.role()] = width;
      if (height !== null) preferredHeights[pane.role()] = height;
    }
    return calculatePaneRects({
      width: this.measuredWidth(),
      height: this.height() ?? 0,
      directive: this.resolvedDirective(),
      scaffoldValue: this.scaffoldValue(),
      horizontalOrder: this.resolvedOrder(),
      preferredWidths,
      preferredHeights,
      firstPaneWidth:
        this.expandedRoles().length === 2
          ? this.expansionState()?.resolveFirstPaneWidth(this.availableWidth())
          : null,
      direction: this.direction(),
    });
  });
  protected readonly availableWidth = computed(() =>
    Math.max(0, this.measuredWidth() - this.resolvedDirective().horizontalPartitionSpacerSize),
  );
  /** Exactly two expanded panes own the separator; the tuple removes any need for a cast. */
  protected readonly split = computed<readonly [MatPaneRole, MatPaneRole] | null>(() => {
    if (!this.expansionState()) return null;
    const expanded = this.expandedRoles();
    if (expanded.length !== 2) return null;
    const pair: readonly [MatPaneRole, MatPaneRole] = [expanded[0], expanded[1]];
    return pair;
  });
  /**
   * Levitated pane that currently blocks the panes behind it. A dialog presented through a native
   * modal needs no scrim: the browser already makes everything outside it inert and draws a backdrop.
   */
  protected readonly scrimRole = computed<MatPaneRole | null>(() => {
    for (const pane of this.panes()) {
      const role = pane.role();
      if (this.scaffoldValue()[role].type === 'Levitated' && pane.scrim() && !pane.modal())
        return role;
    }
    return null;
  });
  protected readonly splitLeft = computed(() => {
    const pair = this.split();
    if (!pair) return 0;
    const first = this.paneRects()[pair[0]];
    if (!first) return 0;
    const gap = this.resolvedDirective().horizontalPartitionSpacerSize;
    return this.direction() === 'rtl' ? first.x - gap / 2 : first.x + first.width + gap / 2;
  });
  protected readonly splitValue = computed(() => {
    const pair = this.split();
    return pair && this.availableWidth() > 0
      ? Math.round(((this.paneRects()[pair[0]]?.width ?? 0) / this.availableWidth()) * 100)
      : 50;
  });
  protected readonly splitControls = computed(
    () =>
      this.split()
        ?.map((role) => this.paneId(role))
        .join(' ') ?? '',
  );
  protected readonly splitLabel = computed(
    () =>
      this.split()
        ?.map(
          (role) =>
            this.panes()
              .find((pane) => pane.role() === role)
              ?.label() ?? role,
        )
        .join(' / ') + ' pane sizes',
  );

  constructor() {
    effect(() => {
      const navigator = this.navigator();
      const config = this.config();
      this.currentDestination();
      untracked(() => {
        if (this.attachedNavigator !== navigator) this.attachedNavigator?.release(this);
        this.attachedNavigator = navigator;
        navigator?.configure(config, this);
      });
    });
    effect(() => {
      const state = this.expansionState(),
        pair = this.split(),
        width = this.availableWidth();
      untracked(() => state?.configure(pair, width, 0, width));
    });
    afterNextRender(() => {
      const host = this.host.nativeElement;
      const update = () => {
        this.measuredWidth.set(host.clientWidth);
        this.measuredHeight.set(host.clientHeight);
      };
      update();
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        this.measuredWidth.set(entry.contentRect.width);
        this.measuredHeight.set(entry.contentRect.height);
      });
      observer.observe(host);
      const subscription = this.bidi?.change.subscribe((direction) =>
        this.direction.set(direction),
      );
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        subscription?.unsubscribe();
      });
    });
    afterRenderEffect(() => {
      const renderers = this.renderers();
      const destination = this.currentDestination();
      this.scaffoldValue();
      this.paneRects();
      const active = this.host.nativeElement.ownerDocument.activeElement;
      const changed =
        this.previousDestination !== undefined &&
        (destination.pane !== this.previousDestination?.pane ||
          destination.contentKey !== this.previousDestination?.contentKey);
      this.previousDestination = destination;
      if (changed) this.captureActivation(active);
      const activePane = renderers.find((renderer) => renderer.contains(active));
      const invalid =
        !!activePane?.hidden() ||
        (!!this.focusedRole &&
          (!active || active === this.host.nativeElement.ownerDocument.body) &&
          !renderers.some(
            (renderer) => renderer.pane().role() === this.focusedRole && !renderer.hidden(),
          ));
      for (const role of this.lastFocus.keys())
        if (!renderers.some((renderer) => renderer.pane().role() === role))
          this.lastFocus.delete(role);
      if (this.autofocus() && (changed || invalid)) {
        const target =
          renderers.find(
            (renderer) => renderer.pane().role() === destination.pane && !renderer.hidden(),
          ) ?? renderers.find((renderer) => !renderer.hidden());
        if (target) this.focusPane(target);
      }
    });
    this.destroyRef.onDestroy(() => {
      this.attachedNavigator?.release(this);
      this.lastFocus.clear();
    });
  }

  /** Records where a destination change came from so `auto` and `popover` panes can follow it. */
  protected onHostClick(event: MouseEvent): void {
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const origin = activationOrigin(event.target);
    this.pendingActivation = {
      point: { x: event.clientX - hostRect.left, y: event.clientY - hostRect.top },
      rect: origin ? relativeRect(origin, hostRect) : null,
    };
  }
  /**
   * A click is exact and also works in browsers that do not focus a clicked button, so it wins over
   * the focused control. Keyboard activation has no click, and falls back to whatever held focus.
   */
  private captureActivation(active: Element | null): void {
    const pending = this.pendingActivation;
    this.pendingActivation = null;
    if (pending) {
      this.activation.set(pending);
      return;
    }
    const host = this.host.nativeElement;
    const focusOrigin =
      active && active !== host.ownerDocument.body && host.contains(active) ? active : null;
    this.activation.set(
      focusOrigin
        ? { point: null, rect: relativeRect(focusOrigin, host.getBoundingClientRect()) }
        : null,
    );
  }
  protected paneId(role: MatPaneRole): string {
    return this.id + '-' + role;
  }
  protected isCollapsed(role: MatPaneRole): boolean {
    return (
      this.scaffoldValue()[role].type === 'Expanded' && (this.paneRects()[role]?.width ?? 1) <= 0
    );
  }
  protected rememberFocus(role: MatPaneRole, element: HTMLElement): void {
    this.focusedRole = role;
    this.lastFocus.set(role, element);
  }
  protected async dismiss(pane: MatPaneRole, reason: 'escape' | 'scrim'): Promise<void> {
    this.dismissRequest.emit({ pane, reason });
    const navigator = this.navigator();
    if (!navigator) return;
    const history = navigator.history();
    for (let index = history.length - 2; index >= 0; index--) {
      const previous = history.slice(0, index + 1);
      const value = calculatePaneScaffoldValue(this.config(), previous);
      if (!MAT_PANE_ROLES.some((role) => value[role].type === 'Levitated')) {
        await navigator.reset(previous);
        return;
      }
    }
  }
  private focusPane(renderer: MatPaneRendererComponent): void {
    const remembered = this.lastFocus.get(renderer.pane().role());
    if (
      remembered?.isConnected &&
      renderer.contains(remembered) &&
      !remembered.closest('[hidden], [inert]') &&
      remembered.getClientRects().length
    )
      remembered.focus({ preventScroll: true });
    else renderer.focus();
  }
}

@Component({
  selector: 'mat-three-pane-scaffold',
  imports: [MatPaneRendererComponent, MatPaneResizeHandleComponent],
  templateUrl: './pane-scaffold.component.html',
  styleUrl: './pane-scaffold.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-pane-scaffold',
    '[style.height.px]': 'height()',
    '[attr.dir]': 'direction()',
    '[style.gap.px]': 'resolvedDirective().horizontalPartitionSpacerSize',
    '[class.constrained]': 'height() !== null',
    '(click)': 'onHostClick($event)',
  },
})
export class MatThreePaneScaffoldComponent extends MatPaneScaffoldBase {}

@Component({
  selector: 'mat-list-detail-pane-scaffold',
  imports: [MatPaneRendererComponent, MatPaneResizeHandleComponent],
  templateUrl: './pane-scaffold.component.html',
  styleUrl: './pane-scaffold.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-pane-scaffold',
    '[style.height.px]': 'height()',
    '[attr.dir]': 'direction()',
    '[style.gap.px]': 'resolvedDirective().horizontalPartitionSpacerSize',
    '[class.constrained]': 'height() !== null',
    '(click)': 'onHostClick($event)',
  },
})
export class MatListDetailPaneScaffoldComponent extends MatPaneScaffoldBase {
  protected override readonly kind = 'list-detail' as const;
}

@Component({
  selector: 'mat-supporting-pane-scaffold',
  imports: [MatPaneRendererComponent, MatPaneResizeHandleComponent],
  templateUrl: './pane-scaffold.component.html',
  styleUrl: './pane-scaffold.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-pane-scaffold',
    '[style.height.px]': 'height()',
    '[attr.dir]': 'direction()',
    '[style.gap.px]': 'resolvedDirective().horizontalPartitionSpacerSize',
    '[class.constrained]': 'height() !== null',
    '(click)': 'onHostClick($event)',
  },
})
export class MatSupportingPaneScaffoldComponent extends MatPaneScaffoldBase {
  protected override readonly kind = 'supporting' as const;
}
