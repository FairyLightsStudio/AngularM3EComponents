import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  inject,
  input,
  OnDestroy,
  QueryList,
} from '@angular/core';
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { ENTER, SPACE, hasModifierKey } from '@angular/cdk/keycodes';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatNavigationBarItemComponent } from './navigation-bar-item.component';

/** Bottom navigation container for compact and medium screen layouts. */
@Component({
  selector: 'mat-navigation-bar',
  template: `
    <div class="mat-nav-bar-content">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './navigation-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown)': '_handleKeydown($event)',
  },
})
export class MatNavigationBarComponent implements AfterContentInit, OnDestroy {
  /** Accessible label for the navigation landmark. */
  ariaLabel = input<string>('');

  @ContentChildren(MatNavigationBarItemComponent, { descendants: true })
  _items!: QueryList<MatNavigationBarItemComponent>;

  private _keyManager!: FocusKeyManager<MatNavigationBarItemComponent>;
  private _dir = inject(Directionality, { optional: true });
  private _destroyed = new Subject<void>();

  ngAfterContentInit() {
    this._keyManager = new FocusKeyManager<MatNavigationBarItemComponent>(
      this._items as unknown as QueryList<MatNavigationBarItemComponent & FocusableOption>,
    )
      .withHorizontalOrientation(this._dir?.value || 'ltr')
      .withHomeAndEnd()
      .withWrap()
      .withTypeAhead();

    this._setInitialActiveItem();

    if (this._dir) {
      this._dir.change.pipe(takeUntil(this._destroyed)).subscribe((dir) => {
        this._keyManager.withHorizontalOrientation(dir);
      });
    }
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
    this._destroyed.next();
    this._destroyed.complete();
  }

  private _getEventItem(event: KeyboardEvent): MatNavigationBarItemComponent | undefined {
    const target = event.target;
    if (!(target instanceof Node)) return undefined;

    return this._items.find((item) => item._getHostElement().contains(target));
  }

  private _setInitialActiveItem(): void {
    const items = this._items.toArray();
    const activeIndex = items.findIndex((item) => item.active());
    const firstIndex = items.length > 0 ? 0 : -1;
    const initialIndex = activeIndex >= 0 ? activeIndex : firstIndex;

    if (initialIndex >= 0) {
      this._keyManager.updateActiveItem(initialIndex);
    }
  }

  private _updateActiveItem(item: MatNavigationBarItemComponent): void {
    const index = this._items.toArray().indexOf(item);
    if (index >= 0 && index !== this._keyManager.activeItemIndex) {
      this._keyManager.updateActiveItem(index);
    }
  }
}
