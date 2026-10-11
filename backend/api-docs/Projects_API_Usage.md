# 项目展示API使用指南

## 概述

项目展示API提供了一套完整的接口，用于管理从GitHub和Gitee平台获取的项目信息。支持自动提取项目名称、简介、语言统计、平台信息，并允许为项目添加状态标签。

## 功能特点

- 支持GitHub和Gitee项目自动解析
- 自动提取项目名称、描述、语言统计等信息
- 支持项目状态标签：策划中、已完成、进行中、已弃坑
- 提供项目列表筛选和搜索功能
- 支持项目信息手动刷新，获取最新数据

## API端点

### 1. 创建项目记录

**POST** `/api/v1/projects/`

自动从项目URL提取信息并创建记录。

#### 请求参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| project_url | string | 是 | - | GitHub或Gitee项目URL |
| tag | string | 否 | "策划中" | 项目状态标签 |

#### 示例请求

```bash
curl -X POST "http://localhost:8000/api/v1/projects/" \
  -H "Content-Type: application/json" \
  -d '{
    "project_url": "https://github.com/example-user/example-project",
    "tag": "已完成"
  }'
```

#### 响应示例

```json
{
  "id": 1,
  "name": "example-project",
  "description": "一个rbac的dome",
  "url": "https://github.com/example-user/example-project",
  "platform": "github",
  "tag": "已完成",
  "avatar_url": "https://avatars.githubusercontent.com/u/...",
  "stars_count": 42,
  "forks_count": 15,
  "owner": "example-user",
  "repository_name": "example-project",
  "language_stats": {
    "total_languages": 2,
    "languages": [
      {
        "language": "Java",
        "bytes_count": 123456,
        "percentage": 99.9
      },
      {
        "language": "HTML",
        "bytes_count": 123,
        "percentage": 0.1
      }
    ],
    "dominant_language": "Java"
  },
  "created_at": "2023-12-09T10:30:00Z",
  "updated_at": "2023-12-09T10:30:00Z",
  "languages": [
    {
      "language": "Java",
      "percentage": 99.9,
      "bytes_count": 123456
    },
    {
      "language": "HTML",
      "percentage": 0.1,
      "bytes_count": 123
    }
  ]
}
```

### 2. 获取项目列表

**GET** `/api/v1/projects/`

获取项目列表，支持筛选和搜索。

#### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| skip | integer | 否 | 0 | 跳过记录数 |
| limit | integer | 否 | 100 | 返回记录数 |
| platform | string | 否 | - | 筛选平台：github/gitee |
| tag | string | 否 | - | 筛选项目状态标签 |
| language | string | 否 | - | 筛选特定编程语言的项目 |
| search | string | 否 | - | 搜索项目名称、描述或所有者 |

#### 示例请求

```bash
# 获取所有项目
curl "http://localhost:8000/api/v1/projects/"

# 获取GitHub平台的项目
curl "http://localhost:8000/api/v1/projects/?platform=github"

# 获取已完成的Java项目
curl "http://localhost:8000/api/v1/projects/?tag=已完成&language=Java"

# 搜索包含"RBAC"的项目
curl "http://localhost:8000/api/v1/projects/?search=RBAC"
```

### 3. 获取单个项目详情

**GET** `/api/v1/projects/{project_id}`

获取指定项目的详细信息。

#### 示例请求

```bash
curl "http://localhost:8000/api/v1/projects/1"
```

### 4. 更新项目信息

**PUT** `/api/v1/projects/{project_id}`

更新项目信息，目前支持更新项目状态标签。

#### 请求参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| tag | string | 否 | - | 项目状态标签 |

#### 示例请求

```bash
curl -X PUT "http://localhost:8000/api/v1/projects/1" \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "进行中"
  }'
```

### 5. 删除项目

**DELETE** `/api/v1/projects/{project_id}`

删除指定项目及其所有相关数据。

#### 示例请求

