# MizukiUI - 二次元风格博客

一个基于 Next.js 16 构建的现代化、二次元风格的博客系统，支持 Markdown 渲染和中英文切换。

## ✨ 特性

- 🎨 **二次元风格设计** - 精美的 UI 设计，参考现代二次元网站风格
- 📝 **Markdown 支持** - 完整的 Markdown 渲染，支持代码高亮、表格、列表等
- 🌐 **国际化** - 支持中英文切换
- 🎯 **响应式设计** - 完美适配移动端和桌面端
- 🌙 **暗色模式** - 自动适配系统主题
- 🎵 **音乐播放器** - 浮动音乐播放器组件
- 📱 **现代化 UI** - 使用 Tailwind CSS v4 构建

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
witchcatweb/
├── app/
│   ├── [locale]/          # 国际化路由
│   │   ├── layout.tsx     # 布局组件
│   │   ├── page.tsx       # 首页
│   │   └── posts/         # 博客文章
│   └── layout.tsx         # 根布局
├── components/            # React 组件
│   ├── Navbar.tsx        # 导航栏
│   ├── Hero.tsx          # 英雄区域
│   ├── Sidebar.tsx       # 侧边栏
│   ├── PostCard.tsx      # 文章卡片
│   ├── MarkdownContent.tsx # Markdown 渲染
│   └── MusicPlayer.tsx   # 音乐播放器
├── content/
│   └── posts/            # Markdown 文章
├── lib/                  # 工具函数
│   ├── markdown.ts       # Markdown 解析
│   └── i18n.ts          # 国际化配置
├── messages/             # 翻译文件
│   ├── zh.json          # 中文翻译
│   └── en.json          # 英文翻译
└── types/                # TypeScript 类型定义
```

## 📝 添加博客文章

在 `content/posts/` 目录下创建 `.md` 文件，使用以下 frontmatter 格式：

```markdown
---
title: 文章标题
date: 2025-01-20
category: 分类
description: 文章描述
tags:
  - 标签1
  - 标签2
encrypted: false
---

# 文章内容

你的 Markdown 内容...
```

## 🎨 自定义样式

项目使用 Tailwind CSS v4，你可以在 `app/[locale]/globals.css` 中自定义样式。

## 🌐 国际化

- 默认语言：中文 (zh)
- 支持语言：中文 (zh)、英文 (en)
- 翻译文件位于 `messages/` 目录

## 🛠️ 技术栈

- **框架**: Next.js 16.0.4
- **UI 库**: React 19.2.0
- **样式**: Tailwind CSS v4
- **Markdown**: react-markdown + remark-gfm
- **国际化**: next-intl
- **类型**: TypeScript 5

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
