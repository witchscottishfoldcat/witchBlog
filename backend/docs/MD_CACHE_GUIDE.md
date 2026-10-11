# MD缓存系统使用指南

## 概述

MD缓存系统是一个简化的缓存管理方案，整合了原来分散的多个缓存模块功能。它提供了一组简单的API来管理MD文件的本地缓存，包括从OSS下载文件内容、缓存管理以及代理访问等功能。

## 主要功能

1. **从OSS下载并缓存文件内容**
2. **一键刷新所有或指定文件缓存**
3. **清空缓存和重置代理URL**
4. **列出所有MD文件信息**
5. **强制重新下载所有文件（解决编码问题）**

## API接口说明

### 1. 一键刷新所有MD文件缓存（推荐使用）

**接口**: `POST /api/v1/md-cache-simple/refresh-all`

**功能**:
- 从数据库获取所有MD文件的OSS路径
- 从OSS下载文件内容并缓存到本地
- 更新proxy_url字段为 `/api/proxy/md/{file_id}`

**使用方式**:
```bash
# 一键刷新所有MD文件
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/refresh-all"
```

**返回示例**:
```json
{
  "message": "MD文件缓存刷新完成",
  "total_files": 25,
  "success_count": 25
}
```

### 2. 刷新指定MD文件缓存

**接口**: `POST /api/v1/md-cache-simple/refresh-cache`

**参数**:
- `file_ids`: 要刷新缓存的MD文件ID列表，如果为空则刷新所有文件

**使用方式**:
```bash
# 刷新指定文件
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/refresh-cache" \
  -H "Content-Type: application/json" \
  -d '[1, 2, 3]'

# 刷新所有文件
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/refresh-cache" \
  -H "Content-Type: application/json" \
  -d '[]'
```

### 3. 清空所有MD文件缓存

**接口**: `POST /api/v1/md-cache-simple/clear-all`

**功能**:
- 清除所有本地缓存文件
- 清空数据库中的proxy_url字段
- 完全重置缓存状态

**使用方式**:
```bash
# 清空所有缓存和proxy_url字段
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/clear-all"
```

### 4. 清空缓存（保留proxy_url）

**接口**: `POST /api/v1/md-cache-simple/clear-cache`

**功能**:
- 清除所有本地缓存文件
- 但保留数据库中的proxy_url字段

**使用方式**:
```bash
# 清空所有缓存文件
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/clear-cache"
```

### 5. 强制重新下载所有MD文件（解决编码问题）

**接口**: `POST /api/v1/md-cache-simple/force-refresh-all`

**功能**:
- 清除所有现有缓存
- 清空数据库中的proxy_url字段
- 重新从OSS下载所有文件内容并缓存到本地
- 自动尝试多种编码方式解决中文乱码问题
- 更新proxy_url字段为 `/api/proxy/md/{file_id}`

**使用方式**:
```bash
# 强制重新下载所有MD文件
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/force-refresh-all"
```

**使用场景**:
- 当缓存文件出现乱码时
- 当文件编码有问题时
- 需要确保所有文件都是最新版本时
- 需要完全重置缓存状态时

### 6. 查看所有MD文件信息

**接口**: `GET /api/v1/md-cache-simple/list-files`

**功能**:
- 列出所有MD文件的基本信息
- 显示当前的file_url和proxy_url

**使用方式**:
```bash
# 查看所有MD文件
curl -X GET "http://localhost:8000/api/v1/md-cache-simple/list-files"
```

**返回示例**:
```json
{
  "total_files": 3,
  "files": [
    {
      "id": 1,
      "title": "示例文章1",
      "file_url": "https://minio.example.com/witchcat-files/md_files/example1.md",
      "proxy_url": "/api/proxy/md/1"
    },
    {
      "id": 2,
      "title": "示例文章2",
      "file_url": "https://minio.example.com/witchcat-files/md_files/example2.md",
      "proxy_url": "/api/proxy/md/2"
    },
    {
      "id": 3,
      "title": "示例文章3",
      "file_url": "https://minio.example.com/witchcat-files/md_files/example3.md",
      "proxy_url": null
    }
  ]
}
```

