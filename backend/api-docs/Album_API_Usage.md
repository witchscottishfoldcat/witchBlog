# 相册API使用指南

## 概述

相册模块提供了完整的相册管理功能，包括创建相册、上传照片、管理相册和照片等。

## 模型结构

### 相册 (Album)

```json
{
  "id": 1,
  "title": "相册标题",
  "description": "相册描述",
  "tags": ["标签1", "标签2"],
  "is_public": true,
  "user_id": 123,
  "cover_photo_id": 456,
  "view_count": 100,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "photo_count": 10,
  "photos": [...],
  "cover_photo": {...}
}
```

### 照片 (Photo)

```json
{
  "id": 1,
  "album_id": 1,
  "minio_bucket": "witchcat-files",
  "minio_object_name": "albums/1/photos/xxx.jpg",
  "original_filename": "照片.jpg",
  "file_size": 1024000,
  "mime_type": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "title": "照片标题",
  "description": "照片描述",
  "tags": ["照片", "风景"],
  "thumbnail_minio_object_name": "albums/1/thumbnails/xxx.jpg",
  "is_cover": false,
  "sort_order": 1,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "image_url": "https://...",
  "thumbnail_url": "https://..."
}
```

## API端点

### 相册管理

#### 创建相册

```http
POST /api/v1/albums/
Content-Type: application/json

{
  "title": "相册标题",
  "description": "相册描述",
  "tags": ["标签1", "标签2"],
  "is_public": true
}
```

#### 获取相册列表

```http
GET /api/v1/albums/?skip=0&limit=20&public_only=true&tag=风景&sort_by=created_at
```

参数说明：
- `skip`: 跳过的记录数（分页）
- `limit`: 每页记录数
- `public_only`: 是否只获取公开相册
- `tag`: 按标签筛选
- `sort_by`: 排序字段（created_at, updated_at, view_count, title）

#### 获取相册详情

```http
GET /api/v1/albums/{album_id}
```

#### 更新相册

```http
PUT /api/v1/albums/{album_id}
Content-Type: application/json

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "tags": ["新标签"],
  "is_public": false,
  "cover_photo_id": 5
}
```

#### 删除相册

```http
DELETE /api/v1/albums/{album_id}
```

### 照片管理

#### 获取照片上传URL

```http
GET /api/v1/albums/{album_id}/photos/upload-url?filename=照片.jpg
```

#### 上传照片到相册

```http
POST /api/v1/albums/{album_id}/photos
Content-Type: multipart/form-data

file: 图片文件
title: 照片标题
description: 照片描述
tags: 照片标签（逗号分隔）
is_cover: 是否设为封面
sort_order: 排序权重
```

#### 获取相册照片列表

```http
GET /api/v1/albums/{album_id}/photos?skip=0&limit=20&sort_by=sort_order
```

参数说明：
- `skip`: 跳过的记录数（分页）
- `limit`: 每页记录数
- `sort_by`: 排序字段（sort_order, created_at, updated_at）

#### 获取单张照片详情

```http
GET /api/v1/albums/photos/{photo_id}
```

#### 更新照片信息

```http
PUT /api/v1/albums/photos/{photo_id}
Content-Type: application/json

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "tags": ["新标签"],
  "is_cover": true,
  "sort_order": 2
}
```

#### 删除照片

```http
DELETE /api/v1/albums/photos/{photo_id}
```

## 权限说明

1. **相册创建**: 需要用户登录
2. **相册访问**:
   - 公开相册：所有人可访问
   - 私有相册：仅相册所有者可访问
3. **照片操作**:
   - 上传照片：仅相册所有者
   - 删除照片：仅相册所有者
   - 更新照片信息：相册所有者或公开相册的照片
4. **浏览统计**: 每次非相册所有者访问相册，浏览次数+1

## 使用示例

### 1. 创建相册并上传照片

```bash
# 1. 创建相册
curl -X POST "http://localhost:8000/api/v1/albums/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的旅行相册",
    "description": "记录美好旅程",
    "tags": ["旅行", "风景"],
    "is_public": true
  }'

# 2. 获取上传URL
curl -X GET "http://localhost:8000/api/v1/albums/1/photos/upload-url?filename=sunset.jpg"

# 3. 上传照片
curl -X POST "http://localhost:8000/api/v1/albums/1/photos" \
  -F "file=@sunset.jpg" \
  -F "title=美丽的日落" \
  -F "description=在海边拍摄的日落" \
  -F "tags=日落,海景" \
  -F "is_cover=true"
```

### 2. 浏览相册

```bash
# 获取相册列表
curl "http://localhost:8000/api/v1/albums/?public_only=true"

# 获取相册详情
curl "http://localhost:8000/api/v1/albums/1"

# 获取相册中的照片
curl "http://localhost:8000/api/v1/albums/1/photos"
```

## 注意事项

1. 上传的照片会自动存储在MinIO中，按照 `albums/{album_id}/photos/` 的路径组织
2. 每张照片会自动生成缩略图，存储在 `albums/{album_id}/thumbnails/` 路径下
3. 设置为封面的照片会更新相册的封面照片ID，同一相册只能有一张封面照片
4. 照片和相册的URL都是预签名URL，有一定时效性
5. 删除相册会同时删除相册中的所有照片和MinIO中的文件