import { computed, inject, Injectable, Signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  MAT_NAVIGATION_SUITE_SCAFFOLD_DEFAULTS,
  MatNavigationSuiteType,
} from './navigation-suite.types';

const compactQuery = '(max-width: 599.98px)';
const mediumQuery = '(min-width: 600px) and (max-width: 839.98px)';

@Injectable({ providedIn: 'root' })
export class MatNavigationSuiteScaffoldDefaults {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly options = inject(MAT_NAVIGATION_SUITE_SCAFFOLD_DEFAULTS);

  private readonly adaptiveNavSuiteType = toSignal(
    this.breakpointObserver.observe([compactQuery, mediumQuery]).pipe(
      map((result) => {
        if (result.breakpoints[compactQuery]) {
          return 'BarCompact' satisfies MatNavigationSuiteType;
        }

        if (result.breakpoints[mediumQuery]) {
          return 'BarMedium' satisfies MatNavigationSuiteType;
        }

        return 'RailCollapsed' satisfies MatNavigationSuiteType;
      }),
    ),
    { initialValue: 'RailCollapsed' satisfies MatNavigationSuiteType },
  );

  private readonly configuredNavSuiteType = computed(() => {
    const configured = this.options.navSuiteType;
    return typeof configured === 'function' ? configured() : configured;
  });

  private readonly currentNavSuiteType = computed(
    () => this.configuredNavSuiteType() ?? this.adaptiveNavSuiteType(),
  );

  navSuiteType(): Signal<MatNavigationSuiteType> {
    return this.currentNavSuiteType;
  }
}
