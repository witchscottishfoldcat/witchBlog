@echo off

REM 启动项目展示API服务

echo 启动项目展示API服务...

REM 激活虚拟环境
call .venv\Scripts\activate

REM 安装新依赖
pip install -r requirements.txt

REM 启动服务
python main.py

echo 服务已启动在 http://localhost:8001
echo API文档地址: http://localhost:8001/docs
echo 项目API测试: python test_project_api.py