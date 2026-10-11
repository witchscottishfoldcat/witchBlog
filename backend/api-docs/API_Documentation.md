# WitchCat API 文档

## 概述

WitchCat API 提供了多个功能模块，包括用户管理、文本处理、MD文件管理和站点配置等。

## API 模块文档

1. [站点配置 API](./Site_Config_API_Documentation.md) - 管理网站的基本配置信息
2. [MD 文件 API](#) - Markdown文件管理

## 其他模块文档

其他模块的API文档正在完善中...

## 认证

大部分API端点需要Bearer Token认证：
```
Authorization: Bearer <access_token>
```

## 响应格式

所有API响应都采用JSON格式，成功响应包含请求的数据，错误响应包含错误详情。

## 错误代码

- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `422` - 请求参数验证失败
- `500` - 服务器内部错误

## 在线文档

启动服务器后，可以访问以下地址查看交互式API文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc