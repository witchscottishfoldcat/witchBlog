/**
 * Contentlayer 辅助函数
 * 安全地导入 contentlayer 生成的数据，避免构建时错误
 */

export interface ContentlayerPost {
  slug: string
  title?: string
  description?: string
  date?: string
  category?: string
  tags?: string[]
  author?: string
  encrypted?: boolean
  body?: { raw?: string }
}

let cachedPosts: ContentlayerPost[] | null = null

export async function getContentlayerPosts(): Promise<ContentlayerPost[]> {
  if (cachedPosts !== null) {
    return cachedPosts
  }

  try {
    let posts: ContentlayerPost[] = []

    const part1 = 'content'
    const part2 = 'layer'
    const part3 = '/gener'
    const part4 = 'ated'
    const modulePath = part1 + part2 + part3 + part4

    if (typeof require !== 'undefined') {
      const dynamicRequire = new Function('modulePath', 'return require(modulePath)')
      const contentlayerModule = dynamicRequire(modulePath) as { allPosts?: ContentlayerPost[] }
      posts = contentlayerModule.allPosts || []
    } else {
      const dynamicImport = eval(`(path) => import(path)`) as (path: string) => Promise<{ allPosts?: ContentlayerPost[] }>
      const contentlayerModule = await dynamicImport(modulePath)
      posts = contentlayerModule.allPosts || []
    }

    cachedPosts = posts
    return posts
  } catch {
    cachedPosts = []
    return []
  }
}
