# 游戏展示 API 使用文档

## 概述

游戏展示模块提供游戏数据的管理和前台展示功能，支持从 Steam 平台批量导入游戏数据。

分为两组接口：
- **后台管理 API** (`/api/v1/game-showcase`) — 游戏的增删改查、Steam 导入、数据同步
- **前台展示 API** (`/api/v1/games`) — 仅返回已启用的游戏，供博客前端使用

## 数据模型

### GameShowcase 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | int | 自动 | - | 主键 |
| `title` | string(200) | ✅ | - | 游戏名称 |
| `description` | text | ❌ | null | 游戏简介 |
| `cover_image_url` | string(500) | ❌ | null | 封面图片链接 |
| `steam_appid` | string(20) | ❌ | null | Steam AppID（唯一） |
| `steam_url` | string(500) | ❌ | null | Steam 商店链接 |
| `platform` | string(50) | ✅ | `"steam"` | 平台 |
| `category` | string(50) | ✅ | `"other"` | 分类 |
| `tags` | string(500) | ❌ | null | 标签，逗号分隔 |
| `developer` | string(200) | ❌ | null | 开发商 |
| `publisher` | string(200) | ❌ | null | 发行商 |
| `status` | string(50) | ✅ | `"want_play"` | 游玩状态 |
| `play_time` | int | ✅ | `0` | 游玩时长（分钟） |
| `rating` | float | ❌ | null | 个人评分（0-10） |
| `review` | text | ❌ | null | 个人短评 |
| `is_favorite` | bool | ✅ | `false` | 是否收藏 |
| `is_active` | bool | ✅ | `true` | 是否在前台显示 |
| `sort_order` | int | ✅ | `0` | 排序权重（越小越靠前） |
| `release_date` | string(20) | ❌ | null | 发行日期 |
| `created_at` | datetime | 自动 | - | 创建时间 |
| `updated_at` | datetime | 自动 | - | 更新时间 |

### 枚举值

**platform（平台）：**
`steam` | `epic` | `ps` | `switch` | `pc` | `mobile` | `other`

**category（分类）：**
`rpg` | `fps` | `strategy` | `simulation` | `indie` | `adventure` | `other`

**status（游玩状态）：**

| 值 | 说明 |
|-----|------|
| `want_play` | 想玩 |
| `playing` | 在玩 |
| `completed` | 已通关 |
| `shelved` | 搁置 |
| `dropped` | 弃坑 |

---

## 前台展示 API

> 以下接口仅返回 `is_active=true` 的游戏数据，无需鉴权。

### 1. 首页概览

**端点**: `GET /api/v1/games/`

**描述**: 获取游戏展示首页所需的全部数据，包括统计、最近添加、正在玩、收藏列表。

**响应示例**:
```json
{
  "stats": {
    "total_games": 77,
    "total_play_time": 327480,
    "total_play_time_hours": 5458.0,
    "favorite_count": 3,
    "average_rating": 8.5,
    "status_stats": [
      { "status": "playing", "count": 47 },
      { "status": "want_play", "count": 28 },
      { "status": "completed", "count": 2 }
    ],
    "platform_stats": [
      { "platform": "steam", "count": 77 }
    ],
    "category_stats": [
      { "category": "other", "count": 40 },
      { "category": "fps", "count": 15 },
      { "category": "rpg", "count": 12 },
      { "category": "adventure", "count": 10 }
    ]
  },
  "recent_games": [
    {
      "id": 1,
      "title": "Counter-Strike 2",
      "cover_image_url": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
      "platform": "steam",
      "status": "playing",
      "play_time": 145713,
      "rating": null,
      "tags": "动作, 免费",
      "created_at": "2026-02-11T16:52:00",
      "updated_at": "2026-02-11T16:52:00"
    }
  ],
  "playing_games": [],
  "favorite_games": []
}
```

### 2. 游戏列表（分页）

**端点**: `GET /api/v1/games/list`

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | 1 | 页码（从1开始） |
| `size` | int | 20 | 每页数量（1-100） |
| `platform` | string | - | 按平台过滤 |
| `category` | string | - | 按分类过滤 |
| `status` | string | - | 按状态过滤 |
| `tags` | string | - | 按标签过滤（逗号分隔，匹配任意一个） |
| `is_favorite` | bool | - | 只看收藏 |
| `sort_by` | string | `"sort_order"` | 排序方式 |

**sort_by 可选值**:
- `sort_order` — 按排序权重
- `created_at` — 按创建时间（新→旧）
- `title` — 按名称字母序
- `play_time` — 按游玩时长（多→少）
- `rating` — 按评分（高→低）

