import { Signal, signal } from '@angular/core';
import { MatNavigationSuiteVisibility } from './navigation-suite.types';

const transitionDurationMs = 300;

export class MatNavigationSuiteScaffoldState {
  private readonly _currentValue = signal<MatNavigationSuiteVisibility>('visible');
  private readonly _targetValue = signal<MatNavigationSuiteVisibility>('visible');
  private readonly _isAnimating = signal(false);
  private animationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentValue: Signal<MatNavigationSuiteVisibility> = this._currentValue.asReadonly();
  readonly targetValue: Signal<MatNavigationSuiteVisibility> = this._targetValue.asReadonly();
  readonly isAnimating: Signal<boolean> = this._isAnimating.asReadonly();

  show(): void {
    this.transitionTo('visible');
  }

  hide(): void {
    this.transitionTo('hidden');
  }

  toggle(): void {
    this.transitionTo(this._targetValue() === 'visible' ? 'hidden' : 'visible');
  }

  snapTo(value: MatNavigationSuiteVisibility): void {
    this.clearAnimationTimer();
    this._currentValue.set(value);
    this._targetValue.set(value);
    this._isAnimating.set(false);
  }

  private transitionTo(value: MatNavigationSuiteVisibility): void {
    if (this._targetValue() === value) {
      return;
    }

    this.clearAnimationTimer();
    this._targetValue.set(value);
    this._isAnimating.set(true);
    this.animationTimer = setTimeout(() => {
      this._currentValue.set(this._targetValue());
      this._isAnimating.set(false);
      this.animationTimer = null;
    }, transitionDurationMs);
  }

  private clearAnimationTimer(): void {
    if (this.animationTimer === null) {
      return;
    }

    clearTimeout(this.animationTimer);
    this.animationTimer = null;
  }
}
