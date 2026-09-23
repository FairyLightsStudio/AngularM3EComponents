import type { MatPaneDestination, MatPaneRole } from '@fairylights-studio/ngx-m3-adaptive';

export function isRole(value: unknown): value is MatPaneRole {
  return value === 'primary' || value === 'secondary' || value === 'tertiary';
}

export function copyHistory(history: readonly MatPaneDestination[]): readonly MatPaneDestination[] {
  if (!Array.isArray(history)) throw new TypeError('Pane history must be an array.');
  return Object.freeze(
    history.map((destination) => {
      if (!destination || !isRole(destination.pane)) throw new TypeError('Invalid pane role.');
      const key = destination.contentKey;
      if (
        key !== null &&
        typeof key !== 'string' &&
        (typeof key !== 'number' || !Number.isFinite(key))
      ) {
        throw new TypeError('Pane content keys must be strings, finite numbers, or null.');
      }
      return Object.freeze({ pane: destination.pane, contentKey: key });
    }),
  );
}
