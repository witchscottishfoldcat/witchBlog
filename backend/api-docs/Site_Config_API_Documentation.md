# 站点配置 API 接口文档

## 概述

站点配置 API 提供了管理网站基本配置的功能，包括站点名称、签名、公告、图标和个人头像等信息。该API支持上传图片文件到 MinIO 存储服务，并将配置信息存储在 MySQL 数据库中。

## 基础信息

- **API 版本**: v1
- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token (JWT)

## 数据模型

### SiteConfig（站点配置）
| 字段 | 类型 | 必填 | 最大长度 | 描述 |
|------|------|------|----------|------|
| id | int | - | - | 配置ID（自动生成） |
| site_name | str | 是 | 100 | 站点名称 |
| site_signature | str | 否 | 200 | 站点签名 |
| site_announcement | str | 否 | - | 站点公告（长文本） |
| site_icon | str | 否 | 500 | 站点图标URL |
| profile_image | str | 否 | 500 | 个人头像URL |
| is_active | bool | 否 | - | 是否启用（默认true） |
| created_at | datetime | - | - | 创建时间（自动生成） |
| updated_at | datetime | - | - | 更新时间（自动生成） |

### SiteConfigPublic（公开站点配置）
| 字段 | 类型 | 描述 |
|------|------|------|
| site_name | str | 站点名称 |
| site_signature | str | 站点签名 |
| site_announcement | str | 站点公告 |
| site_icon | str | 站点图标URL |
| profile_image | str | 个人头像URL |

## API 端点

### 1. 获取公开站点配置

**无需认证，任何人都可以访问**

**请求：**
```
GET /api/v1/site-config/public
```

**响应示例：**
```json
{
  "site_name": "WitchCat",
  "site_signature": "你的博客签名",
  "site_announcement": "欢迎来到我的博客，分享技术、生活和思考",
  "site_icon": "http://minio-server/witchcat-files/public/site_images/icons/unique-id.png",
  "profile_image": "http://minio-server/witchcat-files/public/site_images/profile/unique-id.jpg"
}
```

**无配置时的默认响应：**
```json
{
  "site_name": "WitchCat",
  "site_signature": null,
  "site_announcement": null,
  "site_icon": null,
  "profile_image": null
}
```

### 2. 获取所有站点配置

**需要认证，超级用户权限**

**请求：**
```
GET /api/v1/site-config/
Authorization: Bearer <access_token>
```

**查询参数：**
- `skip`: 跳过的记录数（可选，默认0）
- `limit`: 返回的记录数（可选，默认100）

**响应示例：**
```json
[
  {
    "id": 1,
    "site_name": "WitchCat",
    "site_signature": "你的博客签名",
    "site_announcement": "欢迎来到我的博客，分享技术、生活和思考",
    "site_icon": "http://minio-server/witchcat-files/public/site_images/icons/unique-id.png",
    "profile_image": "http://minio-server/witchcat-files/public/site_images/profile/unique-id.jpg",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  },
  {
    "id": 2,
    "site_name": "WitchCat Backup",
    "site_signature": "备用配置",
    "site_announcement": "备用公告",
    "site_icon": null,
    "profile_image": null,
    "is_active": false,
    "created_at": "2023-01-02T00:00:00",
    "updated_at": "2023-01-02T00:00:00"
  }
]
```

### 3. 获取当前激活的站点配置

**需要认证**

