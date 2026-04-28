import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MAT_NAVIGATION_RAIL_MODULES, MatNavRailIndicatorShape } from '@fairylights-studio/navigation-rail';
import { MAT_NAVIGATION_BAR_MODULES } from '@fairylights-studio/navigation-bar';
import { MAT_NAVIGATION_SUITE_MODULES } from '@fairylights-studio/navigation-suite';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  imports: [ MatIconModule, MatButtonModule, CommonModule, ...MAT_NAVIGATION_RAIL_MODULES, ...MAT_NAVIGATION_BAR_MODULES, ...MAT_NAVIGATION_SUITE_MODULES],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {
  isExpanded = signal(false);
  activeId = signal('inbox');

  // 可切换配置测试
  indicatorShape = signal<MatNavRailIndicatorShape>('hug');
  showDivider = signal(true);

  // 导航项列表
  navItems = [
    { id: 'inbox', label: 'Inbox', icon: 'inbox', activeIcon: 'move_to_inbox', badge: 3 },
    { id: 'outbox', label: 'Outbox', icon: 'send', activeIcon: 'send', badge: null },
    { id: 'favorites', label: 'Favorites', icon: 'favorite_border', activeIcon: 'favorite' },
    { id: 'trash', label: 'Trash', icon: 'delete_outline', activeIcon: 'delete' },
  ];
  toggleDivider() {
    this.showDivider.set(!this.showDivider());
  }
  toggleShape() {
    this.indicatorShape.set(this.indicatorShape() === 'hug' ? 'fill' : 'hug');
  }
}
