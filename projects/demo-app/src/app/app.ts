import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MAT_NAVIGATION_RAIL_MODULES } from '@fairylights-studio/navigation-rail';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule, MatButtonModule, CommonModule, MatProgressSpinnerModule, ...MAT_NAVIGATION_RAIL_MODULES],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {
  protected readonly title = signal('demo-app');
  isExpanded = signal(false);
  activeId = signal('inbox');

  menuItems = [
    { id: 'inbox', label: 'Inbox', icon: 'inbox', iconActive: 'inbox' },
    { id: 'outbox', label: 'Outbox', icon: 'send', iconActive: 'send' },
    { id: 'favorites', label: 'Favorites', icon: 'favorite_border', iconActive: 'favorite' },
    { id: 'trash', label: 'Trash', icon: 'delete_outline', iconActive: 'delete' },
  ];
}
