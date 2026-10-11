# MD缓存刷新简单指南

## 概述

这个简单的接口用于从OSS/MinIO重新拉取MD文件内容并重新写入缓存，同时更新数据库中的`proxy_url`字段，解决本地和线上环境使用同一数据库导致缓存冲突的问题。

## API接口

### 1. 刷新MD文件缓存

**接口**: `POST /api/v1/md-cache-refresh/refresh-cache`

**参数**:
- `file_ids`: (可选) 要刷新缓存的MD文件ID列表，如果为空数组则刷新所有文件

**使用示例**:
```bash
# 刷新所有MD文件缓存（推荐）
curl -X POST "http://localhost:8000/api/v1/md-cache-refresh/refresh-cache" \
  -H "Content-Type: application/json" \
  -d "[]"

# 或者使用空JSON对象
curl -X POST "http://localhost:8000/api/v1/md-cache-refresh/refresh-cache" \
  -H "Content-Type: application/json" \
  -d "{}"

# 只刷新指定ID的MD文件
curl -X POST "http://localhost:8000/api/v1/md-cache-refresh/refresh-cache" \
  -H "Content-Type: application/json" \
  -d "[1, 2, 3]"
```

### 2. 清空所有缓存

**接口**: `POST /api/v1/md-cache-refresh/clear-cache`

**使用示例**:
```bash
# 清空所有MD文件缓存
curl -X POST "http://localhost:8000/api/v1/md-cache-refresh/clear-cache"
```

## 使用场景

当你遇到本地和线上环境缓存冲突时，只需要：

1. 调用刷新缓存接口，从OSS/MinIO重新拉取最新内容
2. 接口会自动更新数据库中的`proxy_url`字段为正确的代理路径（`/api/proxy/md/{id}`）
3. 所有文件缓存将被更新，同时数据库中的代理路径也会被同步更新

## 推荐工作流

1. 在切换环境前，先清空缓存：
```bash
curl -X POST "http://localhost:8000/api/v1/md-cache-refresh/clear-cache"
```

2. 然后刷新所有缓存：
```bash
curl -X POST "http://localhost:8000/api/v1/md-cache-refresh/refresh-cache" \
  -H "Content-Type: application/json" \
  -d "[]"
```

这样就能确保缓存内容与OSS/MinIO中的最新文件同步，避免路径冲突问题。