# MD文件元数据解析功能指南

## 功能概述

本系统现在支持自动解析MD文件的front-matter元数据，并将其存储到数据库中。这使得前端可以更快速地获取文件元数据，而无需下载和解析整个文件。

## 支持的元数据字段

系统支持以下front-matter元数据字段：

| 字段名 | 类型 | 说明 | 存储到数据库的字段 |
|--------|------|------|------------------|
| title | 字符串 | 文章标题 | title |
| description | 字符串 | 文章描述 | description |
| tags | 数组/字符串 | 标签列表 | tags |
| published | 日期 | 发布日期 | published |
| category | 字符串 | 文章分类 | category |
| pinned | 布尔值 | 是否置顶 | pinned |
| encrypted | 布尔值 | 是否加密 | encrypted |
| author | 字符串 | 作者 | author |
| date | 日期 | 发布日期（别名） | published |
| created | 日期 | 发布日期（别名） | published |
| summary | 字符串 | 文章摘要（别名） | description |

## 使用方法

### 1. 创建带有元数据的MD文件

在MD文件的顶部添加YAML格式的front-matter：

```yaml
---
title: 我的文章标题
description: 这是一篇关于元数据解析的文章
tags: [技术, 元数据, Markdown]
published: 2023-12-18
category: 技术文章
pinned: true
author: 张三
---

# 文章正文

这里是文章的正文内容...
```

### 2. 上传文件

可以通过API上传带有元数据的MD文件：

```python
import requests

file_data = {
    "title": "API上传测试文档",
    "description": "通过API上传的测试文档",
    "content": "MD文件内容...",
    "filename": "test.md",
    "tags": "api,测试",
    "is_public": True
}

response = requests.post('http://your-server/api/v1/md-files/', json=file_data)
```

### 3. 获取文件元数据

API响应中现在包含了完整的元数据信息：

```json
{
  "id": 1,
  "title": "文章标题",
  "description": "文章描述",
  "tags": "标签1,标签2,标签3",
  "published": "2023-12-18",
  "category": "技术文章",
  "pinned": true,
  "encrypted": false,
  "author": "张三",
  "parsed_metadata": {
    "title": "文章标题",
    "description": "文章描述",
    "tags": "标签1,标签2,标签3",
    "published": "2023-12-18",
    "category": "技术文章",
    "pinned": true,
    "author": "张三"
  }
}
```

## 批量处理已有文件

如果已有MD文件没有解析元数据，可以使用批量处理脚本：

```bash
# 查看统计信息
python scripts/batch_process_md_metadata.py stats

# 批量处理所有文件
python scripts/batch_process_md_metadata.py batch

# 重置所有文件的元数据
python scripts/batch_process_md_metadata.py reset

# 重置指定文件的元数据
python scripts/batch_process_md_metadata.py reset <file_id>
```

## API变更

### 新增字段

以下字段已添加到MDFile模型和API响应中：

- `published`: 发布日期
- `category`: 文章分类
- `pinned`: 是否置顶
- `encrypted`: 是否加密
- `author`: 作者
- `parsed_metadata`: 完整的解析元数据（JSON格式）

### 兼容性

所有现有API保持向后兼容，新添加的字段都是可选的。现有文件不受影响，新上传的文件将自动解析元数据。

## 技术实现

### 1. 依赖库

- `python-frontmatter==1.0.0`: 用于解析front-matter

### 2. 核心模块

- `app/services/md_metadata_parser.py`: 元数据解析器
- `app/services/md_metadata_service.py`: 元数据处理服务
- `app/models/md_file.py`: 更新了数据库模型
- `app/schemas/md_file.py`: 更新了API响应模型

### 3. 数据库变更

为`md_files`表添加了以下字段：

```sql
ALTER TABLE md_files ADD COLUMN published DATE;
ALTER TABLE md_files ADD COLUMN category VARCHAR(100);
ALTER TABLE md_files ADD COLUMN pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE md_files ADD COLUMN encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE md_files ADD COLUMN author VARCHAR(100);
ALTER TABLE md_files ADD COLUMN parsed_metadata JSON;
```

## 注意事项

1. 元数据必须是有效的YAML格式
2. 日期字段支持多种格式，推荐使用`YYYY-MM-DD`格式
3. 标签可以是数组或逗号分隔的字符串
4. 布尔值支持`true/false`、`yes/no`、`1/0`等多种格式
5. 元数据字段的值将覆盖表单中对应的字段值

## 故障排除

### 常见问题

1. **元数据没有被解析**
   - 确保front-matter格式正确，以`---`开始和结束
   - 检查YAML语法是否正确

2. **日期解析失败**
   - 确保日期格式正确，推荐使用`YYYY-MM-DD`
   - 避免使用不常见的日期格式

3. **标签格式问题**
   - 标签可以是数组（`[tag1, tag2]`）或逗号分隔的字符串（`tag1, tag2`）
   - 避免在标签中使用特殊字符

### 日志查看

系统日志中包含元数据解析的详细信息，可以通过日志排查问题：

```bash
# 查看应用日志
tail -f app.log | grep metadata
```

## 未来扩展

未来可以考虑的功能扩展：

1. 支持更多元数据字段
2. 支持元数据搜索和过滤
3. 提供元数据验证功能
4. 支持自定义元数据处理规则