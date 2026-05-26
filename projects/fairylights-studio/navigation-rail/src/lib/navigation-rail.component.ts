import {
  AfterContentInit,
  Component,
  ContentChildren,
  inject,
  Input,
  input,
  OnDestroy,
  QueryList,
} from '@angular/core';
import { FocusKeyManager } from '@angular/cdk/a11y';
import { ENTER, SPACE, hasModifierKey } from '@angular/cdk/keycodes';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatNavigationRailItemComponent } from './navigation-rail-item.component';

export type MatNavRailIndicatorShape = 'hug' | 'fill';

@Component({
  selector: 'mat-navigation-rail',
  standalone: true,
  imports: [],
  template: `
    <div class="mat-nav-rail-container">
      <ng-content select="mat-navigation-rail-header"></ng-content>
      <div class="mat-nav-rail-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './navigation-rail.component.scss',
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[class.mat-nav-rail-expanded]': 'expanded',
    '[class.mat-nav-rail-has-divider]': 'showDivider',
    '[attr.data-indicator-shape]': 'indicatorShape',
    '[attr.data-vertical-arrangement]': 'verticalArrangement',
    '(keydown)': '_handleKeydown($event)',
  },
})
export class MatNavigationRailComponent implements AfterContentInit, OnDestroy {
  @Input() expanded = false;
  @Input() indicatorShape: MatNavRailIndicatorShape = 'hug';
  @Input() showDivider = false;
  @Input() verticalArrangement: 'top' | 'center' = 'top';
  ariaLabel = input<string>('');

  @ContentChildren(MatNavigationRailItemComponent, { descendants: true })
  _items!: QueryList<MatNavigationRailItemComponent>;

  private _keyManager!: FocusKeyManager<any>;
  private _destroyed = new Subject<void>();

  ngAfterContentInit() {
    this._keyManager = new FocusKeyManager(this._items as any)
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withWrap();

    this._keyManager.change.pipe(takeUntil(this._destroyed)).subscribe((index) => {
      this._items.forEach((item, i) => {
        item._tabIndex = i === index ? 0 : -1;
      });
    });

    this._items.changes.pipe(takeUntil(this._destroyed)).subscribe(() => {
      const activeIndex = this._keyManager.activeItemIndex ?? 0;
      this._keyManager.updateActiveItem(activeIndex);
    });
  }

  _handleKeydown(event: KeyboardEvent) {
    if (hasModifierKey(event)) return;

    switch (event.keyCode) {
      case ENTER:
      case SPACE:
        event.preventDefault();
        const index = this._keyManager.activeItemIndex;
        if (index != null) {
          const item = this._items.get(index);
          if (item && !item.disabled()) {
            item._getHostElement().click();
          }
        }
        break;
      default:
        this._keyManager.onKeydown(event);
    }
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
