import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { MatPaneContentKey, MatPaneDestination } from '@fairylights-studio/ngx-m3-adaptive';
import { copyHistory, isRole } from './destinations';
import type { MatPaneRouterCodec } from './router-navigator';

export interface MatPaneQueryParamCodecOptions {
  /** Defaults to 'paneTrail'. This query parameter belongs exclusively to the codec. */
  readonly queryParam?: string;
  /** Missing, duplicate, invalid or oversized input decodes to this root destination. */
  readonly fallbackRoot?: MatPaneDestination;
}

const MAX_TRAIL_LENGTH = 128;
const MAX_ENCODED_LENGTH = 16384;
const MAX_KEY_LENGTH = 1024;

/**
 * Injection-context example/default codec with a versioned, typed JSON trail.
 * Preserves path, matrix parameters, auxiliary outlets, unrelated query parameters
 * (including repeated parameters), and fragment using Router.parseUrl(router.url).
 * Bounds: 128 destinations, 1024 UTF-16 units per string key, 16384 JSON units.
 * encode rejects oversized values rather than silently discarding history.
 */
export function createMatPaneQueryParamCodec(
  options: MatPaneQueryParamCodecOptions = {},
): MatPaneRouterCodec {
  const router = inject(Router);
  const parameter = options.queryParam ?? 'paneTrail';
  if (
    !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(parameter) ||
    parameter === '__proto__' ||
    parameter === 'constructor' ||
    parameter === 'prototype'
  ) {
    throw new TypeError('Invalid pane trail query parameter name.');
  }
  const fallback = copyHistory([options.fallbackRoot ?? { pane: 'primary', contentKey: null }]);
  if (
    typeof fallback[0].contentKey === 'string' &&
    fallback[0].contentKey.length > MAX_KEY_LENGTH
  ) {
    throw new RangeError('Fallback root content key is too long.');
  }
  return {
    decode(snapshot) {
      const values = snapshot.root.queryParamMap.getAll(parameter);
      if (values.length !== 1 || values[0].length > MAX_ENCODED_LENGTH) return fallback;
      try {
        const payload: unknown = JSON.parse(values[0]);
        if (
          !Array.isArray(payload) ||
          payload.length !== 2 ||
          payload[0] !== 1 ||
          !Array.isArray(payload[1]) ||
          payload[1].length > MAX_TRAIL_LENGTH
        )
          return fallback;
        const history: MatPaneDestination[] = [];
        for (const entry of payload[1]) {
          if (!Array.isArray(entry) || entry.length !== 3 || !isRole(entry[0])) return fallback;
          const [pane, type, value] = entry;
          let contentKey: MatPaneContentKey;
          if (type === 'null' && value === null) contentKey = null;
          else if (type === 'string' && typeof value === 'string' && value.length <= MAX_KEY_LENGTH)
            contentKey = value;
          else if (type === 'number' && typeof value === 'string' && value.length <= 32) {
            const number = Number(value);
            if (!Number.isFinite(number) || (value !== '-0' && String(number) !== value))
              return fallback;
            contentKey = number;
          } else return fallback;
          history.push({ pane, contentKey });
        }
        return copyHistory(history);
      } catch {
        return fallback;
      }
    },
    encode(history) {
      if (history.length > MAX_TRAIL_LENGTH) throw new RangeError('Pane trail is too long.');
      const destinations = copyHistory(history);
      const entries = destinations.map(({ pane, contentKey }) => {
        if (typeof contentKey === 'string' && contentKey.length > MAX_KEY_LENGTH)
          throw new RangeError('Pane content key is too long.');
        return [
          pane,
          contentKey === null ? 'null' : typeof contentKey,
          typeof contentKey === 'number'
            ? Object.is(contentKey, -0)
              ? '-0'
              : String(contentKey)
            : contentKey,
        ];
      });
      const encoded = JSON.stringify([1, entries]);
      if (encoded.length > MAX_ENCODED_LENGTH)
        throw new RangeError('Encoded pane trail is too long.');
      const tree = router.parseUrl(router.url);
      tree.queryParams = { ...tree.queryParams, [parameter]: encoded };
      return tree;
    },
  };
}