**响应示例**:
```json
{
  "items": [
    {
      "id": 5,
      "title": "ELDEN RING",
      "description": "以正统黑暗奇幻世界为舞台的动作RPG游戏...",
      "cover_image_url": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
      "steam_appid": "1245620",
      "steam_url": "https://store.steampowered.com/app/1245620",
      "platform": "steam",
      "category": "rpg",
      "tags": "动作, 角色扮演",
      "developer": "FromSoftware, Inc.",
      "publisher": "FromSoftware, Inc., Bandai Namco Entertainment",
      "status": "playing",
      "play_time": 3600,
      "rating": null,
      "review": null,
      "is_favorite": false,
      "is_active": true,
      "sort_order": 0,
      "release_date": "2022年2月25日",
      "created_at": "2026-02-11T16:52:30",
      "updated_at": "2026-02-11T16:52:30"
    }
  ],
  "total": 77,
  "page": 1,
  "size": 20,
  "pages": 4
}
```

**请求示例**:
```bash
# 获取正在玩的游戏，按游玩时长排序
curl "http://localhost:8000/api/v1/games/list?status=playing&sort_by=play_time"

# 获取 RPG 类型的游戏
curl "http://localhost:8000/api/v1/games/list?category=rpg&page=1&size=10"

# 获取收藏的游戏
curl "http://localhost:8000/api/v1/games/list?is_favorite=true"
```

### 3. 随机推荐

**端点**: `GET /api/v1/games/random`

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `count` | int | 5 | 随机数量（1-20） |

**响应**: 返回 GameShowcase 数组

```bash
curl "http://localhost:8000/api/v1/games/random?count=3"
```

### 4. 统计数据

**端点**: `GET /api/v1/games/stats`

**响应示例**:
```json
{
  "total_games": 77,
  "total_play_time": 327480,
  "total_play_time_hours": 5458.0,
  "favorite_count": 3,
  "average_rating": 8.5,
  "status_stats": [
    { "status": "playing", "count": 47 },
    { "status": "want_play", "count": 28 },
    { "status": "completed", "count": 2 }
  ],
  "platform_stats": [
    { "platform": "steam", "count": 77 }
  ],
  "category_stats": [
    { "category": "other", "count": 40 },
    { "category": "fps", "count": 15 }
  ]
}
```

### 5. 游戏详情

**端点**: `GET /api/v1/games/{game_id}`

**路径参数**:
- `game_id` (int) — 游戏 ID

**响应**: 返回完整的 GameShowcase 对象，如果游戏不存在或未启用则返回 404。

---

## 后台管理 API

> 以下接口用于管理游戏数据。

### 1. 获取游戏列表

**端点**: `GET /api/v1/game-showcase/`

**查询参数**: 与前台 `/games/list` 相同，另外支持：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `is_active` | bool | `true` | 过滤启用状态（可设为 `false` 查看隐藏的游戏） |
| `skip` | int | 0 | 跳过条数 |
| `limit` | int | 100 | 返回条数（最大1000） |

**响应**: 返回 GameShowcase 数组

### 2. 分页获取游戏列表

**端点**: `GET /api/v1/game-showcase/list`

**查询参数**: 与前台 `/games/list` 完全一致，支持 `is_active` 过滤。

**响应**: 返回 `{ items, total, page, size, pages }` 分页对象

### 3. 创建游戏

**端点**: `POST /api/v1/game-showcase/`

**请求体**:
```json
{
  "title": "塞尔达传说：王国之泪",
  "description": "开放世界探索冒险游戏",
  "cover_image_url": "https://example.com/zelda.jpg",
  "platform": "switch",
  "category": "adventure",
  "status": "completed",
  "play_time": 7200,
  "rating": 9.5,
  "review": "神作！",
  "tags": "开放世界,冒险",
  "developer": "Nintendo",
  "publisher": "Nintendo",
  "is_favorite": true,
  "release_date": "2023-05-12"
}
```

**必填字段**: 仅 `title`

**响应**: 返回完整的 GameShowcase 对象

### 4. 更新游戏

**端点**: `PUT /api/v1/game-showcase/{game_id}`

**请求体**: 只传需要更新的字段即可
```json
{
  "rating": 9.0,
  "status": "completed",
  "review": "通关了，非常棒！",
  "is_favorite": true
}
```

**响应**: 返回更新后的完整 GameShowcase 对象

### 5. 删除游戏

**端点**: `DELETE /api/v1/game-showcase/{game_id}`

**响应**:
```json
{
  "message": "删除成功"
}
```

### 6. 获取游戏详情

**端点**: `GET /api/v1/game-showcase/{game_id}`

**响应**: 返回完整的 GameShowcase 对象

### 7. Steam 批量导入 ⭐

**端点**: `POST /api/v1/game-showcase/import-from-steam`

**描述**: 从 Steam 批量导入用户的游戏库。会自动获取游戏封面、简介、开发商等信息。已存在的游戏（按 `steam_appid` 匹配）会更新游玩时长等信息。

