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
import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { ENTER, SPACE, hasModifierKey } from '@angular/cdk/keycodes';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatNavigationBarItemComponent } from './navigation-bar-item.component';

@Component({
  selector: 'mat-navigation-bar',
  standalone: true,
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
  ariaLabel = input<string>('');

  @ContentChildren(MatNavigationBarItemComponent, { descendants: true })
  _items!: QueryList<MatNavigationBarItemComponent>;

  private _keyManager!: FocusKeyManager<any>;
  private _dir = inject(Directionality, { optional: true });
  private _destroyed = new Subject<void>();

  ngAfterContentInit() {
    this._keyManager = new FocusKeyManager(this._items as any)
      .withHorizontalOrientation(this._dir?.value || 'ltr')
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

    if (this._dir) {
      this._dir.change.pipe(takeUntil(this._destroyed)).subscribe((dir) => {
        this._keyManager.withHorizontalOrientation(dir);
      });
    }
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
          if (item) {
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
