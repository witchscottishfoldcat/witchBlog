# 测试技能与项目关联功能

## API端点测试

### 1. 获取技能列表（包含项目信息）
```bash
GET /api/v1/skills/?include_projects=true
```
返回所有技能，每个技能包含相关项目列表和项目数量。

### 2. 获取技能详情（包含项目信息）
```bash
GET /api/v1/skills/{skill_id}?include_projects=true
```
返回指定技能的详细信息，包含相关项目列表和项目数量。

### 3. 获取技能相关项目列表
```bash
GET /api/v1/skills/{skill_id}/projects
```
返回与指定技能相关的项目列表。

## 功能说明

1. **项目关联逻辑**：
   - 基于技能名称与项目语言的匹配关系
   - 支持精确匹配（技能名称完全等于项目语言）
   - 支持包含匹配（技能名称包含在项目语言中）

2. **响应数据结构**：
   - 每个技能对象包含 `related_projects` 字段（相关项目列表）
   - 每个技能对象包含 `project_count` 字段（相关项目数量）

## 测试结果

1. **Java技能**：
   - 关联项目：1个（example-project）
   - 匹配逻辑：技能名称"Java"与项目主要语言"Java"精确匹配

2. **其他技能**（Python、React、Vue.js等）：
   - 关联项目：0个
   - 原因：当前数据库中没有使用这些语言的项目

## 示例响应

```json
{
  "name": "Java",
  "category": "后端开发",
  "description": "Java编程语言",
  "id": 1,
  "total_learning_days": 730,
  "current_level": "高级",
  "created_at": "2025-12-09T07:33:19",
  "updated_at": "2025-12-09T07:35:07",
  "periods": [],
  "related_projects": [
    {
      "id": 1,
      "name": "example-project",
      "description": "一个rbac的dome",
      "url": "https://github.com/example-user/example-project",
      "platform": "github",
      "tag": "进行中",
      "avatar_url": "",
      "stars_count": 2,
      "forks_count": 2,
      "language_stats": {
        "languages": [
          {
            "language": "Java",
            "percentage": 99.91,
            "bytes_count": 114639
          }
        ],
        "total_languages": 2,
        "dominant_language": "Java"
      }
    }
  ],
  "project_count": 1
}
```