## 代理访问接口

### 1. 获取MD文件内容（通过代理）

```
GET /api/proxy/md/{file_id}
```

参数：
- `file_id`: MD文件的ID
- `force_refresh`: (可选) 是否强制刷新缓存

返回：
- MD文件的原始内容
- Content-Type: text/markdown

### 2. 使缓存失效

```
GET /api/proxy/md/{file_id}/invalidate
```

参数：
- `file_id`: MD文件的ID

返回：
- 操作结果消息

## 使用场景

### 场景1: 本地环境和线上环境使用同一数据库

当你遇到本地和线上环境缓存冲突时，只需要：

1. 调用刷新接口：
```bash
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/refresh-all"
```

2. 系统会自动：
   - 从数据库获取所有MD文件的OSS路径
   - 从OSS重新下载文件内容并缓存
   - 更新proxy_url字段

这样就能确保缓存内容与OSS中的最新文件同步，无论你是在本地还是线上环境。

### 场景2: 检查文件状态

在刷新之前，可以先查看当前文件状态：

```bash
# 查看所有MD文件信息
curl -X GET "http://localhost:8000/api/v1/md-cache-simple/list-files"
```

这样可以看到哪些文件的proxy_url为空，需要更新。

### 场景3: 解决文件编码问题

当发现MD文件显示乱码时：

```bash
# 强制重新下载所有MD文件（自动处理编码）
curl -X POST "http://localhost:8000/api/v1/md-cache-simple/force-refresh-all"
```

系统会自动尝试多种编码方式（UTF-8、GBK、GB2312、BIG5）来解决中文乱码问题。

## 工作流程

1. **刷新所有缓存**：
   - 系统查询数据库中所有MD文件
   - 对每个文件，从file_url指向的OSS路径下载内容
   - 将内容缓存到本地磁盘
   - 更新proxy_url字段为 `/api/proxy/md/{file_id}`
   - 提交所有更改到数据库

2. **查看文件状态**：
   - 系统返回所有MD文件的基本信息
   - 可以检查file_url和proxy_url的当前状态

3. **强制刷新（解决编码）**：
   - 先清除所有现有缓存
   - 重新从OSS下载文件，自动尝试多种编码
   - 缓存并更新proxy_url

## 注意事项

1. 确保OSS服务正常运行，文件可以正常下载
2. 确保缓存目录有足够的磁盘空间
3. 刷新过程可能需要一些时间，取决于文件数量和大小
4. 建议在非高峰期进行大批量刷新操作
5. 编码问题可能需要手动调整，系统会尽力自动处理

## 故障排除

### 问题: 刷新后某些文件仍然无法访问

1. 检查文件列表，确认proxy_url是否已更新：
   ```bash
   curl -X GET "http://localhost:8000/api/v1/md-cache-simple/list-files"
   ```

2. 检查日志，查看是否有下载失败的文件

3. 手动测试代理接口：
   ```bash
   curl -X GET "http://localhost:8000/api/proxy/md/1"
   ```

4. 尝试强制刷新以解决可能的编码问题：
   ```bash
   curl -X POST "http://localhost:8000/api/v1/md-cache-simple/force-refresh-all"
   ```

### 问题: 刷新速度慢

1. 检查网络连接，确保可以正常访问OSS
2. 检查服务器资源使用情况
3. 考虑分批刷新，而不是一次性刷新所有文件

### 问题: 文件显示乱码

1. 使用强制刷新接口，它会自动尝试多种编码：
   ```bash
   curl -X POST "http://localhost:8000/api/v1/md-cache-simple/force-refresh-all"
   ```

2. 如果问题仍然存在，可能需要检查原始文件的编码格式

## 最佳实践

1. **定期刷新**：定期使用`refresh-all`接口更新缓存，确保内容是最新的
2. **编码问题处理**：遇到乱码时优先使用`force-refresh-all`接口
3. **环境切换**：在切换环境（本地/线上）后，使用`refresh-all`重新生成缓存
4. **监控状态**：使用`list-files`接口定期检查文件状态
5. **批量操作**：尽量使用批量接口而不是单个文件操作，提高效率
