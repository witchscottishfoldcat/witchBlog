# 归档文件元数据支持

本文档描述了为MD文件归档功能添加的元数据支持。

## 概述

为了保持与MD文件的一致性，我们为归档文件添加了相同的元数据字段支持。这使得即使文件被归档，其元数据信息也能被保留和访问。

## 新增字段

在 `md_files_archive` 表中添加了以下字段：

| 字段名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| published | BOOLEAN | 是否发布 | FALSE |
| category | VARCHAR(100) | 文件分类 | NULL |
| pinned | BOOLEAN | 是否置顶 | FALSE |
| encrypted | BOOLEAN | 是否加密 | FALSE |
| author | VARCHAR(100) | 作者 | NULL |
| parsed_metadata | JSON | 完整元数据JSON | NULL |

## 实现细节

### 1. 模型更新

- 更新了 `app/models/md_file_archive.py` 中的 MDFileArchive 模型，添加了元数据字段
- 更新了 `app/schemas/md_file_archive.py` 中的 Pydantic 模型，确保 API 响应包含新字段

### 2. 服务更新

- 更新了 `app/services/md_file_archive.py` 中的归档服务，使其在归档文件时解析并保存元数据
- 集成了 MDMetadataParser 和 MDMetadataService 来处理元数据解析和存储

### 3. 数据库迁移

- 创建了 Alembic 迁移文件 `9d038d466e5c_add_metadata_fields_to_md_file_archive.py`
- 手动执行了 SQL 更新以确保所有字段正确添加

### 4. 批量处理

- 创建了 `scripts/batch_process_archive_metadata.py` 脚本，用于处理已有归档文件的元数据
- 该脚本从 MinIO 获取归档文件内容，解析元数据，并更新数据库记录

## 使用方式

### 归档文件时

当用户归档 MD 文件时，系统会：

1. 获取原始文件内容
2. 解析 front-matter 元数据
3. 将元数据字段保存到归档记录中
4. 将完整的元数据以 JSON 格式存储在 `parsed_metadata` 字段中

### API 访问

归档文件 API 现在会自动包含元数据字段：

```json
{
  "id": 1,
  "title": "Test",
  "published": true,
  "category": "Examples",
  "pinned": false,
  "encrypted": false,
  "author": null,
  "parsed_metadata": {
    "title": "Markdown Extended Features",
    "published": "2024-05-01",
    "description": "Read more about Markdown features in Mizuki",
    "tags": "Demo,Example,Markdown,mizuki",
    "category": "Examples",
    "draft": false
  }
}
```

## 注意事项

1. **日期处理**：元数据中的日期字段会被转换为 ISO 格式字符串存储在 JSON 字段中，但 `published` 字段会被转换为布尔值
2. **类型安全**：所有元数据字段在存储前都会进行类型转换，确保与数据库字段类型匹配
3. **批量处理**：已有归档文件的元数据需要通过批量处理脚本添加，不会自动生成

## 未来扩展

1. 可以添加基于元数据的归档文件搜索功能
2. 可以添加归档文件元数据的编辑功能
3. 可以添加归档文件元数据的导入/导出功能

## 相关文件

- `app/models/md_file_archive.py` - 归档文件模型
- `app/schemas/md_file_archive.py` - 归档文件 API 模式
- `app/services/md_file_archive.py` - 归档文件服务
- `scripts/batch_process_archive_metadata.py` - 批量处理脚本
- `alembic/versions/9d038d466e5c_add_metadata_fields_to_md_file_archive.py` - 数据库迁移