**请求：**
```
GET /api/v1/site-config/active
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "id": 1,
  "site_name": "WitchCat",
  "site_signature": "你的博客签名",
  "site_announcement": "欢迎来到我的博客，分享技术、生活和思考",
  "site_icon": "http://minio-server/witchcat-files/public/site_images/icons/unique-id.png",
  "profile_image": "http://minio-server/witchcat-files/public/site_images/profile/unique-id.jpg",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

**无激活配置时的错误响应：**
```json
{
  "detail": "未找到激活的站点配置"
}
```

### 4. 创建站点配置

**需要认证，超级用户权限**

**请求：**
```
POST /api/v1/site-config/
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "site_name": "我的博客",
  "site_signature": "分享生活与技术",
  "site_announcement": "欢迎大家访问",
  "is_active": false
}
```

**响应示例：**
```json
{
  "id": 3,
  "site_name": "我的博客",
  "site_signature": "分享生活与技术",
  "site_announcement": "欢迎大家访问",
  "site_icon": null,
  "profile_image": null,
  "is_active": false,
  "created_at": "2023-01-03T00:00:00",
  "updated_at": "2023-01-03T00:00:00"
}
```

**非超级用户的错误响应：**
```json
{
  "detail": "只有超级用户才能创建站点配置"
}
```

**注意：** 如果创建时设置 `is_active` 为 `true`，系统会自动将其他配置的 `is_active` 设置为 `false`，确保只有一个激活配置。

### 5. 更新站点配置

**需要认证，超级用户权限**

**请求：**
```
PUT /api/v1/site-config/{config_id}
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "site_name": "更新后的博客名称",
  "site_signature": "更新后的签名",
  "site_announcement": "更新后的公告",
  "is_active": true
}
```

**响应示例：**
```json
{
  "id": 3,
  "site_name": "更新后的博客名称",
  "site_signature": "更新后的签名",
  "site_announcement": "更新后的公告",
  "site_icon": null,
  "profile_image": null,
  "is_active": true,
  "created_at": "2023-01-03T00:00:00",
  "updated_at": "2023-01-03T01:00:00"
}
```

**注意：** 如果更新时设置 `is_active` 为 `true`，系统会自动将其他配置的 `is_active` 设置为 `false`。

### 6. 删除站点配置

**需要认证，超级用户权限**

**请求：**
```
DELETE /api/v1/site-config/{config_id}
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "detail": "站点配置已删除"
}
```

### 7. 上传站点图标

**需要认证，超级用户权限**

**请求：**
```
POST /api/v1/site-config/{config_id}/upload-icon
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

file: [图片文件]
```

**支持的图片格式：**
- JPEG
- PNG
- GIF
- WebP

**响应示例：**
```json
{
  "detail": "站点图标上传成功",
  "url": "http://minio-server/witchcat-files/public/site_images/icons/unique-id.png"
}
```

### 8. 上传个人头像

**需要认证，超级用户权限**

**请求：**
```
POST /api/v1/site-config/{config_id}/upload-profile
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

file: [图片文件]
```

**支持的图片格式：**
- JPEG
- PNG
- GIF
- WebP

**响应示例：**
```json
{
  "detail": "个人头像上传成功",
  "url": "http://minio-server/witchcat-files/public/site_images/profile/unique-id.jpg"
}
```

## 错误响应

### 401 未授权
```json
{
  "detail": "Not authenticated"
}
```

### 403 权限不足
```json
{
  "detail": "只有超级用户才能创建站点配置"
}
```

### 404 资源不存在
```json
{
  "detail": "站点配置不存在"
}
```

### 400 请求参数错误
```json
{
  "detail": "只能上传图片文件"
}
```

## 使用示例

### 前端获取公开站点配置
```javascript
fetch('http://localhost:8000/api/v1/site-config/public')
  .then(response => response.json())
  .then(config => {
    document.title = config.site_name;
    // 使用其他配置信息
    if (config.site_icon) {
      document.querySelector('link[rel="icon"]').href = config.site_icon;
    }
  });
```

### 管理员上传站点图标
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/api/v1/site-config/1/upload-icon', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken
  },
  body: formData
})
  .then(response => response.json())
  .then(result => {
    console.log('上传成功:', result.url);
    // 更新页面上的图标
    document.querySelector('link[rel="icon"]').href = result.url;
  });
```

## 注意事项

1. **存储位置**：图片文件存储在 MinIO 的以下路径：
   - 站点图标：`public/site_images/icons/`
   - 个人头像：`public/site_images/profile/`

2. **访问权限**：图片文件设置为公开访问，可以通过返回的URL直接访问。

3. **激活状态**：系统中只能有一个激活的站点配置，当设置新的激活配置时，旧配置会自动变为非激活状态。

4. **权限控制**：只有超级用户才能创建、更新和删除站点配置，普通用户只能获取公开配置信息。

5. **默认配置**：系统已预置一个默认配置，站点名称为"WitchCat"。

6. **认证方式**：所有需要认证的接口都需要在请求头中包含 `Authorization: Bearer <access_token>`。

## 接口测试

您可以使用以下工具测试接口：
- Postman
- curl 命令
- API 文档页面：http://localhost:8000/docs

使用 curl 示例：
```bash
# 获取公开站点配置
curl -X GET "http://localhost:8000/api/v1/site-config/public"

# 创建站点配置（需要替换为有效的access_token）
curl -X POST "http://localhost:8000/api/v1/site-config/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "site_name": "我的博客",
    "site_signature": "分享生活与技术",
    "site_announcement": "欢迎大家访问",
    "is_active": false
  }'
```