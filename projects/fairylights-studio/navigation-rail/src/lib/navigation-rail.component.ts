import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  input,
  OnDestroy,
  QueryList,
} from '@angular/core';
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { ENTER, SPACE, hasModifierKey } from '@angular/cdk/keycodes';
import { MatNavigationRailItemComponent } from './navigation-rail-item.component';

export type MatNavRailIndicatorShape = 'hug' | 'fill';

@Component({
  selector: 'mat-navigation-rail',
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

  private _keyManager!: FocusKeyManager<MatNavigationRailItemComponent>;

  ngAfterContentInit() {
    this._keyManager = new FocusKeyManager<MatNavigationRailItemComponent>(
      this._items as unknown as QueryList<MatNavigationRailItemComponent & FocusableOption>,
    )
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withWrap()
      .withTypeAhead();

    this._setInitialActiveItem();
  }

  _handleKeydown(event: KeyboardEvent) {
    if (hasModifierKey(event)) return;

    const item = this._getEventItem(event);
    if (!item) return;
    this._updateActiveItem(item);

    switch (event.keyCode) {
      case ENTER:
      case SPACE:
        event.preventDefault();
        item._getButtonElement().click();
        break;
      default:
        this._keyManager.onKeydown(event);
    }
  }

  ngOnDestroy() {
    this._keyManager?.destroy();
  }

  private _getEventItem(event: KeyboardEvent): MatNavigationRailItemComponent | undefined {
    const target = event.target;
    if (!(target instanceof Node)) return undefined;

    return this._items.find((item) => item._getHostElement().contains(target));
  }

  private _setInitialActiveItem(): void {
    const items = this._items.toArray();
    const activeIndex = items.findIndex((item) => item.active());
    const firstEnabledIndex = items.length > 0 ? 0 : -1;
    const initialIndex = activeIndex >= 0 ? activeIndex : firstEnabledIndex;

    if (initialIndex >= 0) {
      this._keyManager.updateActiveItem(initialIndex);
    }
  }

  private _updateActiveItem(item: MatNavigationRailItemComponent): void {
    const index = this._items.toArray().indexOf(item);
    if (index >= 0 && index !== this._keyManager.activeItemIndex) {
      this._keyManager.updateActiveItem(index);
    }
  }
}
