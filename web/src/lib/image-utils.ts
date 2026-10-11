/**
 * 图片 URL 处理工具
 * 统一处理图片 URL，包括代理转换和本地路径处理
 */

import avatarImage from '@/assets/images/avatar.webp'
import { profileConfig } from '@/config/assets'

/** 内置匹配关键字（本机 / MinIO / S3 等通用约定，不含内网拓扑信息） */
const BUILTIN_PROXY_IMAGE_HOST_PATTERNS = [
  'minio',
  'amazonaws.com',
  'localhost',
  '127.0.0.1',
] as const

/**
 * 需要走 /api/proxy-image 的主机/关键字（MinIO / 内网 / 旧公网）
 * 真实 IP 从 NEXT_PUBLIC_IMAGE_PROXY_HOSTS 读取（逗号分隔），
 * 避免硬编码进仓库；本地开发在 .env.local 中配置
 */
export const PROXY_IMAGE_HOST_PATTERNS: readonly string[] = [
  ...BUILTIN_PROXY_IMAGE_HOST_PATTERNS,
  ...(process.env.NEXT_PUBLIC_IMAGE_PROXY_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean),
]

/**
 * 将后端返回的绝对 OSS 代理地址规范为站点相对路径
 * 例如 http://127.0.0.1:8000/api/v1/proxy/oss/xxx → /api/v1/proxy/oss/xxx
 * 由 next.config rewrites 转发到 NEXT_PUBLIC_API_URL，避免浏览器直连错误主机
 */
export function toRelativeOssProxyUrl(url: string): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('/api/v1/proxy/oss')) {
    return trimmed
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed)
      if (parsed.pathname.startsWith('/api/v1/proxy/oss')) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    }
  } catch {
    // ignore parse errors
  }

  // 无协议但以 api/v1/proxy/oss 开头
  if (trimmed.startsWith('api/v1/proxy/oss')) {
    return `/${trimmed}`
  }

  return null
}

/**
 * 检查 URL 是否需要代理
 * 包括 MinIO、AWS S3 和特定 IP 地址
 */
export function isProxyUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  // 已是本站代理或后端 OSS 代理路径，不再二次包装
  if (url.startsWith('/api/proxy-image')) return false
  if (url.startsWith('/api/v1/proxy/oss')) return false
  if (toRelativeOssProxyUrl(url)) return false

  // 本地路径不需要代理
  if (url.startsWith('/')) return false

  // 检查是否是 HTTP/HTTPS URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false

  return PROXY_IMAGE_HOST_PATTERNS.some((pattern) => url.includes(pattern))
}

/**
 * 获取图片代理 URL
 */
export function getProxyImageUrl(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

/**
 * 处理头像 URL
 * 如果是本地路径或默认头像，返回对应的资源
 * 如果是需要代理的 URL，返回代理 URL
 * 否则返回原始 URL
 */
export function getAvatarUrl(url: string | null | undefined): string | typeof avatarImage {
  // 如果没有 URL，返回默认头像
  if (!url) {
    return profileConfig.avatar === '/assets/images/avatar.webp' ||
      profileConfig.avatar === '/src/assets/images/avatar.webp'
      ? avatarImage
      : profileConfig.avatar
  }

  const ossRelative = toRelativeOssProxyUrl(url)
  if (ossRelative) return ossRelative

  // 本地路径处理
  if (url.startsWith('/')) {
    if (url === '/assets/images/avatar.webp' || url === '/src/assets/images/avatar.webp') {
      return avatarImage
    }
    return url
  }

  // 需要代理的 URL
  if (isProxyUrl(url)) {
    return getProxyImageUrl(url)
  }

  // 其他 HTTP URL 直接返回
  return url
}

/**
 * 处理通用图片 URL（日记 / 相册 / 封面等）
 * - 空值 → ''
 * - 已是代理路径 → 原样返回
 * - 后端 OSS 代理（绝对或相对）→ 站点相对 `/api/v1/proxy/oss/...`（next rewrite）
 * - 内网/MinIO 绝对地址 → 包装为 `/api/proxy-image?url=...`
 * - 其他 http(s) / 本地路径 → 原样返回
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  // 已是本站图片代理
  if (trimmed.startsWith('/api/proxy-image')) {
    return trimmed
  }

  // 后端 OSS 代理：无论相对还是带 127.0.0.1 等错误主机，统一改成相对路径
  const ossRelative = toRelativeOssProxyUrl(trimmed)
  if (ossRelative) {
    return ossRelative
  }

  // 本地路径
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // 需要代理的绝对 URL（MinIO 直链等）
  if (isProxyUrl(trimmed)) {
    return getProxyImageUrl(trimmed)
  }

  // 其他 http(s)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return trimmed
}

/**
 * 判断渲染时是否应使用原生 <img>（避免 next/image 对代理/外部域的限制）
 */
export function shouldUseNativeImg(url: string): boolean {
  if (!url) return false
  return (
    url.startsWith('/api/proxy-image') ||
    url.startsWith('/api/v1/proxy/oss') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  )
}
