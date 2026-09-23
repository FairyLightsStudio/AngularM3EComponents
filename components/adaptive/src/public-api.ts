export * from './lib/pane-types';
export * from './lib/pane-layout';
export * from './lib/pane-navigator';
export * from './lib/pane-expansion-state';
export * from './lib/pane-drag-to-resize-state';
export * from './lib/pane.directive';
export * from './lib/pane-resize-handle.component';
export * from './lib/pane-scaffold.component';

import { MatPaneDirective } from './lib/pane.directive';
import { MatPaneResizeHandleComponent } from './lib/pane-resize-handle.component';
import {
  MatThreePaneScaffoldComponent,
  MatListDetailPaneScaffoldComponent,
  MatSupportingPaneScaffoldComponent,
} from './lib/pane-scaffold.component';

export const MAT_PANE_SCAFFOLD_MODULES = [
  MatThreePaneScaffoldComponent,
  MatListDetailPaneScaffoldComponent,
  MatSupportingPaneScaffoldComponent,
  MatPaneDirective,
  MatPaneResizeHandleComponent,
] as const;
