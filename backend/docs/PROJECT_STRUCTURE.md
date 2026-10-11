# 项目文件结构说明

为了保持项目根目录的整洁，对根目录下的文件进行了分类整理，如下所示：

## 目录结构

```
witchcat-cn/
├── app/                    # 应用程序代码
├── alembic/               # 数据库迁移
├── docker/                # Docker配置
├── docs/                  # 项目文档
├── logs/                  # 日志文件
├── md/                    # Markdown文件
├── scripts/               # 脚本文件
├── tests/                 # 测试代码
├── test-scripts/          # 测试和调试脚本
├── demo-files/            # 示例和演示文件
├── deploy-scripts/        # 部署相关文件
├── api-docs/              # API文档
├── config.py              # 配置文件
├── main.py                # 主程序入口
├── requirements.txt       # Python依赖
├── alembic.ini            # 数据库迁移配置
├── docker-compose.yml     # Docker Compose配置
├── Dockerfile*            # Docker镜像构建文件
├── pyproject.toml         # 项目配置
├── README.md              # 项目说明
├── .env                   # 环境变量
└── witchcat.db            # 数据库文件
```

## 文件分类说明

### test-scripts/
- 所有测试和验证脚本：`check_*.py`, `debug_*.py`, `create_*.py`, `clear_*.py`
- 测试相关文档：`test_skill_projects.md`
- 测试服务器启动脚本：`start_test_server.py`
- 日志相关脚本：`run_with_loguru.py`

### demo-files/
- 演示HTML文件：`demo_*.html`, `upload_test.html`, `diary_test.html`
- 示例代码：`examples.py`

### deploy-scripts/
- 部署脚本：`deploy.sh`, `start_with_*.sh`, `start_with_*.bat`
- Makefile：项目构建和管理
- 工具脚本：`create_diary_curl.sh`

### api-docs/
- API使用文档：`*_API_*.md`, `API_Documentation.md`
- 异常处理文档：`EXCEPTION_HANDLING.md`
- 迁移指南：`Loguru_Migration_Guide.md`
- 问题分析报告：`8000端口占用问题分析报告.md`

## 常用脚本路径

- 测试脚本：`./test-scripts/`
- 演示文件：`./demo-files/`
- 部署脚本：`./deploy-scripts/`
- API文档：`./api-docs/`

## 使用说明

1. 如需运行测试脚本，请进入`test-scripts`目录
2. 如需查看演示文件，请进入`demo-files`目录
3. 如需执行部署操作，请使用`deploy-scripts`目录中的脚本
4. 如需查看API文档，请参考`api-docs`目录中的文档

这样的文件结构使项目更加整洁，便于维护和管理。