.PHONY: help install dev-install test lint format clean docker-build docker-up docker-down init-db

# 默认目标
help:
	@echo "WitchCat Enterprise API - 可用命令:"
	@echo ""
	@echo "  install      - 安装生产依赖"
	@echo "  dev-install  - 安装开发依赖"
	@echo "  test         - 运行测试"
	@echo "  lint         - 代码检查"
	@echo "  format       - 代码格式化"
	@echo "  clean        - 清理临时文件"
	@echo "  init-db      - 初始化数据库"
	@echo "  docker-build - 构建Docker镜像"
	@echo "  docker-up    - 启动Docker服务"
	@echo "  docker-down  - 停止Docker服务"
	@echo "  run          - 运行开发服务器"

# 安装依赖
install:
	pip install -r requirements.txt

# 安装开发依赖
dev-install:
	pip install -r requirements.txt
	pip install -e .

# 运行测试
test:
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term

# 代码检查
lint:
	flake8 app/ tests/
	mypy app/

# 代码格式化
format:
	black app/ tests/
	isort app/ tests/

# 清理临时文件
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

# 初始化数据库
init-db:
	python scripts/init_db.py

# Docker构建
docker-build:
	docker build -f docker/Dockerfile -t witchcat-api .

# Docker启动服务
docker-up:
	cd docker && docker-compose up -d

# Docker停止服务
docker-down:
	cd docker && docker-compose down

# 运行开发服务器
run:
	python run_with_loguru.py

# 数据库迁移
migration:
	alembic revision --autogenerate -m "$(MSG)"

# 应用数据库迁移
migrate:
	alembic upgrade head

# 创建超级用户
createsuperuser:
	python scripts/create_superuser.py

# 初始化站点配置
init-site-config:
	python scripts/init_site_config.py