**请求体**:
```json
{
  "steam_id": "your-steam-user-id",
  "import_all": true,
  "default_status": "want_play"
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `steam_id` | string | 必填 | Steam 64位用户ID |
| `import_all` | bool | `true` | `true`=导入全部游戏，`false`=只导入有游玩时长的 |
| `default_status` | string | `"want_play"` | 新导入游戏的默认状态 |

**响应示例**:
```json
{
  "total_found": 77,
  "imported": 77,
  "updated": 0,
  "skipped": 0,
  "failed": 0,
  "message": "导入完成: 新增 77, 更新 0, 失败 0"
}
```

> ⚠️ **注意**: 首次导入可能需要 1-2 分钟（因为需要逐个获取游戏详情）。请设置较长的请求超时。

**JavaScript 示例**:
```javascript
const response = await fetch('/api/v1/game-showcase/import-from-steam', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    steam_id: 'your-steam-user-id',
    import_all: true,
    default_status: 'want_play'
  }),
  // 导入需要较长时间
  signal: AbortSignal.timeout(300000)
});
const result = await response.json();
console.log(`导入完成: 新增 ${result.imported}, 更新 ${result.updated}`);
```

### 8. Steam 同步

**端点**: `POST /api/v1/game-showcase/sync-from-steam`

**描述**: 同步 Steam 游戏数据（更新游玩时长、新增游戏）

**查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `steam_id` | string | Steam 64位用户ID（必填） |

**请求示例**:
```bash
curl -X POST "http://localhost:8000/api/v1/game-showcase/sync-from-steam?steam_id=your-steam-user-id"
```

**响应示例**:
```json
{
  "message": "同步完成: 更新 45, 新增 2",
  "total_found": 77,
  "imported": 2,
  "updated": 45,
  "skipped": 0,
  "failed": 0
}
```

### 9. 统计数据

**总体统计**: `GET /api/v1/game-showcase/stats`

**状态统计**: `GET /api/v1/game-showcase/stats/status`

**平台统计**: `GET /api/v1/game-showcase/stats/platform`

**分类统计**: `GET /api/v1/game-showcase/stats/category`

响应格式同前台统计接口。

---

## 前端集成示例

### Vue 3 组合式 API 示例

```javascript
// composables/useGameShowcase.js

import { ref, computed } from 'vue'

const API_BASE = '/api/v1/games'

export function useGameShowcase() {
  const games = ref([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const stats = ref(null)

  // 获取首页概览
  async function fetchOverview() {
    const res = await fetch(`${API_BASE}/`)
    return await res.json()
  }

  // 获取游戏列表
  async function fetchGames(params = {}) {
    loading.value = true
    const query = new URLSearchParams({
      page: page.value,
      size: 20,
      ...params
    })
    const res = await fetch(`${API_BASE}/list?${query}`)
    const data = await res.json()
    games.value = data.items
    total.value = data.total
    loading.value = false
    return data
  }

  // 获取统计
  async function fetchStats() {
    const res = await fetch(`${API_BASE}/stats`)
    stats.value = await res.json()
    return stats.value
  }

  // 获取随机推荐
  async function fetchRandom(count = 5) {
    const res = await fetch(`${API_BASE}/random?count=${count}`)
    return await res.json()
  }

  // 格式化游玩时长
  function formatPlayTime(minutes) {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // 状态中文映射
  const statusMap = {
    want_play: '想玩',
    playing: '在玩',
    completed: '已通关',
    shelved: '搁置',
    dropped: '弃坑'
  }

  // 平台中文映射
  const platformMap = {
    steam: 'Steam',
    epic: 'Epic',
    ps: 'PlayStation',
    switch: 'Switch',
    pc: 'PC',
    mobile: '移动端',
    other: '其他'
  }

  return {
    games, total, page, loading, stats,
    fetchOverview, fetchGames, fetchStats, fetchRandom,
    formatPlayTime, statusMap, platformMap
  }
}
```

### 封面图片说明

Steam 导入的游戏封面链接格式：
```
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appid}/header.jpg
```

图片尺寸：460 x 215 px

如果需要其他尺寸，可用以下链接：
```
# 胶囊图（小）231 x 87
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appid}/capsule_231x87.jpg

# 胶囊图（大）616 x 353
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appid}/capsule_616x353.jpg

# 页面背景 1920 x 620
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appid}/page_bg_generated_v6b.jpg
```

---

## 常见问题

### Q: Steam 导入后游戏状态是怎么自动设置的？

有游玩时长的游戏自动标记为 `playing`（在玩），无游玩时长的标记为 `default_status` 参数值（默认 `want_play`）。

### Q: 重复导入会怎样？

已存在的游戏（按 `steam_appid` 匹配）只会更新游玩时长和缺失的基本信息（封面、简介等），不会覆盖你手动修改的评分、短评和状态。

### Q: play_time 的单位是什么？

**分钟**。前端展示时需要自行转换为小时，参考上面的 `formatPlayTime` 函数。

### Q: 如何获取 Steam 64位用户ID？

访问 Steam 个人资料页面，URL 中的数字即为 64位ID：
```
https://steamcommunity.com/profiles/your-steam-user-id/
```
如果是自定义 URL（如 `/id/xxx/`），可通过 [SteamID Finder](https://www.steamidfinder.com/) 查询。
