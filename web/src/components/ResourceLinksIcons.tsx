import { ResourceLink } from '@/lib/api'
import { getActiveResourceLinks } from '@/lib/resource-links-cache'

interface ResourceLinksIconsProps {
  limit?: number
}

/**
 * 根据 URL 智能识别网站图标
 */
function getIconFromUrl(url: string, category: ResourceLink['category']): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // 移除 www. 前缀
    const domain = hostname.replace(/^www\./, '')
    
    // 根据域名匹配图标
    const domainIconMap: Record<string, string> = {
      // 社交媒体
      'github.com': 'mdi:github',
      'gitlab.com': 'mdi:gitlab',
      'gitee.com': 'mdi:source-branch',
      'bitbucket.org': 'mdi:bitbucket',
      
      // 视频平台
      'bilibili.com': 'simple-icons:bilibili',
      'b23.tv': 'simple-icons:bilibili',
      'youtube.com': 'mdi:youtube',
      'youtu.be': 'mdi:youtube',
      'twitch.tv': 'mdi:twitch',
      'douyin.com': 'mdi:video',
      'tiktok.com': 'mdi:music-note',
      
      // 社交平台
      'weibo.com': 'mdi:weibo',
      'twitter.com': 'mdi:twitter',
      'x.com': 'mdi:twitter',
      'facebook.com': 'mdi:facebook',
      'instagram.com': 'mdi:instagram',
      'linkedin.com': 'mdi:linkedin',
      'zhihu.com': 'mdi:zhihu',
      'reddit.com': 'mdi:reddit',
      'discord.com': 'mdi:discord',
      'discord.gg': 'mdi:discord',
      
      // 技术社区
      'stackoverflow.com': 'mdi:stack-overflow',
      'dev.to': 'mdi:dev-to',
      'medium.com': 'mdi:medium',
      'csdn.net': 'simple-icons:csdn',
      'juejin.cn': 'mdi:code-json',
      'segmentfault.com': 'mdi:code-braces',
      
      // 博客平台
      'blog.csdn.net': 'simple-icons:csdn',
      'cnblogs.com': 'mdi:blog',
      'wordpress.com': 'mdi:wordpress',
      
      // 其他
      'npmjs.com': 'mdi:npm',
      'pypi.org': 'mdi:language-python',
      'docker.com': 'mdi:docker',
    }
    
    // 先尝试精确匹配域名
    if (domainIconMap[domain]) {
      return domainIconMap[domain]
    }
    
    // 尝试部分匹配（如 subdomain.github.io）
    for (const [key, icon] of Object.entries(domainIconMap)) {
      if (domain.includes(key)) {
        return icon
      }
    }
  } catch {
    // URL 解析失败，使用分类映射
  }
  
  // 如果 URL 匹配失败，使用分类映射
  const categoryIconMap: Record<ResourceLink['category'], string> = {
    bilibili: 'simple-icons:bilibili',
    douyin: 'mdi:video',
    weibo: 'mdi:weibo',
    zhihu: 'mdi:zhihu',
    github: 'mdi:github',
    personal: 'mdi:link-variant',
    other: 'mdi:link',
  }
  
  return categoryIconMap[category] || 'mdi:link'
}

/**
 * 资源链接图标组件
 * 从 API 获取资源链接列表并转换为图标格式，用于 ProfileCard
 */
export default async function ResourceLinksIcons({ limit = 10 }: ResourceLinksIconsProps) {
  // 获取资源链接列表
  const resourceLinks = await getActiveResourceLinks(limit)

  // 转换为 ProfileCard 需要的格式，智能识别图标
  return resourceLinks.map((link) => ({
    title: link.title,
    url: link.url,
    icon: getIconFromUrl(link.url, link.category),
  }))
}

