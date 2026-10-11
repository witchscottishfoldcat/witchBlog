# 第一阶段：构建阶段
FROM node:22-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：生产阶段 - 使用Nginx
FROM nginx:alpine

# 升级基础镜像中存在已知漏洞的包（Trivy 门禁 HIGH/CRITICAL 零容忍）
# - libexpat: CVE-2026-93990，要求 >= 2.8.5-r0
# - pcre2: CVE-2026-103111（正则越界写入），要求 >= 10.49-r0
RUN apk upgrade --no-cache libexpat pcre2

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 8080

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
