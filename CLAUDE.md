# bt-fit

体重记录（body-weight tracker）小程序 / App，基于 **uni-app** 构建。实际工程目录位于 `bt-fit/`（`manifest.json`、`pages/`、`App.vue` 等都在该子目录下）。

## 技术栈

- **uni-app**（DCloud）：一套代码多端编译；条件编译用 `// #ifdef` / `// #ifndef`（见 `bt-fit/main.js` 中的 `VUE3` 分支）。
- **Vue 3**：`main.js` 中通过 `createSSRApp` 创建应用。
- 平台 API：`uni.getStorageSync` / `uni.setStorageSync` / `uni.showToast` / `uni.showModal` / `uni.pageScrollTo` 等。
- 样式：单位用 `rpx`；`uni.scss` 存放公共变量。

## 目录结构

```
bt-fit/
├── App.vue              # 应用入口（onLaunch/onShow/onHide 生命周期）
├── main.js              # createApp，含 VUE2/VUE3 条件编译
├── manifest.json        # uni-app 应用配置（appid、各端打包配置）
├── pages.json           # 页面路由与全局样式（navigationBar 等）
├── uni.scss             # 公共样式变量
└── pages/
    └── index/           # 主页目录
        ├── index.vue    # 主页：组合各组件，数据存于本地 storage
        └── components/  # 主页专属（非全局）组件：AppHeader / WeightSummary / RecordForm / RecordList
```

## 编码约定

- **尽量使用 Vue 3 语法**：新写或重构组件时，优先使用 **Composition API + `<script setup>`**（`ref` / `reactive` / `computed` / `watch`），而不是 Options API（`data()` / `methods`）。`pages/index/index.vue` 及其子组件均已采用 `<script setup>`。
- **组件就近放置**：非全局（页面专属）组件放在对应页面目录下的 `components/` 子目录里（如 `pages/index/components/`），并在页面中用相对路径引入（`import X from './components/X.vue'`）；只有真正跨页面复用的全局组件才放到与 `pages/` 同级的 `components/` 目录。
- uni-app 页面生命周期（`onLoad` / `onShow` / `onReady` / `onHide` 等）需从 `@dcloudio/uni-app` 导入后在 `<script setup>` 中调用，例如：
  ```js
  import { onLoad } from '@dcloudio/uni-app'
  onLoad(() => { /* ... */ })
  ```
- 持久化统一走 `uni.*StorageSync`，存储键集中在文件顶部（如 `STORAGE_KEY = 'bt_fit_weight_records'`）。
- 遵循现有样式风格：卡片化布局、`rpx` 单位、圆角与柔和的薄荷绿配色。

## 开发 / 运行

通过 HBuilderX 打开 `bt-fit/` 目录运行，或使用 uni-app CLI（`@dcloudio/uni-cli`）。本仓库尚未包含 `package.json` 与构建脚本；按需通过官方脚手架补齐。
