# Live2D 看板娘资源说明

## 一、核心依赖（前端必须满足）

| 依赖 | 作用 | 本项目中的来源 |
|------|------|----------------|
| **PixiJS** | 画布渲染 | npm 包 `pixi.js` |
| **pixi-live2d-display (Cubism 4)** | 加载 .model3.json、驱动模型 | npm 包 `pixi-live2d-display`，使用子路径 `/cubism4` |
| **Cubism 5 运行时** | 解析 moc3、计算顶点等 | 页面加载本地 `/scripts/live2dcubismcore.min.js`（随仓库提交；CSP 只放行同源脚本，不走 CDN） |

说明：本方案针对 **Cubism 3/4/5** 的 `.model3.json` 模型，**不**使用旧版 `live2d.min.js`、`lappdelegate.js`（仅适用于 Cubism 2 的 .model.json）。模型 moc3 版本不能高于运行时 Core 支持的版本。

## 二、模型资源与路径

- **入口文件**：每个模型一个 `.model3.json`，其中写明了同目录下的 `.moc3`、贴图、物理文件等相对路径。
- **目录约定**：所有该模型用到的文件放在 **同一目录** 下，例如：

```
public/live2d/sherry/
├── Sherry - Model.model3.json   ← 入口，前端请求此 URL
├── Sherry - Model.moc3
├── Sherry - Model.physics3.json
└── Sherry - Model.4096/
    ├── texture_00.png
    └── texture_01.png
```

- **前端如何加载**：组件里只配置「入口 URL」即可，例如  
  `MODEL_URL = '/live2d/sherry/Sherry%20-%20Model.model3.json'`  
  库会请求该 JSON，再根据其中的路径自动请求同目录下的 moc3、贴图等（路径相对于该 JSON 所在目录）。
- **换模型/换路径**：把新模型的整份资源放到 `public/live2d/<名字>/`，把组件中的 `MODEL_URL` 改为  
  `/live2d/<名字>/你的模型.model3.json` 即可（文件名含空格时需 URL 编码，如 `%20`）。

## 三、本地部署 Cubism 运行时

`public/scripts/live2dcubismcore.min.js` 随仓库提交，组件只加载这一份本地副本：
CSP 的 `script-src` 仅放行同源脚本，官方 CDN 会被浏览器拦截，走 CDN 必然失败。

- 当前模型 `Sherry - Model.moc3` 是 **moc3 v5**，必须用 **Cubism 5 Core**。
- npm 包 `live2dcubismcore@1.x` 只带 Cubism 4.2 Core（最高支持 moc3 v4），
  用它覆盖会让模型解析失败并抛 `Unknown error`。
- 因此 `npm run copy:cubism-core` 只在 node_modules 里确实存在 5.x Core 时才覆盖本地文件，
  否则保留仓库内的副本。

## 四、复制模型资源到本项目（首次或换模型时）

若模型在本地其他目录（如下载的压缩包解压后）：

- 执行：`npm run copy:live2d`
- 默认从 `用户目录/Downloads/Sherry橘雪莉_-_Mandou/SherryModel` 复制到 `public/live2d/sherry/`
- 源路径可在 `scripts/copy-live2d-model.js` 中修改 `SOURCE` 变量

---

总结：  
**1）核心 = PixiJS + pixi-live2d-display + live2dcubismcore；**  
**2）加载 = 只配好 .model3.json 的 URL，且与 moc3/贴图同目录；**  
**3）运行时 = 本地 `/scripts/live2dcubismcore.min.js`（Cubism 5 Core，随仓库提交）、用 copy:live2d 拷贝模型资源。**
