# 日记API使用指南

本文档介绍了如何使用日记API来创建、管理和展示带有图片的日记。

## 功能概述

- 支持创建、更新、删除和查询日记
- 支持日记文字内容的Markdown格式
- 支持上传和管理日记图片
- 支持公开/私有日记设置
- 支持天气、心情和标签分类

## API端点

### 1. 日记管理

#### 创建日记

```http
POST /api/v1/diaries/
Content-Type: application/json

{
  "title": "我的第一篇日记",
  "content": "# 今天天气真好\n\n今天是美好的一天，阳光明媚，适合出去散步。",
  "weather": "晴天",
  "mood": "开心",
  "tags": ["心情", "天气"],
  "is_public": true
}
```

#### 获取日记列表

```http
GET /api/v1/diaries/?skip=0&limit=20&public_only=true
```

#### 获取单篇日记

```http
GET /api/v1/diaries/{diary_id}
```

#### 更新日记

```http
PUT /api/v1/diaries/{diary_id}
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容"
}
```

#### 删除日记

```http
DELETE /api/v1/diaries/{diary_id}
```

### 2. 图片管理

#### 获取图片上传URL

```http
POST /api/v1/diaries/{diary_id}/images/upload-urls?file_count=2
```

响应示例：
```json
[
  {
    "upload_url": "https://minio.example.com/bucket/diary-images/2023/12/1/1703123456_abc123.jpg?X-Amz-Algorithm=...",
    "object_name": "diary-images/2023/12/1/1703123456_abc123.jpg",
    "thumbnail_object_name": null,
    "expires_in": 3600
  }
]
```

#### 保存图片信息

```http
POST /api/v1/diaries/{diary_id}/images
Content-Type: application/json

{
  "original_filename": "sunset.jpg",
  "file_size": 1024000,
  "mime_type": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "minio_object_name": "diary-images/2023/12/1/1703123456_abc123.jpg"
}
```

## 使用流程

### 1. 创建日记

首先创建一篇日记：

```bash
curl -X POST "http://localhost:8001/api/v1/diaries/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇日记",
    "content": "# 今天天气真好\n\n今天是美好的一天。",
    "weather": "晴天",
    "mood": "开心",
    "tags": ["心情", "天气"],
    "is_public": true
  }'
```

### 2. 获取图片上传URL

为日记获取图片上传URL：

```bash
curl -X POST "http://localhost:8000/api/v1/diaries/1/images/upload-urls?file_count=2"
```

### 3. 上传图片

使用获取到的预签名URL上传图片：

```bash
curl -X PUT "https://minio.example.com/bucket/diary-images/2023/12/1/1703123456_abc123.jpg?X-Amz-Algorithm=..." \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
```

### 4. 保存图片信息

将图片信息保存到数据库：

```bash
curl -X POST "http://localhost:8001/api/v1/diaries/1/images" \
  -H "Content-Type: application/json" \
  -d '{
    "original_filename": "photo.jpg",
    "file_size": 1024000,
    "mime_type": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "minio_object_name": "diary-images/2023/12/1/1703123456_abc123.jpg"
  }'
```

### 5. 查看日记

获取日记详情，包括图片：

```bash
curl -X GET "http://localhost:8001/api/v1/diaries/1"
```

## 图片存储结构

图片在MinIO中的存储结构如下：

```
witchcat-files/
├── diary-images/
│   ├── {user_id}/
│   │   └── {year}/
│   │       └── {month}/
│   │           └── {diary_id}/
│   │               ├── 1703123456_abc123.jpg
│   │               └── 1703123457_def456.jpg
│   └── public/
│       └── {year}/
│           └── {month}/
│               └── {diary_id}/
│                   ├── 1703123456_abc123.jpg
│                   └── 1703123457_def456.jpg
└── ...
```

## 注意事项

1. 预签名URL有效期为1小时，请在有效期内上传图片
2. 支持的图片格式：JPEG、PNG、GIF、WebP
3. 图片大小限制：10MB
4. 每篇日记最多可以上传10张图片
5. 删除日记时会同时删除相关的所有图片文件

## 前端集成建议

1. **创建日记表单**：
   - 使用Markdown编辑器（如Editor.js、Tiptap等）
   - 支持拖拽上传图片
   - 支持天气和心情选择器
   - 支持标签输入

2. **图片上传流程**：
   - 先获取预签名URL
   - 并行上传多张图片
   - 显示上传进度
   - 上传完成后调用保存图片信息API

3. **展示页面**：
   - 使用Markdown渲染器展示内容
   - 图片支持懒加载
   - 图片点击放大查看
   - 响应式布局

## 测试

可以使用提供的测试脚本进行API测试：

```bash
python test_diary_api.py
```

这个脚本会测试日记的创建、查询和图片上传流程。