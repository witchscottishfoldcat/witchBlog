# 音乐馆 API 使用指南

## 功能概述

音乐馆功能基于网易云音乐 API，支持歌单导入、歌曲管理、播放器集成等功能。

## API 端点

### 音乐库管理

- `GET /api/v1/music-libraries/` - 获取音乐库列表
- `GET /api/v1/music-libraries/list` - 分页获取音乐库列表
- `GET /api/v1/music-libraries/{library_id}` - 获取音乐库详情
- `POST /api/v1/music-libraries/` - 创建音乐库
- `POST /api/v1/music-libraries/import-from-netease` - 从网易云导入歌单
- `PUT /api/v1/music-libraries/{library_id}` - 更新音乐库
- `DELETE /api/v1/music-libraries/{library_id}` - 删除音乐库
- `POST /api/v1/music-libraries/{library_id}/sync` - 同步网易云歌单

### 音乐曲目管理

- `GET /api/v1/music-tracks/` - 获取音乐曲目列表
- `GET /api/v1/music-tracks/list` - 分页获取音乐曲目列表
- `GET /api/v1/music-tracks/{track_id}` - 获取音乐曲目详情
- `POST /api/v1/music-tracks/` - 创建音乐曲目
- `PUT /api/v1/music-tracks/{track_id}` - 更新音乐曲目
- `DELETE /api/v1/music-tracks/{track_id}` - 删除音乐曲目
- `GET /api/v1/music-tracks/{track_id}/lyrics` - 获取歌词
- `GET /api/v1/music-tracks/{track_id}/player` - 获取播放器代码
- `POST /api/v1/music-tracks/{track_id}/play` - 记录播放

### 特殊查询

- `GET /api/v1/music-tracks/favorites` - 获取收藏的歌曲
- `GET /api/v1/music-tracks/unplayed` - 获取未听的歌曲
- `GET /api/v1/music-tracks/listening` - 获取在听的歌曲
- `GET /api/v1/music-tracks/completed` - 获取已听完的歌曲

## 使用示例

### 1. 从网易云导入歌单

```bash
curl -X POST "http://localhost:8000/api/v1/music-libraries/import-from-netease" \
  -H "Content-Type: application/json" \
  -d '{
    "netease_playlist_id": "778462085",
    "title": "我的歌单",
    "description": "精选歌曲",
    "tags": "流行,经典",
    "is_public": true
  }'
```

### 2. 获取音乐库列表

```bash
curl "http://localhost:8000/api/v1/music-libraries/"
```

### 3. 获取音乐库详情（包含歌曲）

```bash
curl "http://localhost:8000/api/v1/music-libraries/1"
```

### 4. 获取歌曲详情

```bash
curl "http://localhost:8000/api/v1/music-tracks/1"
```

### 5. 获取播放器代码

```bash
curl "http://localhost:8000/api/v1/music-tracks/1/player"
```

响应示例：
```json
{
  "iframe_code": "<iframe src=\"https://music.163.com/outchain/player?type=2&id=123&auto=0&height=66\" width=\"100%\" height=\"86\" frameborder=\"no\" marginwidth=\"0\" marginheight=\"0\"></iframe>"
}
```

### 6. 获取歌词

```bash
curl "http://localhost:8000/api/v1/music-tracks/1/lyrics"
```

### 7. 更新歌曲状态

```bash
curl -X PUT "http://localhost:8000/api/v1/music-tracks/1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 8.5,
    "is_favorite": true
  }'
```

### 8. 同步歌单（从网易云更新）

```bash
curl -X POST "http://localhost:8000/api/v1/music-libraries/1/sync"
```

## 播放器集成

在前端使用播放器时，直接使用返回的 iframe 代码：

```html
<div id="player"></div>
<script>
fetch('/api/v1/music-tracks/1/player')
  .then(res => res.json())
  .then(data => {
    document.getElementById('player').innerHTML = data.iframe_code;
  });
</script>
```

## 数据模型

### MusicLibrary（音乐库）

- `id`: 音乐库 ID
- `title`: 歌单标题
- `description`: 歌单描述
- `netease_playlist_id`: 网易云歌单 ID
- `netease_url`: 网易云链接
- `cover_image_url`: 封面图片链接
- `tags`: 标签（逗号分隔）
- `is_public`: 是否公开
- `track_count`: 歌曲数量
- `view_count`: 浏览次数
- `created_at`: 创建时间
- `updated_at`: 更新时间

