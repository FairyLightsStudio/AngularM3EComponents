## 打算实现的feature

### 999 storybook测试、顺带看看视觉测试有冇必要引入

## fix: 极窄屏设备下，bar可以触摸滚动items，rail在下有一些问题，suite派生出的rail、bar在极窄屏设备下有严重问题（滚动不了）

## 我已经注意到，但尚未打算实现的feature

### storybook 引入 compodoc，为文档页展示更全面的 API 列表

引入 compodoc 有问题。先把 没有compodoc的 storybook 搞定了再说。

### 尺寸与密度：Angular Material 官方可以为主题设定不同的、运行时改不了的Density

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: 0 //这里能调节！
  ));
}
```

我不打算实现这个，因为我用不到！你要用的话请自行实现，能向我们发PR就最好啦。
