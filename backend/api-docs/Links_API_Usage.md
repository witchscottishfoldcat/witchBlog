# 链接管理API使用说明

本文档介绍链接管理API的使用方法，包括基本链接管理和图片上传到MinIO的功能。

## API端点

### 基本链接管理

1. **获取链接列表**
   ```
   GET /api/v1/links
   ```

2. **分页获取链接列表**
   ```
   GET /api/v1/links/list
   ```

3. **获取单个链接**
   ```
   GET /api/v1/links/{link_id}
   ```

4. **创建链接**
   ```
   POST /api/v1/links
   ```

5. **更新链接**
   ```
   PUT /api/v1/links/{link_id}
   ```

6. **删除链接**
   ```
   DELETE /api/v1/links/{link_id}
   ```

7. **获取分类统计**
   ```
   GET /api/v1/links/categories/stats
   ```

8. **获取所有标签**
   ```
   GET /api/v1/links/tags/all
   ```

9. **根据标签获取链接**
   ```
   GET /api/v1/links/by-tags/list?tags=标签1,标签2
   ```

10. **获取随机链接**
    ```
    GET /api/v1/links/random?limit=5&category=friend
    ```

### 图片上传功能

1. **上传图片到MinIO**
   ```
   POST /api/v1/links/upload-image
   Content-Type: multipart/form-data
   ```

2. **为指定链接上传新图片**
   ```
   POST /api/v1/links/{link_id}/upload-image
   Content-Type: multipart/form-data
   ```

3. **创建链接并上传图片**
   ```
   POST /api/v1/links/create-with-image
   Content-Type: multipart/form-data
   ```

## 图片存储方案

### 存储位置
- MinIO服务器: `minio.example.com`
- 桶名称: `witchcat-files`
- 文件夹: `link-images/`
- 完整路径格式: `witchcat-files/link-images/{uuid}.jpg`

### 图片URL格式
```
https://minio.example.com/witchcat-files/link-images/{uuid}.jpg
```

### 支持的图片格式
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### 图片大小限制
- 最大文件大小: 10MB

## 数据模型

### 链接模型字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | Integer | 链接ID |
| name | String | 链接名称 |
| url | String | 链接地址 |
| description | Text | 链接描述 |
| image_url | String | 链接图片URL（可以是外部URL或MinIO对象名称） |
| image_type | String | 图片类型：external（外部链接）或minio（MinIO存储） |
| tags | String | 标签，多个标签用逗号分隔 |
| category | String | 链接分类：friend（友链）、video（视频）、other（其他） |
| is_active | Boolean | 是否启用 |
| sort_order | Integer | 排序权重 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## 使用示例

### 1. 创建链接（使用外部图片URL）

```bash
curl -X POST "http://localhost:8001/api/v1/links" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "GitHub",
       "url": "https://github.com",
       "description": "全球最大的代码托管平台",
       "image_url": "https://github.com/favicon.ico",
       "image_type": "external",
       "tags": "代码,开源,Git",
       "category": "friend",
       "sort_order": 10
     }'
```

### 2. 上传图片到MinIO

```bash
curl -X POST "http://localhost:8001/api/v1/links/upload-image" \
     -F "file=@/path/to/image.png"
```

响应示例:
```json
{
  "object_name": "link-images/550e8400-e29b-41d4-a716-446655440000.png",
  "image_url": "https://minio.example.com/witchcat-files/link-images/550e8400-e29b-41d4-a716-446655440000.png",
  "message": "图片上传成功"
}
```

### 3. 创建链接并上传图片

```bash
curl -X POST "http://localhost:8001/api/v1/links/create-with-image" \
     -F "name=Vue.js" \
     -F "url=https://vuejs.org" \
     -F "description=渐进式JavaScript框架" \
     -F "tags=Vue,前端,框架,JavaScript" \
     -F "category=friend" \
     -F "sort_order=20" \
     -F "file=@/path/to/vue-logo.png"
```

### 4. 为已有链接更新图片

```bash
curl -X POST "http://localhost:8001/api/v1/links/1/upload-image" \
     -F "file=@/path/to/new-image.png"
```

### 5. 获取所有友链

```bash
curl "http://localhost:8001/api/v1/links?category=friend"
```

### 6. 根据标签搜索链接

```bash
curl "http://localhost:8001/api/v1/links/by-tags/list?tags=前端,Vue"
```

## 前端集成建议

### 显示链接图片

```javascript
function getImageUrl(link) {
  // 如果是MinIO存储的图片，直接返回URL
  if (link.image_type === 'minio' && link.image_url) {
    return link.image_url;
  }
  
  // 如果是外部链接，返回外部URL
  if (link.image_type === 'external' && link.image_url) {
    return link.image_url;
  }
  
  // 默认图片
  return '/default-link-image.png';
}
```

### 上传图片

```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/links/upload-image', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}
```

### 创建带图片的链接

```javascript
async function createLinkWithImage(linkData, imageFile) {
  const formData = new FormData();
  
  // 添加链接数据
  Object.keys(linkData).forEach(key => {
    formData.append(key, linkData[key]);
  });
  
  // 添加图片文件
  formData.append('file', imageFile);
  
  const response = await fetch('/api/v1/links/create-with-image', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}
```

## 注意事项

1. **图片上传限制**：
   - 最大文件大小: 10MB
   - 支持的图片格式: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

2. **MinIO配置**：
   - 确保MinIO服务器正常运行
   - 确保`witchcat-files`桶已创建
   - 确保有足够的存储空间

3. **链接管理**：
   - 链接删除时，不会自动删除关联的MinIO图片
   - 如需删除图片，需单独调用删除接口

4. **错误处理**：
   - 所有API都包含适当的错误响应
   - 前端应用应处理各种错误情况（网络错误、验证错误等）

## 测试脚本

项目包含两个测试脚本：

1. **test_links_api.py**: 测试基本链接API功能
2. **test_minio_upload.py**: 测试MinIO图片上传功能

运行测试脚本：
```bash
python test_links_api.py
python test_minio_upload.py
```

确保在运行测试前启动API服务器：
```bash
python main.py
```
