# 技能管理API使用指南

## 概述

本API提供了技能管理功能，包括技能的创建、查询、更新和删除，以及技能学习时间段的记录。系统会根据学习时间自动计算技能等级。

## 技能等级说明

- **入门 (BEGINNER)**: 学习天数 < 30天
- **初级 (JUNIOR)**: 30天 ≤ 学习天数 < 90天
- **中级 (INTERMEDIATE)**: 90天 ≤ 学习天数 < 365天
- **高级 (SENIOR)**: 学习天数 ≥ 365天

## 技能类别

系统支持以下技能类别：
- **前端开发** (FRONTEND)
- **后端开发** (BACKEND)
- **数据库** (DATABASE)
- **开发工具** (DEV_TOOLS)
- **其他技能** (OTHER)

## API端点

### 1. 获取技能列表

**请求**: `GET /api/v1/skills`

**查询参数**:
- `skip` (可选): 跳过的记录数，默认为0
- `limit` (可选): 返回的记录数，默认为100
- `category` (可选): 按类别筛选

**响应**: 技能对象数组

**示例**:
```bash
# 获取所有技能
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/skills

# 按类别筛选
curl -H "Authorization: Bearer {token}" "http://localhost:8000/api/v1/skills?category=后端开发"
```

### 2. 创建新技能

**请求**: `POST /api/v1/skills`

**请求体**:
```json
{
  "name": "Java",
  "category": "后端开发",
  "description": "Java编程语言，主要用于企业级应用开发"
}
```

**响应**: 创建的技能对象

**示例**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Java",
    "category": "后端开发",
    "description": "Java编程语言，主要用于企业级应用开发"
  }' \
  http://localhost:8000/api/v1/skills
```

### 3. 获取技能详情

**请求**: `GET /api/v1/skills/{skill_id}`

**响应**: 包含学习时间段的技能详情

**示例**:
```bash
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/skills/1
```

### 4. 更新技能

**请求**: `PUT /api/v1/skills/{skill_id}`

**请求体**:
```json
{
  "name": "Java Advanced",
  "category": "后端开发",
  "description": "Java高级编程和企业级应用开发",
  "current_level": "高级"
}
```

**响应**: 更新后的技能对象

**示例**:
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Java Advanced",
    "category": "后端开发",
    "description": "Java高级编程和企业级应用开发"
  }' \
  http://localhost:8000/api/v1/skills/1
```

### 5. 删除技能

**请求**: `DELETE /api/v1/skills/{skill_id}`

**响应**: 被删除的技能对象

**示例**:
```bash
curl -X DELETE -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/skills/1
```

## 技能学习时间段管理

### 1. 获取技能的学习时间段

**请求**: `GET /api/v1/skills/{skill_id}/periods`

**查询参数**:
- `skip` (可选): 跳过的记录数，默认为0
- `limit` (可选): 返回的记录数，默认为100

**响应**: 学习时间段对象数组

**示例**:
```bash
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/skills/1/periods
```

### 2. 添加学习时间段

**请求**: `POST /api/v1/skills/{skill_id}/periods`

**请求体**:
```json
{
  "start_date": "2023-01-01T00:00:00",
  "end_date": "2023-06-30T00:00:00",
  "notes": "Java基础学习"
}
```

**注意**: 
- `end_date` 可以为空，表示至今
- 系统会自动计算技能总学习天数并更新技能等级

**示例**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "start_date": "2023-01-01T00:00:00",
    "end_date": "2023-06-30T00:00:00",
    "notes": "Java基础学习"
  }' \
  http://localhost:8000/api/v1/skills/1/periods
```

### 3. 更新学习时间段

**请求**: `PUT /api/v1/skills/{skill_id}/periods/{period_id}`

**请求体**:
```json
{
  "start_date": "2023-01-01T00:00:00",
  "end_date": "2023-07-30T00:00:00",
  "notes": "Java基础和进阶学习"
}
```

**响应**: 更新后的学习时间段对象

### 4. 删除学习时间段

**请求**: `DELETE /api/v1/skills/{skill_id}/periods/{period_id}`

**响应**: 被删除的学习时间段对象

### 5. 一键添加从指定日期到当前时间的时段

**请求**: `POST /api/v1/skills/{skill_id}/periods/current`

**请求参数**:
- `start_date` (必需): 开始时间，ISO格式
- `notes` (可选): 备注

**示例**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "start_date": "2023-01-01T00:00:00",
    "notes": "持续学习中"
  }' \
  http://localhost:8000/api/v1/skills/1/periods/current
```

## 技能统计

### 获取技能统计信息

**请求**: `GET /api/v1/skills/stats`

**响应**:
```json
{
  "total_skills": 8,
  "skills_by_category": {
    "前端开发": 2,
    "后端开发": 2,
    "数据库": 2,
    "开发工具": 2,
    "其他技能": 0
  },
  "skills_by_level": {
    "入门": 0,
    "初级": 0,
    "中级": 1,
    "高级": 7
  },
  "total_learning_days": 15658
}
```

**示例**:
```bash
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/skills/stats
```

## 认证

所有技能API端点都需要通过Bearer Token进行认证。在请求头中添加：

```
Authorization: Bearer {your_token_here}
```

## 示例数据

系统已预置了以下示例技能数据：

1. **Java** (后端开发) - 高级
   - 2023-01-01 至 2023-06-30: Java基础学习
   - 2023-07-01 至 2023-12-31: Spring框架学习

2. **Python** (后端开发) - 高级
   - 2022-06-01 至 2022-12-31: Python基础学习
   - 2023-01-01 至今: 数据分析和AI应用开发

3. **React** (前端开发) - 高级
   - 2023-03-01 至 2023-08-31: React基础和组件开发

4. **Vue.js** (前端开发) - 高级
   - 2022-09-01 至 2023-02-28: Vue.js基础学习
   - 2023-03-01 至今: Vue项目实战

5. **MySQL** (数据库) - 高级
   - 2022-01-01 至 2022-06-30: SQL基础
   - 2022-07-01 至今: 高级查询和优化

6. **Redis** (数据库) - 中级
   - 2023-02-01 至 2023-05-31: Redis基础学习

7. **Git** (开发工具) - 高级
   - 2021-06-01 至 2021-12-31: Git基础使用
   - 2022-01-01 至今: Git高级使用

8. **Docker** (开发工具) - 高级
   - 2023-04-01 至今: Docker容器化部署

## 注意事项

1. 技能名称在同一系统中必须唯一
2. 学习时间段的开始时间不能晚于结束时间
3. 系统会自动计算技能总学习天数并更新技能等级
4. 删除技能会同时删除其所有学习时间段
5. API遵循RESTful设计原则