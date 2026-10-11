#!/bin/bash

# 启动项目展示API服务

echo "启动项目展示API服务..."

# 激活虚拟环境
source .venv/bin/activate

# 安装新依赖
pip install -r requirements.txt

# 启动服务
python main.py

echo "服务已启动在 http://localhost:8001"
echo "API文档地址: http://localhost:8001/docs"
echo "项目API测试: python test_project_api.py"