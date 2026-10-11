# 音乐馆前台 API 接口文档

> 基础路径：`/api/v1/music`
> 所有接口均为 `GET` 请求，无需鉴权

---

## 目录

1. [音乐馆首页概览](#1-音乐馆首页概览)
2. [获取公开歌单列表](#2-获取公开歌单列表)
3. [获取歌单详情](#3-获取歌单详情)
4. [获取歌单内歌曲列表](#4-获取歌单内歌曲列表)
5. [获取歌曲详情](#5-获取歌曲详情)
6. [获取播放器代码](#6-获取播放器代码)
7. [获取歌词](#7-获取歌词)
8. [随机推荐歌曲](#8-随机推荐歌曲)
9. [音乐馆统计数据](#9-音乐馆统计数据)
10. [数据模型定义](#10-数据模型定义)
11. [枚举值说明](#11-枚举值说明)
12. [错误响应](#12-错误响应)

---

## 1. 音乐馆首页概览

获取音乐馆首页所需的所有数据，包含统计信息、歌单列表和最近添加的歌曲。

**请求**

```
GET /api/v1/music/
```

**参数**：无

**响应**

```json
{
  "stats": {
    "total_playlists": 5,
    "total_tracks": 128,
    "total_play_count": 1024,
    "favorite_count": 32,
    "category_stats": [
      { "category": "pop", "count": 45 },
      { "category": "rock", "count": 30 },
      { "category": "jazz", "count": 15 }
    ],
    "status_stats": [
      { "status": "unplayed", "count": 50 },
      { "status": "listening", "count": 28 },
      { "status": "completed", "count": 40 }
    ]
  },
  "playlists": [
    {
      "id": 1,
      "title": "我的流行歌单",
      "description": "精选流行歌曲",
      "cover_image_url": "https://p1.music.126.net/xxx.jpg",
      "tags": "流行,经典",
      "track_count": 42,
      "view_count": 256,
      "created_at": "2026-01-15T08:30:00"
    }
  ],
  "recent_tracks": [
    {
      "id": 10,
      "title": "晴天",
      "artist": "周杰伦",
      "album": "叶惠美",
      "cover_image_url": "https://p1.music.126.net/xxx.jpg",
      "duration": 269,
      "year": 2003,
      "genre": "流行",
      "category": "pop",
      "tags": "华语,经典",
      "status": "completed",
      "play_count": 15,
      "rating": 9.5,
      "is_favorite": true,
      "netease_id": "186016"
    }
  ]
}
```

---

## 2. 获取公开歌单列表

分页获取所有公开歌单。

**请求**

```
GET /api/v1/music/playlists
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `tags` | string | 否 | - | 标签筛选，多个标签逗号分隔 |
| `page` | int | 否 | 1 | 页码（≥1） |
| `size` | int | 否 | 20 | 每页数量（1-100） |

**响应**

```json
{
  "items": [
    {
      "id": 1,
      "title": "我的流行歌单",
      "description": "精选流行歌曲",
      "cover_image_url": "https://p1.music.126.net/xxx.jpg",
      "tags": "流行,经典",
      "track_count": 42,
      "view_count": 256,
      "created_at": "2026-01-15T08:30:00"
    }
  ],
  "total": 5,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

---

## 3. 获取歌单详情

获取单个歌单的详细信息，包含歌曲列表。每次访问自动增加浏览次数。

**请求**

```
GET /api/v1/music/playlists/{playlist_id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `playlist_id` | int | 歌单ID |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | int | 否 | 1 | 歌曲页码 |
| `size` | int | 否 | 50 | 每页歌曲数（1-200） |

**响应**

```json
{
  "id": 1,
  "title": "我的流行歌单",
  "description": "精选流行歌曲",
  "cover_image_url": "https://p1.music.126.net/xxx.jpg",
  "tags": "流行,经典",
  "track_count": 42,
  "view_count": 257,
  "created_at": "2026-01-15T08:30:00",
  "tracks": [
    {
      "id": 10,
      "title": "晴天",
      "artist": "周杰伦",
      "album": "叶惠美",
      "cover_image_url": "https://p1.music.126.net/xxx.jpg",
      "duration": 269,
      "year": 2003,
      "genre": "流行",
      "category": "pop",
      "tags": "华语,经典",
      "status": "completed",
      "play_count": 15,
      "rating": 9.5,
      "is_favorite": true,
      "netease_id": "186016"
    }
  ],
  "total_tracks": 42,
  "total_duration": 12480
}
```

> **注意**：`total_duration` 单位为秒，前端可自行转换为 `xx小时xx分钟` 格式。

---

## 4. 获取歌单内歌曲列表

单独获取某歌单内的歌曲，支持分页和多种筛选。

**请求**

```
GET /api/v1/music/playlists/{playlist_id}/tracks
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `playlist_id` | int | 歌单ID |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `category` | string | 否 | - | 分类筛选，见[枚举值](#11-枚举值说明) |
| `tags` | string | 否 | - | 标签筛选，逗号分隔 |
| `status` | string | 否 | - | 状态筛选，见[枚举值](#11-枚举值说明) |
| `page` | int | 否 | 1 | 页码 |
| `size` | int | 否 | 20 | 每页数量（1-100） |

**响应**

```json
{
  "items": [
    {
      "id": 10,
      "title": "晴天",
      "artist": "周杰伦",
      "album": "叶惠美",
      "cover_image_url": "https://p1.music.126.net/xxx.jpg",
      "duration": 269,
      "year": 2003,
      "genre": "流行",
      "category": "pop",
      "tags": "华语,经典",
      "status": "completed",
      "play_count": 15,
      "rating": 9.5,
      "is_favorite": true,
      "netease_id": "186016"
    }
  ],
  "total": 42,
  "page": 1,
  "size": 20,
  "pages": 3
}
```

---

## 5. 获取歌曲详情

获取单首歌曲的详细信息。

**请求**

```
GET /api/v1/music/tracks/{track_id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `track_id` | int | 歌曲ID |

**响应**

```json
{
  "id": 10,
  "title": "晴天",
  "artist": "周杰伦",
  "album": "叶惠美",
  "cover_image_url": "https://p1.music.126.net/xxx.jpg",
  "duration": 269,
  "year": 2003,
  "genre": "流行",
  "category": "pop",
  "tags": "华语,经典",
  "status": "completed",
  "play_count": 15,
  "rating": 9.5,
  "is_favorite": true,
  "netease_id": "186016"
}
```

---

## 6. 获取播放器代码

获取网易云音乐 iframe 嵌入播放器代码，可直接插入页面使用。

**请求**

```
GET /api/v1/music/tracks/{track_id}/player
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `track_id` | int | 歌曲ID |

**响应**

```json
{
  "iframe_code": "<iframe src=\"https://music.163.com/outchain/player?type=2&id=186016&auto=0&height=66\" width=\"100%\" height=\"86\" frameborder=\"no\" marginwidth=\"0\" marginheight=\"0\"></iframe>"
}
```

**前端使用示例**

```javascript
async function loadPlayer(trackId, containerId) {
  const res = await fetch(`/api/v1/music/tracks/${trackId}/player`);
  const data = await res.json();
  document.getElementById(containerId).innerHTML = data.iframe_code;
}
```

---

## 7. 获取歌词

获取歌曲的歌词内容（LRC 格式）。

**请求**

```
GET /api/v1/music/tracks/{track_id}/lyrics
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `track_id` | int | 歌曲ID |

**响应**

```json
{
  "lyrics": "[00:00.00] 作词 : 周杰伦\n[00:01.00] 作曲 : 周杰伦\n[00:18.66] 故事的小黄花\n...",
  "message": "获取歌词成功"
}
```

> 如果暂无歌词，`lyrics` 为 `null`，`message` 为 `"暂无歌词"`。

---

## 8. 随机推荐歌曲

从所有公开歌单中随机抽取歌曲，适用于「猜你喜欢」等场景。

**请求**

```
GET /api/v1/music/tracks/random
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `count` | int | 否 | 5 | 推荐数量（1-20） |

**响应**

```json
[
  {
    "id": 25,
    "title": "夜曲",
    "artist": "周杰伦",
    "album": "十一月的萧邦",
    "cover_image_url": "https://p1.music.126.net/xxx.jpg",
    "duration": 225,
    "year": 2005,
    "genre": "流行",
    "category": "pop",
    "tags": "华语",
    "status": "listening",
    "play_count": 8,
    "rating": 9.0,
    "is_favorite": true,
    "netease_id": "185809"
  }
]
```

> 返回值为数组，每次调用结果随机不同。

---

## 9. 音乐馆统计数据

获取音乐馆的全局统计信息，可用于前端展示概要或仪表盘。

**请求**

```
GET /api/v1/music/stats
```

**参数**：无

**响应**

```json
{
  "total_playlists": 5,
  "total_tracks": 128,
  "total_play_count": 1024,
  "favorite_count": 32,
  "category_stats": [
    { "category": "pop", "count": 45 },
    { "category": "rock", "count": 30 },
    { "category": "jazz", "count": 15 },
    { "category": "electronic", "count": 20 },
    { "category": "folk", "count": 18 }
  ],
  "status_stats": [
    { "status": "unplayed", "count": 50 },
    { "status": "listening", "count": 28 },
    { "status": "completed", "count": 40 },
    { "status": "disliked", "count": 10 }
  ]
}
```

---

## 10. 数据模型定义

### Playlist（歌单）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 歌单ID |
| `title` | string | 歌单标题 |
| `description` | string \| null | 歌单描述 |
| `cover_image_url` | string \| null | 封面图片URL |
| `tags` | string \| null | 标签，逗号分隔 |
| `track_count` | int | 歌曲数量 |
| `view_count` | int | 浏览次数 |
| `created_at` | string (datetime) | 创建时间，ISO 8601格式 |

### Track（歌曲）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 歌曲ID |
| `title` | string | 歌曲标题 |
| `artist` | string | 艺术家 |
| `album` | string \| null | 专辑名 |
| `cover_image_url` | string \| null | 封面图片URL |
| `duration` | int \| null | 时长（秒） |
| `year` | int \| null | 发行年份 |
| `genre` | string \| null | 流派 |
| `category` | string | 分类，见枚举值 |
| `tags` | string \| null | 标签，逗号分隔 |
| `status` | string | 状态，见枚举值 |
| `play_count` | int | 播放次数 |
| `rating` | float \| null | 评分（1.0-10.0） |
| `is_favorite` | bool | 是否收藏 |
| `netease_id` | string | 网易云歌曲ID |

### PlaylistDetail（歌单详情）

继承 Playlist 所有字段，额外包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `tracks` | Track[] | 歌曲列表（分页） |
| `total_tracks` | int | 歌曲总数 |
| `total_duration` | int | 总时长（秒） |

---

## 11. 枚举值说明

### 歌曲分类（category）

| 值 | 说明 |
|------|------|
| `pop` | 流行 |
| `rock` | 摇滚 |
| `jazz` | 爵士 |
| `classical` | 古典 |
| `electronic` | 电子 |
| `hip_hop` | 嘻哈 |
| `country` | 乡村 |
| `blues` | 蓝调 |
| `folk` | 民谣 |
| `r_and_b` | R&B |
| `other` | 其他 |

### 歌曲状态（status）

| 值 | 说明 |
|------|------|
| `unplayed` | 未听 |
| `listening` | 在听 |
| `completed` | 已听完 |
| `disliked` | 不喜欢 |

---

## 12. 错误响应

所有接口在出错时返回统一的错误格式：

```json
{
  "detail": "歌单不存在"
}
```

### 常见状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 成功 |
| `404` | 资源不存在（歌单或歌曲不存在 / 不是公开歌单） |
| `422` | 参数校验失败（如 page < 1） |
| `500` | 服务器内部错误 |

---

## 前端集成建议

### 1. 音乐馆首页

```
GET /api/v1/music/
```
一个请求获取所有首页数据，避免多次请求。

### 2. 歌单列表页

```
GET /api/v1/music/playlists?page=1&size=12
```

### 3. 歌单详情页

```
GET /api/v1/music/playlists/{id}?page=1&size=50
```
包含歌曲列表，支持加载更多。

### 4. 歌曲筛选

```
GET /api/v1/music/playlists/{id}/tracks?category=pop&status=completed&page=1
```

### 5. 播放器嵌入

```javascript
// 方式一：iframe 嵌入
const { iframe_code } = await fetch(`/api/v1/music/tracks/${id}/player`).then(r => r.json());
playerContainer.innerHTML = iframe_code;

// 方式二：使用 netease_id 自行构建播放器
const neteaseId = track.netease_id;
const playerUrl = `https://music.163.com/outchain/player?type=2&id=${neteaseId}&auto=0&height=66`;
```

### 6. 时长格式化

```javascript
function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
```

### 7. 标签解析

```javascript
function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
}
```
