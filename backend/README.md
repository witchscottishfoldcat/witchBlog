# WitchCat Enterprise API

巫猫博客的后端 API 服务，基于 FastAPI 构建。

## 快速开始

```bash
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env    # 按需修改数据库 / MinIO / AI Key 等配置
python main.py          # http://localhost:8000，交互式文档见 /docs
```

- 环境变量说明见 [.env.example](./.env.example) 内注释
- 访客统计依赖离线 IP 库 `data/qqwry.dat`（见仓库根 README，缺失时自动降级）
- 数据库迁移：`alembic upgrade head`
- 测试：`pytest`
- 质量脚本（静态检查 / 覆盖率闸门）：见 [scripts/README.md](./scripts/README.md)

## 文档

详细文档见 [docs/](./docs)：项目结构、API 用法（[api-docs/](./api-docs)）、AI 集成、
部署指南、定时任务、音乐 API 等。
