# WitchCat博客系统部署文档

## 概述

本文档记录了WitchCat Enterprise API博客系统在腾讯云轻量应用服务器(Lighthouse)上的部署过程，为后续部署提供参考方案。

## 服务器信息

- 服务器实例：<your-instance-id> (你的站点名称)
- 地域：<your-region>
- 公网IP：<your-server-ip>
- 操作系统：Ubuntu

## 项目架构

- 应用类型：FastAPI REST API
- Python版本：3.12
- 数据库：MySQL (外部服务)
- 存储服务：MinIO (外部服务)
- 主要功能：博客内容管理、用户认证、文本分析等

## 部署流程

### 1. 环境准备

1. **项目准备**
   - 确保项目根目录包含以下关键文件：
     - `main.py` - 应用入口
     - `requirements.txt` - Python依赖
     - `Dockerfile` (可选，容器化部署使用)
     - `docker-compose.yml` (可选，容器化部署使用)

2. **服务器环境检查**
   ```bash
   python3 --version  # 确认Python版本
   pip3 --version     # 确认pip版本
   ```

### 2. 项目上传

使用腾讯云Lighthouse集成工具上传项目：

```bash
deploy_project_preparation
- 文件夹路径: ./backend
- 实例ID: <your-instance-id>
- 地域: <your-region>
- 项目名称: witchcat-blog
```

项目上传后会创建目录: `/root/witchcat-cn_时间戳`

### 3. Python虚拟环境部署方案

#### 3.1 创建虚拟环境

```bash
cd /root/witchcat-cn_时间戳
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```

#### 3.2 安装依赖

```bash
pip install -r requirements.txt
```

注意：可能会遇到一些依赖安装警告，如email-validator，但一般不影响使用。

#### 3.3 停止占用端口的进程

如果目标端口已被占用：

```bash
fuser -k 8000/tcp  # 停止8000端口的进程
```

#### 3.4 启动应用

```bash
cd /root/witchcat-cn_时间戳
source venv/bin/activate
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > app.log 2>&1 &
```

### 4. 防火墙配置

使用腾讯云Lighthouse集成工具开放所需端口：

```bash
create_firewall_rules
- 协议: TCP
- 端口: 8000
- 动作: ACCEPT
- 描述: 开放8000端口供WitchCat Blog访问
```

### 5. 验证部署

#### 5.1 检查端口监听

```bash
netstat -tlnp | grep 8000
# 应该看到类似输出: tcp 0 0 0.0.0.0:8000 0.0.0.0:* LISTEN [进程ID]/python
```

#### 5.2 测试本地访问

```bash
curl http://localhost:8000/health
# 预期响应: {"status":"healthy","service":"WitchCat Enterprise API","version":"1.0.2","timestamp":"2024-01-01T00:00:00Z"}

curl http://localhost:8000/
# 预期响应: 应用信息JSON
```

#### 5.3 检查应用日志

```bash
tail -30 app.log
# 查看应用启动和运行日志
```

#### 5.4 测试外部访问

通过浏览器或curl访问:
```bash
curl http://[公网IP]:8000/
# 例如: curl http://localhost:8000/
```

## 注意事项

### 1. 端口冲突处理

- 8000是常用的Web服务端口，可能被其他服务占用
- 如遇端口冲突，可使用其他端口(如8001)，并相应更新防火墙规则
- 使用`netstat -tlnp`查看端口占用情况
- 使用`fuser -k 端口/tcp`停止占用端口的进程

### 2. 依赖安装问题

- 某些依赖包可能存在版本兼容性问题
- email-validator 2.1.0可能会有yanked版本警告，但一般不影响使用
- 如遇到严重依赖问题，可考虑使用Docker容器化部署

### 3. 外部服务配置

- 应用依赖外部MySQL和MinIO服务
- 需确保这些服务的连接配置正确
- 检查`.env`文件或环境变量中的数据库和存储服务配置

### 4. 安全考虑

- 生产环境应配置适当的认证和授权
- 考虑使用HTTPS加密通信
- 定期更新依赖包以修复安全漏洞

## 替代部署方案

### Docker容器化部署

如果选择Docker部署，可按以下步骤：

1. **构建Docker镜像**
   ```bash
   cd /root/witchcat-cn_时间戳
   docker build -t witchcat-blog .
   ```

2. **运行容器**
   ```bash
   docker run -d --name witchcat-blog -p 8000:8000 witchcat-blog
   ```

3. **或使用docker-compose**
   ```bash
   docker-compose up -d
   ```

## 监控与维护

### 1. 应用监控

- 定期检查应用日志: `tail -f app.log`
- 监控系统资源使用情况
- 设置健康检查端点监控

### 2. 更新部署

1. 停止当前应用: `fuser -k 8000/tcp`
2. 更新代码或依赖
3. 重新启动应用
4. 验证部署成功

### 3. 故障排查

- 检查端口是否正确监听
- 查看应用日志中的错误信息
- 验证外部服务连接
- 检查防火墙规则配置

## 总结

本次部署采用了Python虚拟环境方案，直接在服务器上运行应用。这种方案简单直接，适合中小型应用。对于生产环境，建议考虑容器化部署方案，以提高环境一致性和可移植性。

部署完成后，应用可通过以下地址访问：
- 主页: http://localhost:8000/
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health
