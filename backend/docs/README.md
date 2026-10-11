# WitchCat Enterprise API - 企业级文字处理框架

一个完整的企业级 FastAPI 应用框架，专注于文字处理，包含用户认证、权限管理、数据分析等企业级功能。

## 🚀 功能特性

### 核心功能
- 🔐 **用户认证**: JWT令牌认证，支持用户注册、登录、权限管理
- 📝 **文本管理**: 完整的CRUD操作，支持分类、标签、公开/私有设置
- 📊 **文本分析**: 深度统计分析，包括字数、阅读时间、关键词提取
- 🔍 **全文搜索**: 支持标题和内容的全文搜索
- 🌐 **中英文支持**: 完美支持中文和英文文本处理

### 企业级特性
- 🏗️ **分层架构**: 清晰的MVC架构，代码结构规范
- 🗄️ **数据库支持**: PostgreSQL + SQLAlchemy ORM
- 📋 **数据迁移**: Alembic数据库版本管理
- 📝 **完整测试**: 单元测试和集成测试覆盖
- 🐳 **容器化**: Docker + Docker Compose部署
- 📊 **日志系统**: 结构化日志，支持文件轮转
- 🛡️ **安全防护**: CORS、限流、输入验证
- 📖 **API文档**: 自动生成Swagger和ReDoc文档
- 📁 **文件存储**: MinIO对象存储，支持MD文件上传和管理
- 🔗 **动态URL**: 自动刷新MinIO预签名URL，解决URL过期问题

## 📁 项目结构

```
witchcat-cn/
├── app/                     # 应用核心代码
│   ├── api/                 # API路由层
│   │   └── v1/             # API版本1
│   │       ├── endpoints/   # 具体端点
│   │       └── api.py      # 路由聚合
│   ├── core/               # 核心配置
│   │   ├── config.py       # 应用配置
│   │   ├── database.py     # 数据库配置
│   │   ├── security.py     # 安全相关
│   │   ├── logging.py      # 日志配置
│   │   └── exceptions.py   # 自定义异常
│   ├── models/             # 数据模型
│   │   ├── base.py         # 基础模型
│   │   ├── user.py         # 用户模型
│   │   └── text.py         # 文本模型
│   ├── schemas/            # Pydantic模式
│   │   ├── user.py         # 用户模式
│   │   ├── text.py         # 文本模式
│   │   └── token.py        # 令牌模式
│   ├── services/           # 业务逻辑层
│   │   ├── auth.py         # 认证服务
│   │   ├── user.py         # 用户服务
│   │   └── text.py         # 文本服务
│   ├── middleware/         # 中间件
│   │   ├── cors.py         # CORS中间件
│   │   └── logging.py      # 日志中间件
│   └── utils/              # 工具函数
│       └── helpers.py      # 辅助函数
├── tests/                  # 测试代码
│   ├── conftest.py         # 测试配置
│   ├── test_auth.py        # 认证测试
│   ├── test_users.py       # 用户测试
│   └── test_texts.py       # 文本测试
├── scripts/                # 脚本工具
│   └── init_db.py          # 数据库初始化
├── docker/                 # Docker配置
│   ├── Dockerfile          # 应用镜像
│   ├── docker-compose.yml  # 服务编排
│   └── nginx.conf          # Nginx配置
├── alembic/                # 数据库迁移
├── logs/                   # 日志文件
├── uploads/                # 上传文件
├── main.py                 # 应用入口
├── requirements.txt        # 依赖包
├── .env                    # 环境变量
├── alembic.ini            # Alembic配置
├── pyproject.toml         # 项目配置
├── Makefile               # 构建脚本
└── README.md              # 项目文档
```

## 🛠️ 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd witchcat-cn

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
make install  # 或 pip install -r requirements.txt
```

### 2. 配置环境

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

### 3. 数据库设置

```bash
# 初始化数据库
make init-db

# 或手动执行
python scripts/init_db.py
```

### 4. 启动服务

```bash
# 开发模式
make run  # 或 uvicorn main:app --reload

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 5. 访问应用

- API文档: http://localhost:8000/docs
- ReDoc文档: http://localhost:8000/redoc
- 健康检查: http://localhost:8000/health

## 🔧 MinIO URL配置

