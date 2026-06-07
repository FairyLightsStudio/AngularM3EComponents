


## 我已经注意到，但尚未打算实现的feature


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
