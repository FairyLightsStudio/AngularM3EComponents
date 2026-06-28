## 打算实现的feature

### 999 storybook测试、顺带看看视觉测试有冇必要引入

## fix: 极窄屏设备下，bar可以触摸滚动items，rail在下有一些问题，suite派生出的rail、bar在极窄屏设备下有严重问题（滚动不了）

## 我已经注意到，但尚未打算实现的feature

### Navigation Suite 基于元素真实宽度的 rail 展开/收起过渡

当前 `navigation-suite` 为了让 expanded rail 收起时 main 面板跟随真实 rail 宽度平滑过渡，使用的是低频 JS 测量方案：在 rail 展开稳定后缓存实际宽度，收起前再冻结当前宽度作为 CSS transition 的起点。首次展开且尚无测量值时，main 面板先保持 collapsed rail offset，等 expanded rail 完全展开并测量到真实宽度后再让位，避免 grid 对绝对定位 rail surface 的 `max-content` 计算闪烁。

这不是最理想的实现方法。更理想的方向是纯 CSS intrinsic size 过渡，例如 `interpolate-size: allow-keywords` / `calc-size()`，让 `max-content` 与具体长度之间可以直接插值。等 Safari、Firefox 等浏览器支持后，应考虑移除 JS 测量兜底，改为纯 CSS 或以纯 CSS 为主的渐进增强实现。

### storybook 引入 compodoc，为文档页展示更全面的 API 列表

引入 compodoc 有问题。先把 没有compodoc的 storybook 搞定了再说。

### 尺寸与密度：Angular Material 官方可以为主题设定不同的、运行时改不了的Density

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme(
    (
      color: mat.$violet-palette,
      typography: Roboto,
      density: 0,
      //这里能调节！
    )
  );
}
```

我不打算实现这个，因为我用不到！你要用的话请自行实现，能向我们发PR就最好啦。
