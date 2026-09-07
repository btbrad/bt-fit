# bt-fit（BTの体重）

记录体重的 App / 小程序，基于 **uni-app + Vue 3** 构建，一套代码多端编译（App / H5 / 各小程序平台）。

## 功能特性

- **登录 / 退出**：账号密码登录，token 失效自动跳转登录页
- **体重记录**：录入 / 编辑 / 删除体重记录，分页加载、上拉加载更多
- **数据趋势**：折线图查看体重走势（基于 uCharts 图表组件），支持近 7 / 30 / 90 天与自定义日期范围（默认近 30 天）
- **BMI 分析**：根据最新身高体重计算 BMI 并给出体型评价
- **数据概览**：统计记录天数、最新体重、目标体重差值等
- **个人中心**：查看 / 修改个人信息（昵称、身高、目标体重等）、修改密码
- **应用信息**：展示版本号等 App 信息

## 技术栈

- **uni-app**（DCloud）：`manifest.json` / `pages.json` 配置多端编译
- **Vue 3**：Composition API + `<script setup>`
- **uCharts（qiun-data-charts）**：跨全端图表组件，`uni_modules` 随仓库提交，用于数据页折线图
- **uni-icons**：官方图标组件，`uni_modules` 随仓库提交；tabBar 图标在 H5 / App 端走 iconfont（`pages.json` 的 `iconfontSrc`），小程序端使用同字库渲染的 PNG（`static/tab-*.png`）
- 样式：`rpx` 单位，卡片化布局，薄荷绿配色（公共变量见 `uni.scss`）

## 目录结构

```
├── App.vue                  # 应用入口（onLaunch/onShow/onHide 生命周期）
├── main.js                  # createSSRApp 创建应用（含 VUE2/VUE3 条件编译）
├── manifest.json            # uni-app 应用配置（appid、各端打包配置）
├── pages.json               # 页面路由、tabBar 与全局样式
├── uni.scss                 # 公共样式变量
├── pages/
│   ├── login/login.vue      # 登录页（启动页）
│   ├── index/index.vue      # 首页：组合各组件
│   │   └── components/      # 首页专属组件
│   │       ├── AppHeader.vue        # 顶部标题
│   │       ├── BmiCard.vue          # BMI 分析卡片
│   │       ├── WeightSummary.vue    # 数据概览
│   │       ├── RecordForm.vue       # 录入 / 修改表单
│   │       └── RecordList.vue       # 记录列表
│   ├── data/
│   │   └── data.vue         # 数据（tabBar 页）：日期范围选择 + 折线图 + 区间统计
│   └── profile/
│       ├── profile.vue      # 我的（tabBar 页）
│       ├── info.vue         # 个人信息
│       ├── password.vue     # 修改密码
│       └── about.vue        # 应用信息
├── api/                     # 接口层，统一从 api/index.js 导入
│   ├── index.js             # API 统一出口
│   ├── login.js             # 登录 / 退出
│   ├── home.js              # 体重记录
│   └── profile.js           # 用户信息 / 修改密码
├── uni_modules/             # uni-app 插件（随仓库提交，无需额外安装）
│   ├── qiun-data-charts/    # uCharts 图表组件（数据页折线图）
│   └── uni-icons/           # 官方图标组件（easycom 自动注册）
├── utils/request.js         # 全局 HTTP 封装（基于 uni.request，$http）
└── config/
    ├── env.example.js       # 环境配置模板
    └── env.local.js         # 本地环境配置（已 gitignore，需自行创建）
```

## 快速开始

1. 配置接口地址：

   ```bash
   # 复制环境配置模板，填入后端服务地址
   cp config/env.example.js config/env.local.js
   ```

   ```js
   // config/env.local.js
   export default {
       baseUrl: 'http://127.0.0.1:5000', // 后端服务地址
       timeout: 10000
   }
   ```

2. 使用 **HBuilderX** 打开本目录，选择「运行」→ 运行到浏览器 / 手机或模拟器。

   也可使用 uni-app CLI（`@dcloudio/uni-cli`）运行；仓库暂未包含 `package.json` 与构建脚本，需要时通过官方脚手架补齐。

## 后端接口约定

- 统一返回格式 `{ code, message, data }`，`code` 为 `0`（或 `200`）表示成功
- 登录成功后返回 token，请求头携带 `Authorization: Bearer <token>`
- 返回 `401` 时前端自动清除登录态并跳转登录页

现有接口（前缀为 `baseUrl`）：

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/api/login` | 登录（不携带 token） |
| POST | `/api/logout` | 退出登录 |
| GET | `/api/profile` | 获取用户信息 |
| PUT | `/api/profile` | 修改用户信息 |
| POST | `/api/change-password` | 修改密码 |
| POST | `/api/weight-records` | 新增体重记录 |
| GET | `/api/weight-records` | 分页查询体重记录（`page` / `per_page`，可选 `start_date` / `end_date`） |

## 编码约定

- 优先使用 Vue 3 **Composition API + `<script setup>`**，不使用 Options API
- 页面专属组件就近放在对应页面目录的 `components/` 子目录，相对路径引入
- uni-app 页面生命周期从 `@dcloudio/uni-app` 导入后使用（如 `onLoad` / `onShow`）
- 持久化统一走 `uni.*StorageSync`，存储键集中在文件顶部
- 接口统一从 `api/index.js` 导入，请求统一走 `utils/request.js` 的 `$http`
- 样式遵循卡片化布局、`rpx` 单位、薄荷绿配色

## 打包发布

通过 HBuilderX「发行」菜单进行云打包或本地打包，产物输出到 `unpackage/`（已 gitignore）。Android APK 输出至 `unpackage/release/apk/`。