```bash
curl -X DELETE "http://localhost:8000/api/v1/projects/1"
```

### 6. 刷新项目信息

**POST** `/api/v1/projects/refresh/{project_id}`

重新从远程获取项目最新信息并更新记录。

#### 示例请求

```bash
curl -X POST "http://localhost:8000/api/v1/projects/refresh/1"
```

### 7. 获取平台统计

**GET** `/api/v1/projects/stats/platform`

获取各平台项目数量统计。

#### 示例请求

```bash
curl "http://localhost:8000/api/v1/projects/stats/platform"
```

#### 响应示例

```json
[
  {
    "platform": "github",
    "count": 5
  },
  {
    "platform": "gitee",
    "count": 3
  }
]
```

### 8. 获取标签统计

**GET** `/api/v1/projects/stats/tag`

获取各标签项目数量统计。

#### 示例请求

```bash
curl "http://localhost:8000/api/v1/projects/stats/tag"
```

#### 响应示例

```json
[
  {
    "tag": "已完成",
    "count": 4
  },
  {
    "tag": "进行中",
    "count": 2
  },
  {
    "tag": "策划中",
    "count": 2
  }
]
```

### 9. 获取语言统计

**GET** `/api/v1/projects/stats/language`

获取使用最多的编程语言统计。

#### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| limit | integer | 否 | 10 | 返回记录数 |

#### 示例请求

```bash
curl "http://localhost:8000/api/v1/projects/stats/language?limit=5"
```

#### 响应示例

```json
[
  {
    "language": "Java",
    "total_percentage": 245.5,
    "project_count": 3
  },
  {
    "language": "JavaScript",
    "total_percentage": 168.1,
    "project_count": 2
  },
  {
    "language": "Python",
    "total_percentage": 99.8,
    "project_count": 1
  }
]
```

## 项目状态标签

系统支持以下项目状态标签：

- `策划中` - 项目处于规划和设计阶段
- `已完成` - 项目已全部完成并可投入使用
- `进行中` - 项目正在积极开发中
- `已弃坑` - 项目已停止开发或废弃

## 数据库表结构

### project_info 表

存储项目基本信息：

| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键ID |
| name | VARCHAR(255) | 项目名称 |
| description | TEXT | 项目简介/描述 |
| url | VARCHAR(500) | 项目链接（唯一） |
| platform | VARCHAR(50) | 平台：github/gitee |
| tag | VARCHAR(50) | 项目状态标签 |
| avatar_url | VARCHAR(500) | 项目头像URL |
| stars_count | INTEGER | 星标数 |
| forks_count | INTEGER | 复刻数 |
| language_stats | JSON | 语言统计JSON数据 |
| owner | VARCHAR(255) | 项目所有者 |
| repository_name | VARCHAR(255) | 仓库名称 |
| is_private | INTEGER | 是否私有仓库 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### project_language 表

存储项目语言统计详情：

| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键ID |
| project_id | INTEGER | 项目ID（外键） |
| language | VARCHAR(100) | 编程语言名称 |
| bytes_count | INTEGER | 该语言的字节数 |
| percentage | FLOAT | 该语言的百分比 |
| color | VARCHAR(20) | 语言对应的颜色代码 |

## 使用场景

1. **开发者作品集展示**：记录个人在GitHub和Gitee上的所有项目
2. **团队项目跟踪**：跟踪团队项目状态和语言分布
3. **技术栈分析**：分析个人或团队的技术栈偏好
4. **项目进度管理**：通过标签管理不同项目的开发状态
5. **开源贡献展示**：展示参与的开源项目及贡献情况

## 注意事项

1. 项目URL必须是GitHub或Gitee的有效公开仓库链接
2. 系统会自动提取项目信息，但提取过程可能受网络状况影响
3. 建议定期使用刷新接口更新项目信息，获取最新的星标数和语言统计
4. 私有仓库可能无法获取完整信息
5. 语言统计基于仓库分析，可能存在微小误差