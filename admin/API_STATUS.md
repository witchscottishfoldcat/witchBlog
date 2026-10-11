# API 接入状态统计

> 最近核对：2026-09-19。以 `src/` 实际调用为准（旧版本文档声称的「135 个方法 / 60+ 已接入」已失真，本次重写）。

## 总览

**生成的 API 客户端**（`src/services/`，由 OpenAPI 生成，勿手改）：

| 文件 | 方法数 | 实际调用情况 |
|---|---|---|
| `services/Service.ts` | 196 | 部分接入；音乐/游戏改走 axios 封装 |
| `services/MdService.ts` | 23 | 已接入（MDFiles / MDFileEdit / Archives） |
| `services/DefaultService.ts` | 3 | 未接入（根路径 / 健康检查 / 图片代理） |
| `services/AiService.ts` | 5 | 未直接使用；AI 经 `aiApi.ts`（axios）接入 |
| `services/RssService.ts` | 3 | 未接入（后台暂无 RSS 管理 UI） |

**另经 axios 封装接入**：`adminApi.ts`（/admin/*）、`schedulerApi.ts`（/scheduler/*）、
`siteStatsApi.ts`（/site-stats/*）、`musicApi.ts`（/music-libraries、/music-tracks/*）、
`gameShowcaseApi.ts`（/game-showcase/*）、`aiApi.ts`（/ai/*）。

**合计**：生成端点约 230 个，实际接入约 128 个（≈56%）。

## ✅ 已接入（按页面）

| 页面（路由） | 后端接口 | 说明 |
|---|---|---|
| 登录 `/login` | `POST /auth/login`（axios） | `utils/auth.ts` |
| 仪表板 `/dashboard` | `/md-files`、`/diaries`、`/links`、`/site-stats/`、`/site-stats/detailed`、快速日记 `POST /diaries` | `siteStatsApi` |
| 个人资料 `/profile` | `PUT /users/me` | |
| 博客文章 `/md-files` | `/md-files` CRUD、上传、`toggle-public`、下载、归档 | `MDService` |
| 归档管理 `/archives` | `/md-file-archive/archives` 读取/内容/删除 | |
| 日记 `/diaries` | `/diaries` CRUD、图片上传 URL 三件套 | |
| 链接 `/links` | `/links` 全套 CRUD + 分类/标签统计 + 随机 + 图片上传 | 友链管理 |
| 资源链接 `/resource-links` | `/resource-links` CRUD + 分类/标签 | |
| 时间线 `/timelines` | `/timelines` CRUD、`/timelines/my/timelines` | |
| 技能 `/skills` | `/skills` CRUD、周期 CRUD、`current`、`projects` | |
| 项目 `/projects` | `/projects` CRUD、统计、`refresh` | |
| 追番追剧 `/anime-watchlist` | `/anime-watchlist` CRUD、统计、批量封面/元数据、进度、封面 URL | |
| 相册 `/albums` | `/albums` CRUD、照片上传/改/删、封面 | 2026-09-19 新增页面 |
| 音乐馆 `/music` | `/music-libraries`、`/music-tracks/*`（`musicApi`） | |
| 游戏 `/games` | `/game-showcase/*`（`gameShowcaseApi`）；读取接口现已要求超管（2026-09-19 收紧，R18 不再匿名可见） | |
| 定时任务 `/scheduled-tasks` | `/scheduler/tasks` 启停/立即执行（`schedulerApi`） | |
| 关于文件 `/about-files` | `/about` 上传/列表/删除 | |
| 网站配置 `/site-config` | `/site-config/active`、`POST /`（创建初始配置，2026-10-03 接入）、`PUT /{id}`、图标/头像上传 | |
| 系统管理 `/admin` | `/admin/*` 性能/日志 SSE/仪表盘/健康检查（超管） | `adminApi` |
| 侧边栏/登录页品牌 | `/site-config/active`、`/site-config/public` | `branding.ts`、`Sidebar.tsx` |

### 站点配置缓存刷新链路（2026-09-19 接通）

SiteConfig 保存 / 上传图标 / 上传头像后调用
`POST /api/v1/site-config/revalidate-frontend`（超管，见 `utils/cache.ts`），
由后端代理调用前台 `POST /api/site-config/revalidate` 立即清缓存。
需在**后端**配置环境变量 `FRONTEND_BASE_URL` 与 `FRONTEND_REVALIDATE_SECRET`
（后者须与前台的 `REVALIDATE_SECRET` 一致）；未配置时接口返回 400，
前台退回 60 秒缓存 + ISR 自然过期。刷新密钥只保存在服务端，禁止放进 `VITE_*` 变量。

## ❌ 后端已废弃，不再接入

- **文本管理 `/api/v1/texts`**：后端路由已废弃且未挂载
  （witchcat-cn `app/api/v1/api.py` 中 `include_router(texts.router)` 已注释标记废弃）。
  旧版本文档曾把 Texts 全套标为「✅ 已接入」，与事实不符——后台没有也不需要 Texts 页面。

## ❌ 尚未接入（生成客户端中未被调用的主要方法）

- `createLinkWithImageApiV1LinksCreateWithImagePost`（带图创建链接；其余链接方法均已接入）
- `readSiteConfigsApiV1SiteConfigGet` / `deleteSiteConfigApiV1SiteConfigConfigIdDelete`
  （多配置管理；后台只维护激活配置，创建入口已于 2026-10-03 接入）
- `DefaultService` 全部（根路径 / 健康检查 / 图片代理）、`RssService` 全部
- `Service.ts` 中音乐/游戏的生成方法（已被 `musicApi` / `gameShowcaseApi` 取代）
- `test-exceptions` 系列与 `/ai` 的 providers/models 查询（生成方法未调用）

## 维护约定

- 新接一个页面/接口，请同步更新本文档的「已接入」表；本文档只记录**实际调用**，
  不记录「计划接入」。
- 生成客户端（`src/services/services/*`、`src/services/models/*`）由后端 OpenAPI
  重新生成，未接入的方法保留在客户端里不代表后台可用。
