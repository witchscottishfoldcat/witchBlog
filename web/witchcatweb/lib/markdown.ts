import matter from 'gray-matter';
import { BlogPost } from '@/types';

export function parseMarkdown(content: string, slug: string): BlogPost {
  const { data, content: markdownContent } = matter(content);
  
  // 计算字数（简单计算，中文字符算1，英文单词算1）
  const wordCount = markdownContent
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  return {
    slug,
    title: data.title || '',
    date: data.date || new Date().toISOString(),
    category: data.category || '',
    wordCount,
    description: data.description || '',
    tags: data.tags || [],
    content: markdownContent,
    encrypted: data.encrypted || false,
  };
}

export function getAllPosts(): BlogPost[] {
  // 这个函数将在运行时读取文件系统
  // 在 Next.js 中，我们需要使用动态导入或 API 路由
  return [];
}

