# WitchCatUI - Personal Blog

一个基于 Next.js 15 构建的现代化、二次元风格的博客系统，支持 Markdown 渲染、国际化、主题切换等功能。

## ✨ 特性

- 🎨 **二次元风格设计** - 精美的 UI 设计，参考现代二次元网站风格
- 📝 **Markdown 支持** - 完整的 Markdown 渲染，支持代码高亮、表格、列表等
- 🌐 **国际化** - 支持中英文切换（基于 next-intl）
- 🎯 **响应式设计** - 完美适配移动端和桌面端
- 🌙 **暗色模式** - 自动适配系统主题，支持主题切换
- 🎵 **音乐播放器** - 浮动音乐播放器组件
- 📱 **现代化 UI** - 使用 Tailwind CSS 构建
- 🚀 **性能优化** - 代码分割、图片优化、懒加载等

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm/yarn/pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 环境变量配置

复制 `.env.example` 文件为 `.env.local` 并配置以下变量：

```env
# API 配置
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# CORS 配置（多个来源用逗号分隔）
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
witchcatcnweb/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── [locale]/    # 国际化路由
│   │   └── api/         # API 路由
│   ├── components/      # React 组件
│   ├── lib/            # 工具函数和 API 客户端
│   ├── config/         # 配置文件
│   ├── hooks/          # React Hooks
│   ├── messages/       # 国际化翻译文件
│   └── types/          # TypeScript 类型定义
├── content/            # Contentlayer 内容文件
│   └── posts/          # Markdown 文章
├── public/             # 静态资源
│   └── scripts/        # 客户端脚本
└── scripts/           # 构建脚本
```

## 🛠️ 技术栈

- **框架**: Next.js 15
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **国际化**: next-intl
- **内容管理**: Contentlayer
- **Markdown**: react-markdown + remark-gfm
- **图标**: @iconify/react

## 📝 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run dev:no-turbo` - 启动开发服务器（禁用 Turbopack）
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint 检查
- `npm run verify-assets` - 验证静态资源

## 🌍 国际化

项目支持中英文切换，翻译文件位于 `src/messages/` 目录：
- `zh.json` - 中文翻译
- `en.json` - 英文翻译

## 🎨 主题系统

项目支持亮色/暗色主题切换，主题配置通过 CSS 变量实现，位于 `src/app/globals.css`。

## 📚 主要功能

- **博客文章**: 支持 Markdown 格式的文章展示
- **归档**: 按年份归档的文章列表
- **友链**: 友情链接管理
- **项目展示**: 项目列表和详情
- **技能展示**: 技能标签和统计
- **时间线**: 时间线展示
- **日记**: 日记功能
- **图库**: 图片展示

## 🔧 开发指南

### 添加新页面

1. 在 `src/app/[locale]/` 下创建新的页面目录
2. 创建 `page.tsx` 文件
3. 添加对应的国际化翻译

### 添加新组件

1. 在 `src/components/` 下创建组件文件
2. 使用 TypeScript 和 Tailwind CSS
3. 确保组件支持暗色模式

### API 集成

API 客户端位于 `src/lib/api.ts`，使用统一的错误处理和超时配置。

## 📄 许可证

项目原创代码与文档采用 [CC BY-NC-SA 4.0](../LICENSE)（署名、非商业性使用、相同方式共享）。该许可不强制交付完整软件源码，完整说明见 [项目 README](../README.md#许可与素材)。第三方素材遵循各自原许可，见 [第三方说明](../THIRD_PARTY_NOTICES.md)。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请提交 Issue。