### 永久URL配置
本项目现已使用永久URL而不是会过期的预签名URL，避免了URL过期问题。

#### 使用永久URL的优势
- URL不会过期，可以长期使用
- 减少了系统开销，无需频繁刷新URL
- 数据库中存储的URL可以直接使用
- 简化了系统架构

#### 重要注意事项
使用永久URL需要将MinIO存储桶设置为**公开访问**，否则URL将无法访问。

#### 如何设置MinIO存储桶为公开访问
```bash
# 使用mc客户端设置存储桶策略
mc policy set public myminio/witchcat-files
```

或使用MinIO Web UI：
1. 登录MinIO控制台
2. 选择 `witchcat-files` 存储桶
3. 点击 "Summary" 标签
4. 在 "Access Policy" 下拉菜单中选择 "Public"
5. 保存设置

#### 更新现有文件的URL
如果您有之前使用预签名URL创建的文件，可以使用以下脚本更新为永久URL：
```bash
python scripts/update_to_permanent_urls.py
```

#### 测试永久URL
您可以使用以下脚本测试永久URL是否正常工作：
```bash
python scripts/test_permanent_urls.py
```

### 如果需要使用预签名URL
如果您出于安全考虑需要使用预签名URL（会过期），可以修改以下内容：

1. 修改 `app/services/minio_service.py` 中的 `get_file_url` 方法，将 `presigned` 参数默认值改为 `True`
2. 修改 `app/services/md_file.py` 中的 `create_file` 和 `update_file` 方法，使用 `minio_service.get_file_url(object_name, presigned=True)`

## 🐳 Docker部署

### 开发环境

```bash
# 构建并启动所有服务
make docker-up

# 查看服务状态
cd docker && docker-compose ps

# 查看日志
cd docker && docker-compose logs -f app
```

### 生产环境

```bash
# 构建镜像
make docker-build

# 启动服务
docker-compose -f docker/docker-compose.yml up -d
```

## 📚 API文档

### 认证接口

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=your-admin-user&password=your-admin-password
```

### 用户管理

```http
# 创建用户
POST /api/v1/users/
Authorization: Bearer <token>

# 获取当前用户
GET /api/v1/users/me
Authorization: Bearer <token>

# 更新用户信息
PUT /api/v1/users/me
Authorization: Bearer <token>
```

### 文本管理

```http
# 创建文本
POST /api/v1/texts/
Authorization: Bearer <token>

# 获取文本列表
GET /api/v1/texts/
Authorization: Bearer <token>

# 分析文本
POST /api/v1/texts/{id}/analyze
Authorization: Bearer <token>

# 搜索文本
GET /api/v1/texts/search?q=关键词
Authorization: Bearer <token>
```

## 🧪 测试

```bash
# 运行所有测试
make test

# 运行特定测试
pytest tests/test_auth.py -v

# 生成覆盖率报告
pytest --cov=app --cov-report=html
```

## 🔧 开发工具

```bash
# 代码格式化
make format

# 代码检查
make lint

# 清理临时文件
make clean

# 数据库迁移
make migration MSG="添加新字段"
make migrate
```

## 📊 监控和日志

### 日志配置

- 应用日志: `logs/app.log`
- 错误日志: `logs/app_error.log`
- 日志轮转: 每个文件最大10MB，保留5个备份

### 健康检查

```bash
curl http://localhost:8000/health
```

响应示例：
```json
{
  "status": "healthy",
  "service": "WitchCat Enterprise API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔒 安全特性

- JWT令牌认证
- 密码哈希存储
- CORS跨域保护
- 输入数据验证
- SQL注入防护
- 请求限流

## 📈 性能优化

- 数据库连接池
- Redis缓存支持
- 异步处理
- 分页查询
- 索引优化

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 运行测试
5. 创建Pull Request

## 📄 许可证

项目原创代码与文档采用 [CC BY-NC-SA 4.0](../../LICENSE)（署名、非商业性使用、相同方式共享）。该许可不强制交付完整软件源码，完整说明见 [项目 README](../../README.md#许可与素材)。第三方依赖与素材遵循各自原许可，见 [第三方说明](../../THIRD_PARTY_NOTICES.md)。

## 📞 支持

如有问题，请提交Issue或联系开发团队。

---

**WitchCat Enterprise API** - 构建现代化企业级应用的理想选择！
