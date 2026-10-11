# MD文件管理API使用说明

本文档介绍MD文件管理API的使用方法，包括通过JSON和文件上传两种方式创建MD文件。

## API端点

### 基本MD文件管理

1. **创建MD文件（通过JSON）**
   ```
   POST /api/v1/md-files/
   Content-Type: application/json
   ```

2. **上传MD文件（通过文件上传）**
   ```
   POST /api/v1/md-files/upload
   Content-Type: multipart/form-data
   ```

3. **获取MD文件列表**
   ```
   GET /api/v1/md-files/
   ```

4. **获取公开MD文件列表**
   ```
   GET /api/v1/md-files/public
   ```

5. **获取单个MD文件**
   ```
   GET /api/v1/md-files/{file_id}
   ```

6. **获取MD文件内容**
   ```
   GET /api/v1/md-files/{file_id}/content
   ```

7. **更新MD文件**
   ```
   PUT /api/v1/md-files/{file_id}
   Content-Type: application/json
   ```

8. **删除MD文件**
   ```
   DELETE /api/v1/md-files/{file_id}
   ```

9. **下载MD文件**
   ```
   GET /api/v1/md-files/{file_id}/download
   ```

10. **渲染MD文件内容**
    ```
    GET /api/v1/md-files/{file_id}/render
    ```

## 使用示例

### 1. 通过JSON创建MD文件

```bash
curl -X POST "http://localhost:8001/api/v1/md-files/" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "我的第一篇文档",
       "description": "这是我的第一篇Markdown文档",
       "content": "# 我的第一篇文档\n\n这是一个测试文档。",
       "filename": "first-doc.md",
       "tags": "文档,测试",
       "is_public": true
     }'
```

### 2. 通过文件上传创建MD文件

```bash
curl -X POST "http://localhost:8001/api/v1/md-files/upload" \
     -F "title=上传的文档" \
     -F "description=通过文件上传创建的文档" \
     -F "tags=上传,文档" \
     -F "is_public=true" \
     -F "file=@/path/to/your/document.md"
```

### 3. 获取MD文件列表

```bash
curl "http://localhost:8001/api/v1/md-files/?skip=0&limit=10"
```

### 4. 搜索MD文件

```bash
curl "http://localhost:8001/api/v1/md-files/?search=关键词"
```

### 5. 获取MD文件内容

```bash
curl "http://localhost:8001/api/v1/md-files/1/content"
```

## 数据模型

### MDFileCreate（创建MD文件）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | str | 文档标题（必填） |
| content | str | 文档内容（通过JSON创建时必填） |
| filename | str | 文件名（通过文件上传时自动填充） |
| description | str | 文档描述（可选） |
| tags | str | 标签，多个标签用逗号分隔（可选） |
| is_public | bool | 是否公开（默认为false） |

### MDFile（MD文件响应）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 文件ID |
| title | str | 文档标题 |
| description | str | 文档描述 |
| content | str | 文档内容（仅在某些端点返回） |
| original_filename | str | 原始文件名 |
| object_name | str | MinIO对象名称 |
| bucket_name | str | MinIO桶名称 |
| file_size | int | 文件大小（字节） |
| file_url | str | 文件URL |
| etag | str | 文件ETag |
| word_count | int | 字数统计 |
| is_public | bool | 是否公开 |
| tags | str | 标签 |
| owner_id | int | 所有者ID |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

## 存储方案

### MinIO存储

- **私有文件**: 存储在私有位置，通过预签名URL访问
- **公开文件**: 同时存储在私有和公开位置，通过永久URL访问
- **文件夹**: `md_files/`

### 文件URL格式

- **私有文件**: 使用预签名URL，有效期1小时
- **公开文件**: 永久URL格式：`https://minio.example.com/witchcat-files/md_files/{object_name}`

## 注意事项

1. **文件格式**: 只支持 `.md`, `.markdown`, `.mdown`, `.mkd` 格式的文件
2. **文件大小**: 没有严格限制，但建议不超过10MB
3. **权限控制**: 暂时使用固定用户ID（1），实际使用时应从认证中获取
4. **编码**: 文件内容使用UTF-8编码

## 测试脚本

项目包含以下测试脚本：

1. **test_md_upload.py**: 测试文件上传功能
2. **test_md_json.py**: 测试JSON创建功能
3. **test_minio.py**: 测试MinIO服务功能

运行测试脚本：
```bash
# 确保服务器运行在 http://localhost:8001
python test_md_upload.py
python test_md_json.py
python test_minio.py
```

## 错误处理

API使用标准的HTTP状态码：

- **200 OK**: 请求成功
- **400 Bad Request**: 请求参数错误（如文件格式不支持）
- **401 Unauthorized**: 认证失败
- **404 Not Found**: 资源不存在
- **500 Internal Server Error**: 服务器内部错误

错误响应格式：
```json
{
  "detail": "错误描述"
}
```

## 前端集成

### 文件上传表单

```html
<form action="/api/v1/md-files/upload" method="post" enctype="multipart/form-data">
  <div>
    <label for="title">标题:</label>
    <input type="text" id="title" name="title" required>
  </div>
  <div>
    <label for="description">描述:</label>
    <textarea id="description" name="description"></textarea>
  </div>
  <div>
    <label for="tags">标签:</label>
    <input type="text" id="tags" name="tags">
  </div>
  <div>
    <label for="is_public">公开:</label>
    <input type="checkbox" id="is_public" name="is_public">
  </div>
  <div>
    <label for="file">文件:</label>
    <input type="file" id="file" name="file" accept=".md,.markdown,.mdown,.mkd" required>
  </div>
  <button type="submit">上传</button>
</form>
```

### JavaScript上传

```javascript
async function uploadMDFile(file, metadata) {
  const formData = new FormData();
  
  // 添加文件
  formData.append('file', file);
  
  // 添加元数据
  Object.keys(metadata).forEach(key => {
    formData.append(key, metadata[key]);
  });
  
  const response = await fetch('/api/v1/md-files/upload', {
    method: 'POST',
    body: formData
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('上传成功:', result);
  } else {
    console.error('上传失败:', await response.text());
  }
}
```

### JSON创建

```javascript
async function createMDFile(data) {
  const response = await fetch('/api/v1/md-files/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('创建成功:', result);
  } else {
    console.error('创建失败:', await response.text());
  }
}
```
