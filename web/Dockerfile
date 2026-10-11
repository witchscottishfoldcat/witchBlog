# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine AS base

# 升级系统包，修复基础镜像中已披露的 openssl 等 HIGH/CRITICAL 漏洞
RUN apk upgrade --no-cache

# 安装依赖阶段
FROM base AS deps
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制package文件和scripts目录
COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm ci --legacy-peer-deps --registry=${NPM_REGISTRY}

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建时配置（NEXT_PUBLIC_* 会内联进产物，必须是真实部署地址）
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
ARG IMAGE_SERVER_HOSTS=""
ARG NEXT_PUBLIC_IMAGE_PROXY_HOSTS=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# 服务端图片白名单：生成 images.remotePatterns，缺省时 /_next/image 会返回 400
ENV IMAGE_SERVER_HOSTS=$IMAGE_SERVER_HOSTS
# 客户端图片代理主机：决定浏览器是否改走 /api/proxy-image
ENV NEXT_PUBLIC_IMAGE_PROXY_HOSTS=$NEXT_PUBLIC_IMAGE_PROXY_HOSTS

# 构建应用
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 运行时只执行 node server.js，不需要 npm/npx；
# 移除可同时消除 npm 自带依赖（tar、minimatch 等）带来的扫描告警
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 配置后端API地址与图片白名单（/api/proxy-image 在运行时读取 IMAGE_SERVER_HOSTS）
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
ARG IMAGE_SERVER_HOSTS=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV IMAGE_SERVER_HOSTS=$IMAGE_SERVER_HOSTS

USER nextjs

# 暴露8888端口
EXPOSE 8888

# 设置端口环境变量
ENV PORT=8888

# 启动应用
CMD ["node", "server.js"]

