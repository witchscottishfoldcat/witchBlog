#!/bin/bash

# WitchCat 项目部署脚本
# 用于简化后续部署流程

set -e  # 遇到错误立即退出

echo "=== WitchCat 项目部署脚本 ==="

# 配置变量
PROJECT_NAME="witchcat-cn"
APP_DIR="/opt/$PROJECT_NAME"
BACKUP_DIR="/opt/backups/$PROJECT_NAME"
SERVICE_NAME="witchcat-api"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 函数：打印带时间戳的消息
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log "错误: $1 命令未找到，请先安装"
        exit 1
    fi
}

# 检查必要的命令
check_command "git"
check_command "docker"

# 函数：数据库迁移
run_migrations() {
    log "运行数据库迁移..."
    cd "$APP_DIR"
    python -m alembic upgrade head
    log "数据库迁移完成"
}

# 函数：重启服务
restart_service() {
    log "重启服务..."
    if docker ps | grep -q $SERVICE_NAME; then
        docker stop $SERVICE_NAME
    fi
    
    cd "$APP_DIR"
    docker-compose up -d
    log "服务重启完成"
}

# 函数：健康检查
health_check() {
    log "执行健康检查..."
    sleep 10  # 等待服务启动
    
    for i in {1..5}; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            log "健康检查通过"
            return 0
        fi
        log "健康检查失败，重试中... ($i/5)"
        sleep 10
    done
    
    log "健康检查失败，请检查日志"
    return 1
}

# 主部署流程
main() {
    log "开始部署 $PROJECT_NAME..."
    
    # 如果是全新部署，克隆仓库
    if [ ! -d "$APP_DIR" ]; then
        log "首次部署，克隆仓库..."
        git clone <YOUR_REPOSITORY_URL> "$APP_DIR"
    else
        # 备份当前版本
        log "备份当前版本..."
        if [ -f "$APP_DIR/.env" ]; then
            cp "$APP_DIR/.env" "$BACKUP_DIR/.env.$TIMESTAMP"
        fi
        
        # 拉取最新代码
        log "拉取最新代码..."
        cd "$APP_DIR"
        git pull origin main
    fi
    
    # 更新依赖（如果需要）
    log "检查并更新依赖..."
    cd "$APP_DIR"
    
    # 检查 requirements.txt 是否有变化
    if git diff --name-only HEAD~1 HEAD | grep -q "requirements.txt"; then
        log "检测到 requirements.txt 变化，更新依赖..."
        pip install -r requirements.txt
    fi
    
    # 检查是否需要运行迁移
    if git diff --name-only HEAD~1 HEAD | grep -q "alembic/versions/"; then
        run_migrations
    fi
    
    # 重启服务
    restart_service
    
    # 健康检查
    if health_check; then
        log "部署成功！"
    else
        log "部署失败，回滚..."
        if [ -f "$BACKUP_DIR/.env.$TIMESTAMP" ]; then
            cp "$BACKUP_DIR/.env.$TIMESTAMP" "$APP_DIR/.env"
            restart_service
            log "已回滚到之前版本"
        fi
        exit 1
    fi
}

# 执行主函数
main "$@"