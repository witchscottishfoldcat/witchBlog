import { NextResponse } from 'next/server'
import { getContentlayerPosts, type ContentlayerPost } from '@/lib/contentlayer-helper'

export async function GET() {
  try {
    // 使用辅助函数安全地获取 contentlayer posts
    const allPosts = await getContentlayerPosts()

    // 将 contentlayer posts 转换为可序列化的格式
    const posts = allPosts.map((post: ContentlayerPost) => ({
      slug: post.slug,
      title: post.title || '',
      description: post.description || '',
      date: post.date,
      category: post.category || '',
      tags: post.tags || [],
      author: post.author || '',
      encrypted: post.encrypted || false,
      // 只包含内容的前500个字符用于搜索（减少响应大小）
      contentPreview: post.body?.raw?.substring(0, 500) || '',
    }))

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ posts: [] }, { status: 500 })
  }
}
