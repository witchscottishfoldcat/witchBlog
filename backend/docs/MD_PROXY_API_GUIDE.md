# MD文件缓存代理接口文档

## 概述

MD文件缓存代理接口提供了对MD文件的缓存访问，通过本地缓存加速文件读取，同时解决跨域访问问题。所有MD文件都会自动生成一个代理URL，格式为 `/api/proxy/md/{file_id}`。

## 基础端点

### 1. 获取MD文件内容

**端点**: `GET /api/proxy/md/{file_id}`

**描述**: 通过代理获取MD文件内容，优先从本地缓存读取

**参数**:
- `file_id` (路径参数): MD文件的ID
- `force_refresh` (可选查询参数): 是否强制刷新缓存，默认为`false`

**示例请求**:
```javascript
// 基本请求
GET /api/proxy/md/15

// 强制刷新缓存
GET /api/proxy/md/15?force_refresh=true
```

**响应**:
- 成功 (200): 返回MD文件内容 (text/markdown)
- 失败 (404): MD文件不存在
- 失败 (500): 服务器内部错误

**响应头**:
```
Content-Type: text/markdown
Cache-Control: public, max-age=3600
Access-Control-Allow-Origin: *
Content-Disposition: inline; filename=example.md
```

**前端使用示例**:
```javascript
// 使用fetch获取MD文件内容
async function getMDFile(fileId, forceRefresh = false) {
  const url = `/api/proxy/md/${fileId}${forceRefresh ? '?force_refresh=true' : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('获取MD文件失败:', error);
    throw error;
  }
}

