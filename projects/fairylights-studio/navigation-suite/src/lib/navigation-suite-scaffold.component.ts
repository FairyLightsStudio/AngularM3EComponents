import {
  Component,
  ChangeDetectionStrategy,
  input,
  contentChildren,
  contentChild,
  TemplateRef,
  Directive,
  inject,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatNavigationBarComponent,
  MatNavigationBarItemComponent,
} from '@fairylights-studio/navigation-bar';
import {
  MatNavigationRailComponent,
  MatNavigationRailItemComponent,
  MatNavigationRailHeaderComponent,
} from '@fairylights-studio/navigation-rail';
import {
  MatNavigationItemBase,
  MatNavigationIcon,
  MatNavigationActiveIcon,
  MatNavigationLabel,
} from '@fairylights-studio/navigation-common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Directive({
  selector: 'mat-navigation-suite-item',
  standalone: true,
})
export class MatNavigationSuiteItem extends MatNavigationItemBase {
  selected = output<void>();
}

@Directive({
  selector: '[matNavigationSuitePrimaryAction]',
  standalone: true,
})
export class MatNavigationSuitePrimaryAction {
  templateRef = inject(TemplateRef<any>, { optional: true });
}

export type NavigationSuiteLayoutType =
  | 'navigation-bar'
  | 'navigation-rail'
  | 'navigation-bar-horizontal'
  | 'none';

@Component({
  selector: 'mat-navigation-suite-scaffold',
  standalone: true,
  imports: [
    CommonModule,
    MatNavigationBarComponent,
    MatNavigationBarItemComponent,
    MatNavigationRailComponent,
    MatNavigationRailItemComponent,
    MatNavigationRailHeaderComponent,
    MatNavigationIcon,
    MatNavigationActiveIcon,
    MatNavigationLabel,
  ],
  templateUrl: './navigation-suite-scaffold.component.html',
  styleUrl: './navigation-suite-scaffold.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-navigation-suite-scaffold',
    '[class.mat-nav-suite-hide-nav]': 'currentLayout() === "none"',
  },
})
export class MatNavigationSuiteScaffoldComponent {
  layout = input<'auto' | NavigationSuiteLayoutType>('auto');
  navigationItemVerticalArrangement = input<'top' | 'center' | 'bottom'>('top');
  primaryActionContentHorizontal = input<'start' | 'center' | 'end'>('end');
  expanded = input<boolean>(false);
  indicatorShape = input<'hug' | 'fill'>('hug');
  showDivider = input<boolean>(false);

  items = contentChildren(MatNavigationSuiteItem);
  primaryAction = contentChild(MatNavigationSuitePrimaryAction);

  private breakpointObserver = inject(BreakpointObserver);

  private isCompact = toSignal(
    this.breakpointObserver
      .observe(['(max-width: 599.98px)'])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  private isTabletop = toSignal(
    this.breakpointObserver
      .observe(['(horizontal-viewport-segments: 2)'])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  private isHeightCompact = toSignal(
    this.breakpointObserver
      .observe(['(max-height: 479.98px)'])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  currentLayout = computed(() => {
    const requested = this.layout();
    if (requested !== 'auto') {
      return requested;
    }

    // M3: width < 600dp → ShortNavigationBarCompact
    if (this.isCompact()) {
      return 'navigation-bar';
    }
    // M3: isTabletop or height < 480dp → ShortNavigationBarMedium
    if (this.isTabletop() || this.isHeightCompact()) {
      return 'navigation-bar-horizontal';
    }
    // M3: width >= 600dp and height >= 480dp → WideNavigationRailCollapsed
    return 'navigation-rail';
  });

  alwaysShowLabel = computed(() => {
    const count = this.items().length;
    const layout = this.currentLayout();
    if (layout === 'navigation-bar' || layout === 'navigation-bar-horizontal') {
      return count <= 3;
    }
    return true;
  });
}
