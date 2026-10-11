# 日记API设置指南

本指南将帮助你设置和测试日记API，包括启动服务器和测试API端点。

## 快速开始

### 1. 启动服务器

有两种方式启动服务器：

#### 方式一：使用测试脚本启动
```bash
cd ./backend
python start_test_server.py
```

#### 方式二：使用主应用启动
```bash
cd ./backend
python main.py
```

### 2. 测试API

#### 方式一：使用测试脚本
```bash
cd ./backend
python test_diary_api.py
```

#### 方式二：使用API文档
启动服务器后，访问以下URL查看API文档：
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## API端点测试

### 1. 获取日记列表（无需认证）

```bash
curl -X GET "http://localhost:8001/api/v1/diaries/?skip=0&limit=20&public_only=true"
```

### 2. 创建日记（无需认证）

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

### 3. 获取单篇日记（无需认证）

```bash
curl -X GET "http://localhost:8001/api/v1/diaries/1"
```

## 认证

虽然日记API支持匿名访问公开日记，但某些操作（如更新、删除日记）需要认证。如果你需要测试这些操作，请先创建一个用户并登录。

### 1. 创建用户

```bash
curl -X POST "http://localhost:8001/api/v1/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "测试用户"
  }'
```

### 2. 登录获取token

```bash
curl -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password123"
```

### 3. 使用认证token

在请求头中添加：
```
Authorization: Bearer <your_token_here>
```

## 图片上传流程

图片上传是一个多步骤过程：

### 1. 获取预签名上传URL

```bash
curl -X GET "http://localhost:8001/api/v1/diaries/1/images/upload-urls?file_count=1"
```

### 2. 使用预签名URL上传图片

```bash
curl -X PUT "https://minio.example.com/bucket/diary-images/2023/12/1/1703123456_abc123.jpg?X-Amz-Algorithm=..." \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
```

### 3. 保存图片信息

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



## 前端集成示例

### 创建日记表单

```html
<!DOCTYPE html>
<html>
<head>
    <title>创建日记</title>
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@12.3.2/dist/markdown-it.min.js"></script>
</head>
<body>
    <h1>创建日记</h1>
    <form id="diary-form">
        <div>
            <label for="title">标题:</label>
            <input type="text" id="title" name="title" required>
        </div>
        <div>
            <label for="content">内容:</label>
            <textarea id="content" name="content" rows="10" required></textarea>
        </div>
        <div>
            <label for="weather">天气:</label>
            <select id="weather" name="weather">
                <option value="晴天">晴天</option>
                <option value="多云">多云</option>
                <option value="阴天">阴天</option>
                <option value="雨天">雨天</option>
            </select>
        </div>
        <div>
            <label for="mood">心情:</label>
            <select id="mood" name="mood">
                <option value="开心">开心</option>
                <option value="平静">平静</option>
                <option value="难过">难过</option>
                <option value="兴奋">兴奋</option>
            </select>
        </div>
        <div>
            <label for="is_public">公开:</label>
            <input type="checkbox" id="is_public" name="is_public" checked>
        </div>
        <div>
            <label for="images">图片:</label>
            <input type="file" id="images" name="images" multiple accept="image/*">
            <div id="image-preview"></div>
        </div>
        <div>
            <label for="tags">标签:</label>
            <input type="text" id="tags" name="tags" placeholder="用逗号分隔多个标签">
        </div>
        <button type="submit">保存</button>
    </form>

    <script>
        const diaryForm = document.getElementById('diary-form');
        const imageInput = document.getElementById('images');
        const imagePreview = document.getElementById('image-preview');
        const tagsInput = document.getElementById('tags');
        
        let uploadedImages = [];
        
        // 处理图片选择
        imageInput.addEventListener('change', function() {
            imagePreview.innerHTML = '';
            uploadedImages = [];
            
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '200px';
                    img.style.margin = '5px';
                    imagePreview.appendChild(img);
                    
                    uploadedImages.push({
                        file: file,
                        preview: e.target.result
                    });
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // 处理表单提交
        diaryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(diaryForm);
            const diaryData = {
                title: formData.get('title'),
                content: formData.get('content'),
                weather: formData.get('weather'),
                mood: formData.get('mood'),
                is_public: formData.has('is_public'),
                tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
            };
            
            try {
                // 1. 创建日记
                const createResponse = await fetch('/api/v1/diaries/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(diaryData)
                });
                
                if (!createResponse.ok) {
                    throw new Error(`HTTP error! status: ${createResponse.status}`);
                }
                
                const diary = await createResponse.json();
                const diaryId = diary.id;
                
                // 2. 如果有图片，获取上传URL并上传
                if (uploadedImages.length > 0) {
                    // 获取上传URL
                    const urlsResponse = await fetch(`/api/v1/diaries/${diaryId}/images/upload-urls?file_count=${uploadedImages.length}`);
                    const uploadUrls = await urlsResponse.json();
                    
                    // 并行上传图片
                    const uploadPromises = [];
                    for (let i = 0; i < uploadedImages.length; i++) {
                    const { file } = uploadedImages[i];
                    const { upload_url, object_name } = uploadUrls[i];
                    
                    uploadPromises.push(uploadImage(upload_url, file, object_name, diaryId));
                    }
                    
                    await Promise.all(uploadPromises);
                }
                
                alert('日记创建成功！');
                
            } catch (error) {
                console.error('Error creating diary:', error);
                alert('创建日记失败: ' + error.message);
            }
        });
        
        // 上传图片
        async function uploadImage(uploadUrl, file, objectName, diaryId) {
            // 上传图片到MinIO
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`HTTP error! status: ${uploadResponse.status}`);
            }
            
            // 获取图片尺寸
            const imageInfo = await getImageInfo(file);
            
            // 保存图片信息
            const saveResponse = await fetch(`/api/v1/diaries/${diaryId}/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    original_filename: file.name,
                    file_size: file.size,
                    mime_type: file.type,
                    width: imageInfo.width,
                    height: imageInfo.height,
                    minio_object_name: objectName
                })
            });
            
            if (!saveResponse.ok) {
                throw new Error(`HTTP error! status: ${saveResponse.status}`);
            }
            
            return saveResponse.json();
        }
        
        // 获取图片尺寸
        function getImageInfo(file) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    resolve({
                        width: this.width,
                        height: this.height
                    });
                };
                img.onerror = function() {
                    resolve({
                        width: 0,
                        height: 0
                    });
                };
                img.src = URL.createObjectURL(file);
            });
        }
    </script>
</body>
</html>
```

## 故障排除

### 1. 401 Unauthorized错误

如果你在获取日记列表时遇到401错误，请检查：

- 确保请求参数包含`public_only=true`
- 检查服务器是否正确实现了`get_current_user_optional`依赖
- 确保服务器正在运行在正确的端口

### 2. 连接错误

如果无法连接到服务器：

- 检查服务器是否已启动
- 确认端口号是否正确（默认为8001）
- 检查防火墙设置

### 3. 图片上传问题

如果图片上传失败：

- 检查MinIO服务器是否运行
- 确认MinIO配置是否正确
- 检查图片文件大小是否超过限制（10MB）
- 确认图片格式是否受支持（JPEG、PNG、GIF、WebP）

## 下一步

1. 创建前端界面，整合日记API
2. 添加Markdown编辑器，支持富文本编辑
3. 实现图片拖拽上传
4. 添加日记搜索功能
5. 实现用户认证和授权
6. 添加评论和点赞功能

祝你使用愉快！