### MusicTrack（音乐曲目）

- `id`: 歌曲 ID
- `library_id`: 所属歌单 ID
- `title`: 歌曲标题
- `artist`: 艺术家
- `album`: 专辑名
- `netease_id`: 网易云歌曲 ID
- `netease_url`: 网易云链接
- `cover_image_url`: 封面图片链接
- `duration`: 时长（秒）
- `year`: 发行年份
- `genre`: 流派
- `category`: 分类（pop, rock, jazz, classical 等）
- `tags`: 标签（逗号分隔）
- `status`: 状态（unplayed, listening, completed, disliked）
- `play_count`: 播放次数
- `rating`: 评分（1-10）
- `is_favorite`: 是否收藏
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 状态说明

### 歌曲状态
- `unplayed`: 未听
- `listening`: 在听
- `completed`: 已听完
- `disliked`: 不喜欢

### 分类
- `pop`: 流行
- `rock`: 摇滚
- `jazz`: 爵士
- `classical`: 古典
- `electronic`: 电子
- `hip_hop`: 嘻哈
- `country`: 乡村
- `blues`: 蓝调
- `folk`: 民谣
- `r_and_b`: R&B
- `other`: 其他

## 配置

网易云音乐 API 配置在 `app/core/config.py` 中：

```python
NETEASE_API_BASE = "http://localhost:3000"  # 网易云 API 服务地址
NETEASE_API_TIMEOUT = 30  # 请求超时时间（秒）
```

## 数据库

已创建的表：
- `music_libraries`: 音乐库表
- `music_tracks`: 音乐曲目表

## 前端集成建议

1. 使用 `/api/v1/music-tracks/{track_id}/player` 获取播放器代码
2. 使用 `/api/v1/music-tracks/{track_id}/lyrics` 获取歌词
3. 使用 `/api/v1/music-tracks/{track_id}/play` 记录播放
4. 使用 `/api/v1/music-libraries/{library_id}/sync` 同步歌单更新

---

## 前台展示接口（博客前端专用）

> 前台接口前缀：`/api/v1/music`，仅提供只读访问，自动过滤只返回公开歌单。

### 端点列表

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/music/` | GET | 音乐馆首页概览（统计 + 歌单 + 最近歌曲） |
| `/api/v1/music/playlists` | GET | 获取公开歌单列表（分页） |
| `/api/v1/music/playlists/{id}` | GET | 获取歌单详情 + 歌曲列表（自增浏览量） |
| `/api/v1/music/playlists/{id}/tracks` | GET | 获取歌单内歌曲（分页、筛选） |
| `/api/v1/music/tracks/random` | GET | 随机推荐歌曲 |
| `/api/v1/music/tracks/{id}` | GET | 获取歌曲详情 |
| `/api/v1/music/tracks/{id}/player` | GET | 获取播放器 iframe 代码 |
| `/api/v1/music/tracks/{id}/lyrics` | GET | 获取歌词 |
| `/api/v1/music/stats` | GET | 音乐馆统计数据 |

### 使用示例

#### 获取音乐馆首页概览

```bash
curl "http://localhost:8000/api/v1/music/"
```

响应包含 `stats`（统计数据）、`playlists`（歌单列表）、`recent_tracks`（最近歌曲）。

#### 获取公开歌单列表

```bash
curl "http://localhost:8000/api/v1/music/playlists?page=1&size=10"
```

#### 获取歌单详情

```bash
curl "http://localhost:8000/api/v1/music/playlists/1"
```

#### 随机推荐歌曲

```bash
curl "http://localhost:8000/api/v1/music/tracks/random?count=5"
```

#### 获取播放器代码

```bash
curl "http://localhost:8000/api/v1/music/tracks/1/player"
```

### 前台 vs 后台接口对比

| 特性 | 后台管理接口 (`/music-libraries`, `/music-tracks`) | 前台展示接口 (`/music`) |
|------|------|------|
| 操作类型 | 增删改查 | 仅查询 |
| 数据范围 | 所有歌单（含未公开） | 仅公开且启用的歌单 |
| 返回字段 | 完整字段 | 精简字段（隐藏管理字段） |
| 特殊功能 | 导入/同步网易云 | 随机推荐、统计概览 |
| 浏览计数 | 无 | 自动增加浏览次数 |

