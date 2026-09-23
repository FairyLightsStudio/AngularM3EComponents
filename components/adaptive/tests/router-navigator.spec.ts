import '@angular/compiler';
import { describe, expect, test } from 'bun:test';
import { Injector, runInInjectionContext } from '@angular/core';
import {
  convertToParamMap,
  DefaultUrlSerializer,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  type NavigationBehaviorOptions,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { Subject } from 'rxjs';
import { createMatPaneRouterNavigator } from '../router/src/lib/router-navigator';
import { createMatPaneQueryParamCodec } from '../router/src/lib/query-param-codec';
import type { MatPaneDestination, MatPaneRole } from '../src/lib/pane-types';
import { calculatePaneScaffoldDirective } from '../src/lib/pane-layout';

function setup(
  initial: readonly MatPaneDestination[] = [{ pane: 'primary', contentKey: null }],
  replaceUrlOnBack = true,
) {
  const serializer = new DefaultUrlSerializer();
  const events = new Subject<unknown>();
  const calls: {
    tree: UrlTree;
    extras?: NavigationBehaviorOptions;
    resolve: (result: boolean) => void;
    reject: (error: Error) => void;
  }[] = [];
  const snapshot = (url: string) =>
    ({
      url,
      root: { queryParamMap: convertToParamMap(serializer.parse(url).queryParams) },
    }) as RouterStateSnapshot;
  const router = {
    url: '/',
    events,
    routerState: { snapshot: snapshot('/') },
    parseUrl: (url: string) => serializer.parse(url),
    navigateByUrl: (tree: UrlTree, extras?: NavigationBehaviorOptions) =>
      new Promise<boolean>((resolve, reject) => {
        calls.push({ tree, extras, resolve, reject });
      }),
  };
  // Injector.create supplies its own DestroyRef, so a useValue mock here would be silently ignored.
  // Tests that need teardown must destroy this injector.
  const injector = Injector.create({ providers: [{ provide: Router, useValue: router }] });
  const codec = runInInjectionContext(injector, () => createMatPaneQueryParamCodec());
  router.url = serializer.serialize(codec.encode(initial));
  router.routerState.snapshot = snapshot(router.url);
  const navigator = runInInjectionContext(injector, () =>
    createMatPaneRouterNavigator(codec, { replaceUrlOnBack }),
  );
  const commit = (trail: readonly MatPaneDestination[], id = 1) => {
    router.url = serializer.serialize(codec.encode(trail));
    router.routerState.snapshot = snapshot(router.url);
    events.next(new NavigationEnd(id, router.url, router.url));
  };
  return { navigator, router, events, calls, codec, snapshot, commit, injector };
}

describe('Router-backed pane navigator', () => {
  test('deep links initialize immediately; only successful NavigationEnd commits', async () => {
    const root = [{ pane: 'secondary' as const, contentKey: 10 }];
    const { navigator, calls, events, commit } = setup(root);
    expect(navigator.history()).toEqual(root);
    const promise = navigator.navigateTo('primary', 20);
    expect(navigator.history()).toEqual(root);
    events.next(new NavigationStart(1, '/pending'));
    expect(navigator.history()).toEqual(root);
    commit([...root, { pane: 'primary', contentKey: 20 }]);
    calls[0].resolve(true);
    expect(await promise).toBe(true);
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: 20 });
  });
  test('guard cancellation and navigation error preserve committed history', async () => {
    const { navigator, calls, events } = setup();
    const before = navigator.history();
    const canceled = navigator.navigateTo('secondary', 1);
    events.next(new NavigationCancel(1, '/blocked', 'guard'));
    calls[0].resolve(false);
    expect(await canceled).toBe(false);
    expect(navigator.history()).toBe(before);
    const failed = navigator.navigateTo('secondary', 2);
    // Capture the outcome explicitly: Bun's expect(promise).rejects matcher never settles when the
    // rejection happens after the matcher is created, which hangs the whole file.
    const outcome = Promise.resolve(failed).then(
      () => null,
      (error: unknown) => error,
    );
    events.next(new NavigationError(2, '/error', new Error('resolver failed')));
    calls[1].reject(new Error('resolver failed'));
    const error = await outcome;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('resolver failed');
    expect(navigator.history()).toBe(before);
  });
  test('rapid requests derive from committed state and final successful URL wins', async () => {
    const { navigator, calls, codec, snapshot, commit } = setup();
    const first = navigator.navigateTo('secondary', 1);
    const second = navigator.navigateTo('tertiary', 2);
    expect(
      codec.decode(snapshot(new DefaultUrlSerializer().serialize(calls[1].tree))),
    ).toHaveLength(2);
    calls[0].resolve(false);
    commit(
      [
        { pane: 'primary', contentKey: null },
        { pane: 'tertiary', contentKey: 2 },
      ],
      2,
    );
    calls[1].resolve(true);
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(navigator.currentDestination()?.contentKey).toBe(2);
  });
  test('configuration and ownership never prune or write URL history', () => {
    const { navigator, calls } = setup([
      { pane: 'primary', contentKey: null },
      { pane: 'tertiary', contentKey: 1 },
    ]);
    const before = navigator.history();
    const owner = {};
    const config = {
      directive: calculatePaneScaffoldDirective(400, 500),
      availableRoles: ['primary' as const],
    };
    navigator.configure(config, owner);
    expect(navigator.history()).toBe(before);
    expect(calls).toHaveLength(0);
    expect(navigator.scaffoldValue().tertiary.type).toBe('Hidden');
    expect(() => navigator.navigateTo('tertiary', 2)).toThrow('unavailable');
    expect(calls).toHaveLength(0);
    expect(() => navigator.configure(config, {})).toThrow();
    navigator.release({});
    expect(() => navigator.configure(config, {})).toThrow();
    navigator.release(owner);
    expect(() => navigator.configure(config, {})).not.toThrow();
  });
  test('pane Back uses parent URL with replacement and keeps root', async () => {
    const { navigator, calls, commit } = setup([
      { pane: 'primary', contentKey: null },
      { pane: 'secondary', contentKey: 1 },
    ]);
    expect(navigator.canNavigateBack()).toBe(true);
    const previous = navigator.peekPreviousScaffoldValue();
    const back = navigator.navigateBack();
    expect(calls[0].extras).toEqual({ replaceUrl: true });
    expect(navigator.history()).toHaveLength(2);
    commit([{ pane: 'primary', contentKey: null }]);
    calls[0].resolve(true);
    expect(await back).toBe(true);
    expect(navigator.scaffoldValue()).toEqual(previous);
    expect(navigator.navigateBack()).toBe(false);
  });
  test('rejects invalid roles synchronously and removes event subscription on destroy', () => {
    const { navigator, calls, commit, injector } = setup();
    expect(() => navigator.navigateTo('unknown' as MatPaneRole)).toThrow();
    expect(calls).toHaveLength(0);
    (injector as unknown as { destroy(): void }).destroy();
    commit([{ pane: 'secondary', contentKey: 5 }]);
    expect(navigator.currentDestination()?.pane).toBe('primary');
  });
  test('reset and explicit push-Back wait for committed navigation', async () => {
    const initial = [
      { pane: 'primary' as const, contentKey: null },
      { pane: 'secondary' as const, contentKey: 3 },
    ];
    const { navigator, calls, codec, snapshot } = setup(initial, false);
    const back = navigator.navigateBack('PopLatest');
    expect(calls[0].extras).toEqual({ replaceUrl: false });
    calls[0].resolve(true);
    await back;
    const reset = navigator.reset([]);
    expect(navigator.history()).toEqual(initial);
    expect(codec.decode(snapshot(new DefaultUrlSerializer().serialize(calls[1].tree)))).toEqual([]);
    calls[1].resolve(false);
    expect(await reset).toBe(false);
    const restore = navigator.reset();
    expect(codec.decode(snapshot(new DefaultUrlSerializer().serialize(calls[2].tree)))).toEqual(
      initial,
    );
    calls[2].resolve(false);
    await restore;
  });
  test('redirect commits decoded final URL rather than the requested destination', async () => {
    const { navigator, calls, commit } = setup();
    const requested = navigator.navigateTo('secondary', 1);
    commit([{ pane: 'primary', contentKey: 'redirected' }]);
    calls[0].resolve(true);
    expect(await requested).toBe(true);
    expect(navigator.currentDestination()).toEqual({ pane: 'primary', contentKey: 'redirected' });
  });
  test('browser Back/Forward are represented by final snapshots', () => {
    const { navigator, commit } = setup();
    const detail = [
      { pane: 'primary' as const, contentKey: null },
      { pane: 'secondary' as const, contentKey: 8 },
    ];
    commit(detail);
    commit(detail.slice(0, 1), 2);
    expect(navigator.history()).toHaveLength(1);
    commit(detail, 3);
    expect(navigator.history()).toEqual(detail);
  });
});
