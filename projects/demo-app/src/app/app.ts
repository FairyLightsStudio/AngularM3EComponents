import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MAT_NAVIGATION_RAIL_MODULES, MatNavRailIndicatorShape } from '@fairylights-studio/navigation-rail';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  imports: [ MatIconModule, MatButtonModule, CommonModule, ...MAT_NAVIGATION_RAIL_MODULES, MatProgressSpinner],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {
  isExpanded = signal(false);
  activeId = signal('inbox');

  // 可切换配置测试
  indicatorShape = signal<MatNavRailIndicatorShape>('hug');
  showDivider = signal(true);

  // 顶部导航 (带 Badge)
  topItems = [
    { id: 'inbox', label: 'Inbox', icon: 'inbox', activeIcon: 'move_to_inbox', badge: 3 },
    { id: 'outbox', label: 'Outbox', icon: 'send', activeIcon: 'send', badge: null },
  ];

  // 中部导航
  middleItems = [
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
