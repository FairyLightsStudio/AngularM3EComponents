import '@angular/compiler';
import { describe, expect, test } from 'bun:test';
import { Injector, runInInjectionContext } from '@angular/core';
import {
  convertToParamMap,
  DefaultUrlSerializer,
  Router,
  type RouterStateSnapshot,
} from '@angular/router';
import { createMatPaneQueryParamCodec } from '../router/src/lib/query-param-codec';
import type { MatPaneDestination } from '../src/lib/pane-types';

const serializer = new DefaultUrlSerializer();
function setup(url = '/items;mode=full(aux:help)?tag=a&tag=b&sort=name#detail') {
  const router = { url, parseUrl: (value: string) => serializer.parse(value) };
  const injector = Injector.create({ providers: [{ provide: Router, useValue: router }] });
  const codec = runInInjectionContext(injector, () => createMatPaneQueryParamCodec());
  return {
    codec,
    snapshot: (value: string) =>
      ({
        url: value,
        root: { queryParamMap: convertToParamMap(serializer.parse(value).queryParams) },
      }) as RouterStateSnapshot,
  };
}

describe('Router query-param codec', () => {
  test('round trips key types, negative zero, unicode and empty history', () => {
    const { codec, snapshot } = setup();
    const trail: MatPaneDestination[] = [null, 1, '1', '', -0, '汉字&?#'].map((contentKey) => ({
      pane: 'primary',
      contentKey,
    }));
    const decoded = codec.decode(snapshot(serializer.serialize(codec.encode(trail))));
    expect(decoded).toEqual(trail);
    expect(Object.is(decoded[4].contentKey, -0)).toBe(true);
    expect(codec.decode(snapshot(serializer.serialize(codec.encode([]))))).toEqual([]);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(Object.isFrozen(decoded[0])).toBe(true);
  });
  test('preserves all unrelated URL components', () => {
    const { codec } = setup();
    const tree = codec.encode([{ pane: 'secondary', contentKey: 7 }]);
    expect(tree.queryParams['tag']).toEqual(['a', 'b']);
    expect(tree.queryParams['sort']).toBe('name');
    expect(tree.fragment).toBe('detail');
    delete tree.queryParams['paneTrail'];
    expect(serializer.serialize(tree)).toBe(
      '/items;mode=full(aux:help)?tag=a&tag=b&sort=name#detail',
    );
  });
  test('malformed, duplicate, unknown versions and oversized trails fall back atomically', () => {
    const { codec, snapshot } = setup();
    const root = [{ pane: 'primary', contentKey: null }];
    const invalid = [
      'oops',
      '[2,[]]',
      '[1,{}]',
      '[1,[["bogus","null",null]]]',
      '[1,[["primary","number","NaN"]]]',
      '[1,[["primary","number","01"]]]',
      '[1,[["primary","null",0]]]',
      JSON.stringify([1, Array.from({ length: 129 }, () => ['primary', 'null', null])]),
      ' '.repeat(16385),
    ];
    for (const value of invalid)
      expect(codec.decode(snapshot('/?paneTrail=' + encodeURIComponent(value)))).toEqual(root);
    expect(codec.decode(snapshot('/'))).toEqual(root);
    expect(codec.decode(snapshot('/?paneTrail=bad&paneTrail=bad'))).toEqual(root);
  });
  test('rejects invalid outgoing keys and bounded input without URL mutation', () => {
    const { codec } = setup();
    expect(() => codec.encode([{ pane: 'primary', contentKey: Infinity }])).toThrow();
    expect(() => codec.encode([{ pane: 'primary', contentKey: 'x'.repeat(1025) }])).toThrow();
    expect(() =>
      codec.encode(
        Array.from({ length: 129 }, () => ({ pane: 'primary' as const, contentKey: null })),
      ),
    ).toThrow();
  });
});