// 使用示例
getMDFile(15).then(content => {
  console.log('MD文件内容:', content);
});
```

### 2. 使缓存失效

**端点**: `GET /api/proxy/md/{file_id}/invalidate`

**描述**: 使指定MD文件的缓存失效，下次访问时将从源重新获取

**参数**:
- `file_id` (路径参数): MD文件的ID

**示例请求**:
```javascript
GET /api/proxy/md/15/invalidate
```

**响应**:
```json
{
  "message": "缓存已成功失效"
}
```

**前端使用示例**:
```javascript
async function invalidateMDFileCache(fileId) {
  try {
    const response = await fetch(`/api/proxy/md/${fileId}/invalidate`);
    const result = await response.json();
    return result.message;
  } catch (error) {
    console.error('使缓存失效失败:', error);
    throw error;
  }
}
```

### 3. 获取缓存统计信息

**端点**: `GET /api/proxy/md/stats`

**描述**: 获取缓存服务的统计信息

**示例请求**:
```javascript
GET /api/proxy/md/stats
```

**响应**:
```json
{
  "cache_dir": "/path/to/uploads/md_cache",
  "file_count": 42,
  "total_size_bytes": 2048576,
  "total_size_mb": 1.95,
  "ttl_hours": 24
}
```

**前端使用示例**:
```javascript
async function getCacheStats() {
  try {
    const response = await fetch('/api/proxy/md/stats');
    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    throw error;
  }
}
```

### 4. 清理过期缓存

**端点**: `POST /api/proxy/md/clean`

**描述**: 清理所有过期的缓存文件

**示例请求**:
```javascript
POST /api/proxy/md/clean
```

**响应**:
```json
{
  "message": "已清理 5 个过期缓存文件"
}
```

**前端使用示例**:
```javascript
async function cleanExpiredCache() {
  try {
    const response = await fetch('/api/proxy/md/clean', {
      method: 'POST'
    });
    const result = await response.json();
    return result.message;
  } catch (error) {
    console.error('清理过期缓存失败:', error);
    throw error;
  }
}
```

## 在MD文件对象中获取代理URL

每个MD文件对象都包含一个`proxy_url`字段，格式为`/api/proxy/md/{file_id}`。你可以通过以下API获取包含此字段的MD文件信息：

### 获取单个MD文件信息

**端点**: `GET /api/v1/md-files/{file_id}`

**响应示例**:
```json
{
  "id": 15,
  "title": "示例文档",
  "description": "这是一个示例文档",
  "original_filename": "example.md",
  "object_name": "md_files/example_12345678.md",
  "bucket_name": "my-bucket",
  "file_size": 1024,
  "file_url": "https://minio.example.com/my-bucket/md_files/example_12345678.md",
  "proxy_url": "/api/proxy/md/15",
  "etag": "abc123",
  "word_count": 150,
  "is_public": true,
  "tags": "示例,文档",
  "owner_id": 1,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### 获取MD文件列表

**端点**: `GET /api/v1/md-files/`

**响应示例**:
```json
{
  "files": [
    {
      "id": 15,
      "title": "示例文档",
      "proxy_url": "/api/proxy/md/15",
      // ... 其他字段
    },
    {
      "id": 16,
      "title": "另一个文档",
      "proxy_url": "/api/proxy/md/16",
      // ... 其他字段
    }
  ],
  "total": 25
}
```

## 前端集成建议

### 1. 显示MD文件内容

```javascript
// 获取并显示MD文件内容
async function displayMDFile(fileId) {
  try {
    // 先获取文件信息
    const fileInfoResponse = await fetch(`/api/v1/md-files/${fileId}`);
    const fileInfo = await fileInfoResponse.json();
    
    // 使用代理URL获取文件内容
    const contentResponse = await fetch(fileInfo.proxy_url);
    const content = await contentResponse.text();
    
    // 渲染Markdown内容（需要使用Markdown解析库）
    const html = marked.parse(content);
    document.getElementById('md-content').innerHTML = html;
    
    // 显示文件标题
    document.getElementById('md-title').textContent = fileInfo.title;
  } catch (error) {
    console.error('显示MD文件失败:', error);
  }
}
```

### 2. 刷新缓存

```javascript
// 提供刷新按钮，强制更新缓存内容
function refreshMDContent(fileId) {
  // 强制刷新缓存
  getMDFile(fileId, true).then(content => {
    const html = marked.parse(content);
    document.getElementById('md-content').innerHTML = html;
  }).catch(error => {
    console.error('刷新内容失败:', error);
  });
}
```

### 3. 错误处理

```javascript
async function getMDFileWithErrorHandling(fileId, forceRefresh = false) {
  try {
    const response = await fetch(`/api/proxy/md/${fileId}${forceRefresh ? '?force_refresh=true' : ''}`);
    
    if (response.status === 404) {
      throw new Error('文件不存在');
    } else if (response.status >= 500) {
      throw new Error('服务器错误，请稍后再试');
    } else if (!response.ok) {
      throw new Error(`获取文件失败: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络连接');
    }
    throw error;
  }
}
```

## 性能优化建议

1. **缓存客户端响应**: 由于服务端已经设置了缓存头（`Cache-Control: public, max-age=3600`），浏览器会自动缓存响应1小时。

2. **预加载内容**: 如果知道用户可能会查看某些文件，可以提前获取内容。

3. **懒加载**: 对于长列表，可以在用户需要时才加载文件内容。

4. **显示加载状态**: 在获取文件内容时显示加载指示器，提升用户体验。

```javascript
// 带加载状态的示例
async function displayMDFileWithLoading(fileId) {
  const contentElement = document.getElementById('md-content');
  const loadingElement = document.getElementById('loading');
  
  // 显示加载状态
  loadingElement.style.display = 'block';
  contentElement.innerHTML = '';
  
  try {
    const content = await getMDFile(fileId);
    const html = marked.parse(content);
    contentElement.innerHTML = html;
  } catch (error) {
    contentElement.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
  } finally {
    loadingElement.style.display = 'none';
  }
}
```

## 注意事项

1. **跨域问题**: 代理接口已设置CORS头，可以从前端正常访问。

2. **缓存时间**: 默认缓存时间为24小时，但服务端响应头设置了1小时的浏览器缓存。

3. **强制刷新**: 使用`force_refresh=true`参数可以绕过缓存，从源重新获取文件。

4. **错误处理**: 实现适当的错误处理，特别是网络错误和404错误。

5. **大文件处理**: 对于大型MD文件，考虑实现分块加载或渐进式渲染。