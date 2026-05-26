本项目旨在补齐 Angular 官方目前在 Angular Material UI Component Library 没有提供的一些 Material 3 Expressive 组件。

本项目目前已实现 `projects/fairylights-studio` 下的 4 个包（组件）：

1. **navigation-common** — 共享基类与指令：`MatNavigationItemBase`（active/disabled/badge/label 状态管理）、`MatNavigationIcon`、`MatNavigationActiveIcon`、`MatNavigationLabel`（内容投影指令），供 bar/rail 复用。
2. **navigation-bar** — 底部导航栏（`MatNavigationBarComponent` + `MatNavigationBarItemComponent`），适用于手机/小屏横向导航，支持 active/disabled/badge/label 显示与 vertical/horizontal 布局切换。
3. **navigation-rail** — 侧边导航栏（`MatNavigationRailComponent` + `Item` + `Header` + `Toggle`），适用于大屏竖向导航，支持展开/折叠、双图标（默认/激活态）、徽标、分割线、垂直排列方式、指示器形状（hug/fill）。
4. **navigation-suite** — 导航套件脚手架（`MatNavigationSuiteScaffoldComponent`），根据 Material 3 断点自动在 navigation-bar 和 navigation-rail 之间切换响应式布局，并包含 `MatNavigationSuiteItem` 和 `MatNavigationSuitePrimaryAction` 辅助组件。

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

使用 bun 而非npm作为依赖项管理


现阶段，不需要AI修改后 自己编译/build，修改完毕后直接告诉主人修改完了就好了。不要AI自己 BUILD， BUILD 的流水线还没搭建好
