# ==========================================
# 阶段一：构建环境 (Builder)
# ==========================================
FROM python:3.11-slim as builder

WORKDIR /app

# 1. 替换系统源为腾讯云内网源 (解决 apt-get 慢/失败问题)
RUN sed -i 's|http://deb.debian.org/debian|http://mirrors.tencentyun.com/debian|g' /etc/apt/sources.list.d/debian.sources &&     sed -i 's|http://deb.debian.org/debian-security|http://mirrors.tencentyun.com/debian-security|g' /etc/apt/sources.list.d/debian.sources

# 2. 安装编译依赖
RUN apt-get update && apt-get install -y --no-install-recommends     build-essential     libpq-dev     && rm -rf /var/lib/apt/lists/*

# 3. 准备 Python 虚拟环境
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 4. 复制依赖清单并安装 (使用腾讯云 PyPI 源; 同步升级 setuptools/wheel 修复 CVE-2025-47273/CVE-2026-24049)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel -i https://mirrors.tencentyun.com/pypi/simple &&     pip install --no-cache-dir -r requirements.txt -i https://mirrors.tencentyun.com/pypi/simple


# ==========================================
# 阶段二：运行环境 (Runtime)
# ==========================================
FROM python:3.11-slim as runtime

WORKDIR /app

# 1. 运行时也要换源 (否则安装 curl 会卡住)
RUN sed -i 's|http://deb.debian.org/debian|http://mirrors.tencentyun.com/debian|g' /etc/apt/sources.list.d/debian.sources &&     sed -i 's|http://deb.debian.org/debian-security|http://mirrors.tencentyun.com/debian-security|g' /etc/apt/sources.list.d/debian.sources

# 2. 安装运行时必要组件 (libpq5用于数据库, curl用于健康检查, gosu用于权限降级, tzdata用于时区; upgrade 同步基础镜像安全更新, 修复 util-linux/openssl 等 CVE)
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y upgrade && apt-get install -y --no-install-recommends     libpq5     curl     gosu     tzdata     && rm -rf /var/lib/apt/lists/*     && useradd --create-home --shell /bin/bash appuser

# 2.1 升级基础镜像自带的 /usr/local pip/setuptools/wheel (Trivy 会扫描此处; setuptools>=78.1.1 修复 CVE-2025-47273, wheel>=0.46.2 修复 CVE-2026-24049)
RUN /usr/local/bin/python -m pip install --no-cache-dir --upgrade pip setuptools wheel -i https://mirrors.tencentyun.com/pypi/simple

# 2.2 容器默认时区（基础镜像默认 UTC；日志时间戳与本地时间依赖它，可用运行时环境变量覆盖）
ENV TZ=Asia/Shanghai

# 3. 从第一阶段复制虚拟环境
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 4. 复制项目代码
COPY --chown=appuser:appuser . .

# 5. 创建日志目录并授权
RUN mkdir -p logs uploads &&     chown -R appuser:appuser logs uploads

# 6. 添加 entrypoint 脚本 (以 root 启动修复权限后降级到 appuser)
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 7. 端口与启动
EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
