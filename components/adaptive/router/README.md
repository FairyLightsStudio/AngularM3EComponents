# Optional Router navigator

Import from `@fairylights-studio/ngx-m3-adaptive/router`. Only applications using
this secondary entrypoint need Angular Router.

## Usage

Create both factories in an Angular injection context, such as a component field
initializer. Pass the navigator to a scaffold, which supplies measured layout
configuration and owns the navigator until destruction.

```ts
import { createMatPaneQueryParamCodec, createMatPaneRouterNavigator }
  from '@fairylights-studio/ngx-m3-adaptive/router';

readonly navigator = createMatPaneRouterNavigator(
  createMatPaneQueryParamCodec({
    queryParam: 'paneTrail',
    fallbackRoot: { pane: 'secondary', contentKey: null },
  }),
);

async open(id: number) {
  try {
    const committed = await this.navigator.navigateTo('primary', id);
    // false means canceled/skipped: do not render speculative state.
  } catch (error) {
    // Report resolver/navigation errors through the application error UI.
  }
}
```

An application can instead supply a `MatPaneRouterCodec` implementing
`decode(snapshot: RouterStateSnapshot): readonly MatPaneDestination[]` and
`encode(history): UrlTree`, for example using route segments. Decode should be
total and side-effect free. Thrown decode errors or invalid destination arrays
become an empty history; they do not cause a URL rewrite.

## State and navigation semantics

- Initial history comes from the current Router snapshot, including deep links.
- Only `NavigationEnd` commits later decoded history. Guard cancellation, errors
  and in-flight URLs never optimistically change pane state.
- Every request starts from committed history. Rapid pending requests do not
  accumulate speculative destinations; the successful final URL is authoritative.
- `configure()` only changes layout. Unavailable roles can be visually hidden,
  but remain in committed history and `currentDestination`. The scaffold should
  derive a visible destination from available roles for presentation; filtering
  the view is not a committed-history mutation. Resize cannot rewrite a URL.
- One live scaffold owns a navigator. `release(owner)` only releases that owner.
  While bound, `navigateTo` rejects roles absent from the owning layout.
- `reset()` navigates to the initially decoded trail; `reset([])` clears it.
- `navigateBack()` applies the primary package's four pane policies and uses
  `replaceUrl: true` by default. It navigates to an encoded parent URL, **not**
  browser `history.back()`. Set `replaceUrlOnBack: false` to push the parent URL.
- Browser Back/Forward use Router's normal events. No pushState/popstate
  interception, external browser-stack index, or writeback effect exists.
- Navigation promises are returned directly: cancellation resolves false; errors
  reject unless Router is configured to resolve navigation errors. Callers must
  await/catch them. Invalid roles/keys or encode errors throw synchronously.
- `DestroyRef` unsubscribes when the injection context is destroyed.

## Query-param wire format

The codec uses versioned JSON `[1, [[role, type, value], ...]]` in `paneTrail`.
Types are `string`, `number`, and `null`; numeric values are canonical number
strings (including distinct `-0`). Numeric 1, string "1", null, and empty string
cannot collide. Empty history is explicit, not a missing query parameter.

Missing or duplicate parameters, unknown versions, malformed entries and oversized
input fall back atomically to `fallbackRoot` (default primary/null). A malformed
trail never retains a valid prefix. Bounds: 128 destinations, 1024 UTF-16 units per
string key, 16384 units of JSON. Encoding oversized history throws, never truncates.
Angular's normal UrlTree serializer URI-encodes the JSON.

Encoding uses `Router.parseUrl(router.url)` and modifies only its owned parameter,
preserving path/matrix parameters, auxiliary outlets, unrelated repeated query
parameters and fragments. Malformed URLs are not canonicalized until an explicit
application navigation. Supply a custom codec for different root rules, shorter
URLs, or other size constraints.
