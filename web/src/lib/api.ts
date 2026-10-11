/**
 * API 客户端
 */

import type { AnimeEntry } from '@/components/AnimeList'
import { API_TIMEOUT, getApiBaseUrl } from './env'
import { getImageUrl } from './image-utils'
import { logger } from './logger'
import { normalizeTags } from './post-utils'
import { DEFAULT_VALUES, API, IMAGE } from '@/constants'

const API_BASE_URL = getApiBaseUrl()

// 默认占位图片：当视频平台不支持或获取失败时使用
const DEFAULT_ANIME_COVER_IMAGE = IMAGE.DEFAULT_COVER

// 在服务器端，可以直接使用环境变量或默认值
// 在客户端，需要使用 NEXT_PUBLIC_ 前缀的环境变量

export interface MdFile {
  title: string
  description: string
  tags: string
  is_public: boolean
  id: number
  original_filename: string
  object_name: string
  bucket_name: string
  file_size: number
  file_url: string
  etag: string
  word_count: number
  owner_id: number
  created_at: string
  updated_at: string
  // 新增的元数据字段（从 front-matter 解析）
  published?: string | null // 发布日期
  category?: string | null // 文章分类
  subcategory?: string | null // 文章二级分类
  pinned?: boolean | null // 是否置顶
  encrypted?: boolean | null // 是否加密
  author?: string | null // 作者
  parsed_metadata?: Record<string, unknown> | null // 完整的解析元数据（JSON格式）
}

export interface MdFilesResponse {
  files: MdFile[]
  total: number
}

export interface MdFilesParams {
  skip?: number
  limit?: number
  search?: string
}

/**
 * 归档文件接口
 * 对应后端 /api/v1/md-file-archive/archives 返回的数据结构
 */
export interface Archive {
  original_file_id: number
  title: string
  description: string
  original_filename: string
  archive_object_name: string
  bucket_name: string
  file_size: number
  file_url: string
  etag: string
  word_count: number
  is_public: boolean
  tags: string
  archive_reason: string
  id: number
  archive_date: string
  owner_id: number
  created_at: string
  updated_at: string
  // 新增的元数据字段（从 front-matter 解析）
  published?: string | null // 发布日期
  category?: string | null // 文章分类
  subcategory?: string | null // 文章二级分类
  pinned?: boolean | null // 是否置顶
  encrypted?: boolean | null // 是否加密
  author?: string | null // 作者
  parsed_metadata?: Record<string, unknown> | null // 完整的解析元数据（JSON格式）
  // 代理 URL（用于通过缓存代理获取文件内容）
  proxy_url?: string | null // 例如：/api/proxy/md/18
}

/**
 * 获取归档文件列表的查询参数
 */
export interface ArchivesParams {
  skip?: number
  limit?: number
  is_public?: boolean | null
  search?: string | null
}

/**
 * 站点公开配置
 * 对应后端 /api/v1/site-config/public 返回的数据结构
 */
export interface PublicSiteConfig {
  site_name: string
  site_signature: string | null
  site_announcement: string | null
  site_icon: string | null  // 站点图标（favicon）URL
  profile_image: string | null
  rss_url: string | null
}

const DEFAULT_PUBLIC_SITE_CONFIG: PublicSiteConfig = {
  site_name: DEFAULT_VALUES.SITE_NAME,
  site_signature: null,
  site_announcement: null,
  site_icon: null,
  profile_image: null,
  rss_url: null,
}

/**
 * 获取公开 MD 文件列表
 */
export async function getPublicMdFiles(params: MdFilesParams = {}): Promise<MdFilesResponse> {
  const { skip = API.DEFAULT_SKIP, limit = API.DEFAULT_LIMIT, search } = params

  const searchParams = new URLSearchParams()
  searchParams.set('skip', skip.toString())
  searchParams.set('limit', limit.toString())
  if (search) {
    searchParams.set('search', search)
  }

  const url = `${API_BASE_URL}/api/v1/md-files/public?${searchParams.toString()}`

  try {
    // 创建超时控制器：生产环境使用更长的超时时间
    const controller = new AbortController()
    const timeout = process.env.NODE_ENV === 'production' ? 10000 : 2000 // 生产环境 10 秒，开发环境 2 秒
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 使用 ISR：文章列表不经常变化，缓存 120 秒（优化首屏加载）
      next: { revalidate: 120 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误（如 502 Bad Gateway），直接返回空数据，不抛出错误
      if (response.status >= 500) {
        logger.warn(`MD Files API returned ${response.status}, returning empty data`)
        return { files: [], total: 0 }
      }
      // 对于其他错误，也返回空数据
      logger.warn(`MD Files request failed: ${response.status} ${response.statusText}, returning empty data`)
      return { files: [], total: 0 }
    }

    const data: MdFilesResponse = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('MD Files API request failed (network/timeout), returning empty data:', error.message)
      } else {
        logger.error('Failed to fetch MD files:', error.message)
      }
    } else {
      logger.error('Failed to fetch MD files:', error)
    }
    // 始终返回空数据，确保页面不会崩溃
    return { files: [], total: 0 }
  }
}

/**
 * 根据 ID 获取单个 MD 文件
 */
export async function getMdFileById(id: number): Promise<MdFile | null> {
  try {
    const response = await getPublicMdFiles({ skip: 0, limit: 1000 })
    const file = response.files.find(f => f.id === id)
    return file || null
  } catch (error) {
    logger.error('Failed to fetch MD file by ID:', error)
    return null
  }
}

// Markdown 文件内容缓存（内存缓存，避免重复请求）
const mdFileContentCache = new Map<string, { content: string; timestamp: number }>()
const CACHE_TTL = 1 * 60 * 1000 // 1分钟缓存，确保更新及时显示

/**
 * 根据 file_id 或 file_url 获取 Markdown 文件内容（带缓存）
 * 优先使用代理端点 /api/proxy/md/{file_id}，如果传入的是 URL 则直接使用
 * 如果代理端点失败（404/500），会自动回退到使用 fallbackUrl（OSS 地址）
 * 
 * @param fileIdOrUrl - MD文件的ID（数字）或文件URL（字符串）
 * @param useCache - 是否使用缓存
 * @param forceRefresh - 是否强制刷新缓存（仅在使用代理端点时有效）
 * @param fallbackUrl - 当代理端点失败时的回退 URL（OSS 地址）
 */
export async function getMdFileContent(
  fileIdOrUrl: number | string,
  useCache = true,
  forceRefresh = false,
  fallbackUrl?: string
): Promise<string> {
  // 判断是 file_id 还是 file_url
  const isFileId = typeof fileIdOrUrl === 'number'
  const cacheKey = isFileId ? `md_file_${fileIdOrUrl}` : fileIdOrUrl

  // 检查缓存
  if (useCache && !forceRefresh) {
    const cached = mdFileContentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.content
    }
  }

  try {
    let url: string
    let fetchOptions: RequestInit

    if (isFileId) {
      // 在服务端组件中，直接调用后端 API（避免相对路径问题）
      // 在客户端，使用 Next.js API route
      const isServer = typeof window === 'undefined'

      if (isServer) {
        // 服务端：直接调用后端 API
        const params = new URLSearchParams()
        if (forceRefresh) {
          params.set('force_refresh', 'true')
        }
        url = `${API_BASE_URL}/api/v1/proxy/md/${fileIdOrUrl}${params.toString() ? `?${params.toString()}` : ''}`
        fetchOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // 使用缓存策略，减少重复请求
          next: { revalidate: 60 }, // 60秒重新验证，确保更新及时显示
        }
      } else {
        // 客户端：使用 Next.js API route
        const params = new URLSearchParams()
        if (forceRefresh) {
          params.set('force_refresh', 'true')
        }
        url = `/api/proxy/md/${fileIdOrUrl}${params.toString() ? `?${params.toString()}` : ''}`
        fetchOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      }
    } else {
      // 直接使用 URL（向后兼容）
      url = fileIdOrUrl
      fetchOptions = {
        method: 'GET',
        // 使用缓存策略，减少重复请求
        next: { revalidate: 60 }, // 60秒重新验证，确保更新及时显示
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    let response: Response
    try {
      response = await fetch(url, { ...fetchOptions, signal: fetchOptions.signal ?? controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      // 对于 404 或 500 错误，如果提供了 fallbackUrl，则自动回退到使用 OSS 地址
      if ((response.status === 404 || response.status === 500) && isFileId && fallbackUrl) {
        logger.warn(
          `getMdFileContent: proxy endpoint failed (${response.status}) for file_id: ${fileIdOrUrl}, falling back to OSS URL: ${fallbackUrl}`
        )
        // 递归调用，使用 fallbackUrl（不传入 fallbackUrl 参数，避免无限递归）
        return getMdFileContent(fallbackUrl, useCache, forceRefresh, undefined)
      }

      // 对于 404，可能是文件不存在或已被删除，静默处理
      if (response.status === 404) {
        logger.warn(
          `getMdFileContent: file not found (404) for ${isFileId ? `file_id: ${fileIdOrUrl}` : `url: ${fileIdOrUrl}`}${fallbackUrl ? `, no fallback URL provided` : ''}`
        )
      } else if (response.status === 500) {
        // 对于 500 错误，可能是后端服务问题，记录详细错误
        logger.error(
          `getMdFileContent: server error (500) for ${isFileId ? `file_id: ${fileIdOrUrl}` : `url: ${fileIdOrUrl}`}. This may indicate the proxy service is not available or the file does not exist in the cache.${fallbackUrl ? ` Attempting fallback to OSS URL.` : ''}`
        )
      } else {
        // 对于其他 4xx/5xx 错误，记录告警
        logger.warn(
          `getMdFileContent: failed to fetch file content ${response.status} ${response.statusText} for ${isFileId ? `file_id: ${fileIdOrUrl}` : `url: ${fileIdOrUrl}`}`
        )
      }
      return ''
    }

    // 后端 API 返回 JSON 格式的字符串，需要解析
    let content: string
    if (isFileId) {
      // 通过代理端点获取的内容是 JSON 格式的字符串
      const contentType = response.headers.get('content-type') || ''
      const isServer = typeof window === 'undefined'

      if (contentType.includes('application/json')) {
        // 先读取文本，确保 UTF-8 编码正确
        let text: string
        if (isServer) {
          // 服务端：使用 Buffer 确保正确解码
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          // JSON 标准要求使用 UTF-8 编码
          text = buffer.toString('utf-8')
        } else {
          // 客户端：浏览器会自动处理编码
          text = await response.text()
        }

        try {
          // 解析 JSON，可能是字符串或对象
          const jsonData = JSON.parse(text)
          // 如果解析后是字符串，直接使用；如果是对象，尝试提取 content 字段或转换为字符串
          if (typeof jsonData === 'string') {
            content = jsonData
          } else if (jsonData && typeof jsonData === 'object' && 'content' in jsonData) {
            content = String(jsonData.content)
          } else {
            content = String(jsonData)
          }
        } catch {
          // 如果 JSON 解析失败，直接使用文本（可能是纯文本响应）
          logger.warn(`Failed to parse JSON response for ${isFileId ? `file_id: ${fileIdOrUrl}` : `url: ${fileIdOrUrl}`}, using raw text`)
          content = text
        }
      } else {
        // 如果不是 JSON，直接读取文本（向后兼容）
        if (isServer) {
          // 服务端：使用 Buffer 确保正确解码
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          // 从 Content-Type 头中提取 charset
          let charset = 'utf-8'
          const charsetMatch = contentType.match(/charset=([^;]+)/i)
          if (charsetMatch) {
            charset = charsetMatch[1].trim().toLowerCase()
          }
          try {
            if (charset === 'utf-8' || charset === 'utf8') {
              content = buffer.toString('utf-8')
            } else {
              // 对于其他编码，先尝试 UTF-8
              content = buffer.toString('utf-8')
              if (content.includes('\ufffd')) {
                logger.warn(`Possible encoding issue detected for ${fileIdOrUrl}, charset: ${charset}`)
              }
            }
          } catch (e) {
            logger.warn(`Failed to decode content with charset ${charset}, falling back to UTF-8:`, e)
            content = buffer.toString('utf-8')
          }
        } else {
          content = await response.text()
        }
      }
    } else {
      // 直接使用 URL 获取的内容是纯文本
      // 需要正确处理字符编码，避免乱码
      const contentType = response.headers.get('content-type') || ''
      const isServer = typeof window === 'undefined'

      if (isServer) {
        // 服务端：使用 Buffer 和 TextDecoder 正确处理编码
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 从 Content-Type 头中提取 charset
        let charset = 'utf-8'
        const charsetMatch = contentType.match(/charset=([^;]+)/i)
        if (charsetMatch) {
          charset = charsetMatch[1].trim().toLowerCase()
        }

        // 如果 charset 不是 utf-8，尝试使用 TextDecoder 解码
        // 注意：Node.js 的 TextDecoder 主要支持 UTF-8，对于其他编码可能需要额外处理
        try {
          if (charset === 'utf-8' || charset === 'utf8') {
            content = buffer.toString('utf-8')
          } else {
            // 对于其他编码，先尝试 UTF-8，如果失败再尝试其他方式
            // 这里假设大部分文件都是 UTF-8，如果乱码可能需要后端处理
            content = buffer.toString('utf-8')
            // 如果检测到可能的乱码（包含替换字符），记录警告
            if (content.includes('\ufffd')) {
              logger.warn(`Possible encoding issue detected for ${fileIdOrUrl}, charset: ${charset}`)
            }
          }
        } catch (e) {
          // 如果解码失败，回退到 UTF-8
          logger.warn(`Failed to decode content with charset ${charset}, falling back to UTF-8:`, e)
          content = buffer.toString('utf-8')
        }
      } else {
        // 客户端：使用 response.text()，浏览器会自动处理编码
        content = await response.text()
      }
    }

    // 更新缓存
    if (useCache) {
      mdFileContentCache.set(cacheKey, { content, timestamp: Date.now() })
      // 限制缓存大小，避免内存泄漏
      if (mdFileContentCache.size > 100) {
        const firstKey = mdFileContentCache.keys().next().value
        if (firstKey) {
          mdFileContentCache.delete(firstKey)
        }
      }
    }

    return content
  } catch (error) {
    logger.error('Failed to fetch MD file content:', error)
    return ''
  }
}

/**
 * 使 MD 文件缓存失效
 * @param fileId - MD文件的ID
 */
export async function invalidateMdFileCache(fileId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/proxy/md/${fileId}/invalidate`, {
      method: 'GET',
    })

    if (!response.ok) {
      logger.warn(`Failed to invalidate cache for file_id: ${fileId}`)
      return false
    }

    // 同时清除本地内存缓存
    const cacheKey = `md_file_${fileId}`
    mdFileContentCache.delete(cacheKey)

    return true
  } catch (error) {
    logger.error('Failed to invalidate MD file cache:', error)
    return false
  }
}

/**
 * 站点配置更新接口（需要认证）
 */
export interface UpdateSiteConfigRequest {
  site_name?: string
  site_signature?: string | null
  site_announcement?: string | null
  site_icon?: string | null
  profile_image?: string | null
  is_active?: boolean
}

export interface SiteConfigResponse extends PublicSiteConfig {
  id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 更新站点配置（需要认证）
 * @param configId 配置 ID
 * @param data 更新的配置数据
 * @param token 认证 token
 */
export async function updateSiteConfig(
  configId: number,
  data: UpdateSiteConfigRequest,
  token: string
): Promise<SiteConfigResponse> {
  const url = `/api/site-config/${configId}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.detail || errorData.error || `Failed to update site config: ${response.status}`)
  }

  return response.json()
}

/**
 * 获取公开站点配置（无需认证）
 * 使用缓存策略：站点配置缓存 60 秒，确保公告更新能及时显示
 */
export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  const url = `${API_BASE_URL}/api/v1/site-config/public`

  try {
    // 创建超时控制器：生产环境使用更长的超时时间
    const controller = new AbortController()
    const timeout = process.env.NODE_ENV === 'production' ? 10000 : 2000 // 生产环境 10 秒，开发环境 2 秒
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 使用缓存策略：站点配置缓存 300 秒（5分钟），优化首屏加载
      // 注意：如果直接修改数据库，需要调用 /api/site-config/revalidate 来清除缓存
      next: { revalidate: 300, tags: ['site-config'] },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误（如 502 Bad Gateway），直接返回默认配置，不抛出错误
      if (response.status >= 500) {
        logger.warn(`SiteConfig API returned ${response.status}, using default config`)
        return DEFAULT_PUBLIC_SITE_CONFIG
      }
      // 对于其他错误，也返回默认配置
      logger.warn(`SiteConfig request failed: ${response.status} ${response.statusText}, using default config`)
      return DEFAULT_PUBLIC_SITE_CONFIG
    }

    const data = (await response.json()) as PublicSiteConfig

    // 确保至少有站点名称
    return {
      ...DEFAULT_PUBLIC_SITE_CONFIG,
      ...data,
    }
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('SiteConfig API request failed (network/timeout), using default config:', error.message)
      } else {
        logger.error('Failed to fetch public site config:', error.message)
      }
    } else {
      logger.error('Failed to fetch public site config:', error)
    }
    // 始终返回默认配置，确保页面不会崩溃
    return DEFAULT_PUBLIC_SITE_CONFIG
  }
}

/**
 * Frontmatter 接口
 */
export interface Frontmatter {
  title?: string
  published?: string
  updated?: string
  description?: string
  image?: string
  tags?: string[] | string
  category?: string
  subcategory?: string
  draft?: boolean
  [key: string]: unknown
}

/**
 * 解析 Markdown 内容和 Frontmatter
 */
export function parseMarkdownWithFrontmatter(content: string): {
  frontmatter: Frontmatter
  content: string
} {
  // 如果内容为空，直接返回
  if (!content || typeof content !== 'string') {
    return { frontmatter: {}, content: content || '' }
  }

  // 简单的 frontmatter 解析（不使用 gray-matter，避免依赖）
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, content }
  }

  const frontmatterText = match[1]
  const markdownContent = match[2] || ''

  // 解析 frontmatter 键值对
  const frontmatter: Frontmatter = {}
  const lines = frontmatterText.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // 处理数组（如 tags: [Demo, Example]）
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1)
      frontmatter[key] = key.toLowerCase() === 'tags'
        ? normalizeTags(arrayContent)
        : arrayContent
          .split(',')
          .map(item => item.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean)
    }
    // 处理布尔值
    else if (value === 'true' || value === 'false') {
      frontmatter[key] = value === 'true'
    }
    // 处理空值
    else if (value === '' || value === "''" || value === '""') {
      frontmatter[key] = ''
    }
    // 普通字符串
    else {
      frontmatter[key] = value
    }
  }

  return { frontmatter, content: markdownContent }
}

/**
 * 获取归档文件列表
 */
export async function getArchives(params: ArchivesParams = {}): Promise<Archive[]> {
  const { skip = API.DEFAULT_SKIP, limit = API.DEFAULT_LIMIT, is_public, search } = params

  const searchParams = new URLSearchParams()
  searchParams.set('skip', skip.toString())
  searchParams.set('limit', limit.toString())

  if (is_public !== undefined && is_public !== null) {
    searchParams.set('is_public', is_public.toString())
  }

  if (search) {
    searchParams.set('search', search)
  }

  const url = `${API_BASE_URL}/api/v1/md-file-archive/archives?${searchParams.toString()}`

  try {
    // 创建超时控制器：生产环境使用更长的超时时间
    const controller = new AbortController()
    const timeout = process.env.NODE_ENV === 'production' ? 10000 : 2000 // 生产环境 10 秒，开发环境 2 秒
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 归档列表缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误（如 502 Bad Gateway），直接返回空数组，不抛出错误
      if (response.status >= 500) {
        logger.warn(`Archives API returned ${response.status}, returning empty array`)
        return []
      }
      // 对于其他错误，也返回空数组
      logger.warn(`Archives request failed: ${response.status} ${response.statusText}, returning empty array`)
      return []
    }

    const data: Archive[] = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Archives API request failed (network/timeout), returning empty array:', error.message)
      } else {
        logger.error('Failed to fetch archives:', error.message)
      }
    } else {
      logger.error('Failed to fetch archives:', error)
    }
    // 始终返回空数组，确保页面不会崩溃
    return []
  }
}

/**
 * 根据归档 ID 获取单个归档文件
 */
export async function getArchiveById(id: number): Promise<Archive | null> {
  try {
    const archives = await getArchives({ skip: 0, limit: 1000, is_public: true })
    const archive = archives.find(a => a.id === id)
    return archive || null
  } catch (error) {
    logger.error('Failed to fetch archive by ID:', error)
    return null
  }
}

/**
 * 将 API 返回的 MdFile 转换为 PostCard 需要的格式
 * 优先使用 parsed_metadata 中的字段（后端已解析好的），如果没有则使用 API 返回的字段
 */
export function convertMdFileToPost(mdFile: MdFile, _locale: string) {
  // 优先使用 parsed_metadata 中的字段（后端已解析好的，编码正确）
  const parsedMeta = mdFile.parsed_metadata

  // 解析 tags：优先使用 parsed_metadata.tags，否则使用 mdFile.tags
  const tags = parsedMeta?.tags
    ? normalizeTags(parsedMeta.tags as string[] | string)
    : normalizeTags(mdFile.tags)

  // 标题：优先使用 parsed_metadata.title，否则使用 mdFile.title
  let title = mdFile.title || mdFile.original_filename || 'Untitled'
  if (parsedMeta && parsedMeta.title && typeof parsedMeta.title === 'string' && parsedMeta.title.trim()) {
    title = parsedMeta.title.trim()
  }

  // 描述：优先使用 parsed_metadata.description，否则使用 mdFile.description
  let description = mdFile.description || ''
  if (parsedMeta && parsedMeta.description && typeof parsedMeta.description === 'string' && parsedMeta.description.trim()) {
    description = parsedMeta.description.trim()
  }

  // 分类：优先使用 parsed_metadata.category，否则使用 mdFile.category
  let category = mdFile.category || undefined
  if (parsedMeta && parsedMeta.category && typeof parsedMeta.category === 'string' && parsedMeta.category.trim()) {
    category = parsedMeta.category.trim()
  }

  let subcategory = mdFile.subcategory || undefined
  if (parsedMeta && parsedMeta.subcategory && typeof parsedMeta.subcategory === 'string' && parsedMeta.subcategory.trim()) {
    subcategory = parsedMeta.subcategory.trim()
  }

  // 作者：优先使用 parsed_metadata.author，否则使用 mdFile.author
  let author = mdFile.author || undefined
  if (parsedMeta && parsedMeta.author && typeof parsedMeta.author === 'string' && parsedMeta.author.trim()) {
    author = parsedMeta.author.trim()
  }

  // 日期：优先使用 parsed_metadata.published，否则使用 mdFile.published，最后使用 created_at 或 updated_at
  let date = mdFile.published || mdFile.created_at || mdFile.updated_at || new Date().toISOString()
  if (parsedMeta && parsedMeta.published) {
    // parsed_metadata.published 可能是字符串日期
    const parsedDate = typeof parsedMeta.published === 'string' ? parsedMeta.published : String(parsedMeta.published)
    if (parsedDate && parsedDate.trim()) {
      date = parsedDate.trim()
    }
  }

  const result: {
    slug: string
    title: string
    date: string
    description?: string
    category?: string
    subcategory?: string
    tags?: string[]
    wordCount?: number
    isEncrypted?: boolean
    pinned?: boolean
    author?: string
    fileUrl?: string
  } = {
    slug: mdFile.id.toString(), // 使用 ID 作为 slug
    title,
    date,
    description,
    category,
    subcategory,
    tags,
    wordCount: mdFile.word_count || 0,
    // 优先使用 encrypted 字段，如果没有则根据 is_public 判断
    isEncrypted: mdFile.encrypted !== null && mdFile.encrypted !== undefined
      ? mdFile.encrypted
      : !mdFile.is_public,
    pinned: mdFile.pinned || false, // 是否置顶（优先使用 parsed_metadata.pinned）
    author, // 作者
    fileUrl: mdFile.file_url, // 保存文件 URL，用于后续获取内容
  }
  return result
}

/**
 * 从 proxy_url 中提取 file_id
 * 例如：/api/proxy/md/18 -> 18
 */
function extractFileIdFromProxyUrl(proxyUrl: string | null | undefined): number | null {
  if (!proxyUrl) return null
  const match = proxyUrl.match(/\/api\/proxy\/md\/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * 将 API 返回的 Archive 转换为 PostCard 需要的格式
 * 优先使用 parsed_metadata 中的字段（后端已解析好的），如果没有则从 markdown frontmatter 解析
 */
export function convertArchiveToPost(archive: Archive, _locale: string, markdownContent?: string) {
  // 优先使用 parsed_metadata 中的字段（后端已解析好的，编码正确）
  const parsedMeta = archive.parsed_metadata

  // 解析 tags：优先使用 parsed_metadata.tags，否则使用 archive.tags
  let tags: string[] = []
  if (parsedMeta && parsedMeta.tags) {
    if (typeof parsedMeta.tags === 'string') {
      tags = parsedMeta.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    } else if (Array.isArray(parsedMeta.tags)) {
      tags = parsedMeta.tags.map(tag => String(tag).trim()).filter(Boolean)
    }
  } else if (archive.tags) {
    tags = archive.tags.split(',').map(tag => tag.trim()).filter(Boolean)
  }

  // 标题：优先使用 parsed_metadata.title，否则从 markdown frontmatter 解析，最后使用 archive.title
  let title = archive.title || archive.original_filename || 'Untitled'
  if (parsedMeta && parsedMeta.title && typeof parsedMeta.title === 'string' && parsedMeta.title.trim()) {
    title = parsedMeta.title.trim()
  } else if (markdownContent) {
    try {
      const { frontmatter } = parseMarkdownWithFrontmatter(markdownContent)
      if (frontmatter.title && typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
        title = frontmatter.title.trim()
      }
    } catch (error) {
      logger.warn('Failed to parse frontmatter for archive:', archive.id, error)
    }
  }

  // 描述：优先使用 parsed_metadata.description，否则使用 archive.description
  let description = archive.description || ''
  if (parsedMeta && parsedMeta.description && typeof parsedMeta.description === 'string' && parsedMeta.description.trim()) {
    description = parsedMeta.description.trim()
  }

  // 分类：优先使用 parsed_metadata.category，否则使用 archive.category
  let category = archive.category || undefined
  if (parsedMeta && parsedMeta.category && typeof parsedMeta.category === 'string' && parsedMeta.category.trim()) {
    category = parsedMeta.category.trim()
  }

  let subcategory = archive.subcategory || undefined
  if (parsedMeta && parsedMeta.subcategory && typeof parsedMeta.subcategory === 'string' && parsedMeta.subcategory.trim()) {
    subcategory = parsedMeta.subcategory.trim()
  } else if (markdownContent) {
    const parsed = parseMarkdownWithFrontmatter(markdownContent).frontmatter.subcategory
    if (typeof parsed === 'string' && parsed.trim()) subcategory = parsed.trim()
  }

  // 作者：优先使用 parsed_metadata.author，否则使用 archive.author
  let author = archive.author || undefined
  if (parsedMeta && parsedMeta.author && typeof parsedMeta.author === 'string' && parsedMeta.author.trim()) {
    author = parsedMeta.author.trim()
  }

  // 日期：优先使用 parsed_metadata.published，否则使用 archive.published，最后使用 archive_date 或 created_at
  let date = archive.published || archive.archive_date || archive.created_at || archive.updated_at || new Date().toISOString()
  if (parsedMeta && parsedMeta.published) {
    // parsed_metadata.published 可能是字符串日期
    const parsedDate = typeof parsedMeta.published === 'string' ? parsedMeta.published : String(parsedMeta.published)
    if (parsedDate && parsedDate.trim()) {
      date = parsedDate.trim()
    }
  }

  // 从 proxy_url 提取 file_id（如果存在）
  const fileId = extractFileIdFromProxyUrl(archive.proxy_url) || archive.original_file_id

  const result: {
    slug: string
    title: string
    date: string
    description?: string
    category?: string
    subcategory?: string
    tags?: string[]
    wordCount?: number
    isEncrypted?: boolean
    pinned?: boolean
    author?: string
    fileId?: number
    fileUrl?: string
    archiveReason?: string
    archiveDate?: string
  } = {
    slug: archive.id.toString(), // 使用归档 ID 作为 slug
    title,
    date,
    description,
    category,
    subcategory,
    tags,
    wordCount: archive.word_count || 0,
    // 优先使用 encrypted 字段，如果没有则根据 is_public 判断
    isEncrypted: archive.encrypted !== null && archive.encrypted !== undefined
      ? archive.encrypted
      : !archive.is_public,
    pinned: archive.pinned || false, // 是否置顶（优先使用 parsed_metadata.pinned）
    author, // 作者
    fileId, // 保存文件 ID，用于通过代理端点获取内容
    fileUrl: archive.file_url, // 保存文件 URL（向后兼容）
    archiveReason: archive.archive_reason || '',
    archiveDate: archive.archive_date || '',
  }
  return result
}

/**
 * 友链接口
 * 对应后端 /api/v1/links/ 返回的数据结构
 */
export interface Link {
  name: string
  url: string
  description: string
  image_url: string
  image_type: string | null
  tags: string
  category: string
  is_active: boolean
  sort_order: number
  id: number
  created_at: string
  updated_at: string
}

/**
 * 获取友链列表的查询参数
 */
export interface LinksParams {
  category?: string | null
  tags?: string | null
  is_active?: boolean | null
  skip?: number
  limit?: number
  sort_by?: 'sort_order' | 'created_at' | 'name'
}

/**
 * 获取友链列表
 * 友链数据不经常变化，使用缓存策略（5分钟）
 */
export async function getLinks(params: LinksParams = {}): Promise<Link[]> {
  const {
    category = null,
    tags = null,
    is_active = true,
    skip = 0,
    limit = 100,
    sort_by = 'sort_order',
  } = params

  const searchParams = new URLSearchParams()
  if (category !== null && category !== undefined) {
    searchParams.append('category', category)
  }
  if (tags !== null && tags !== undefined) {
    searchParams.append('tags', tags)
  }
  if (is_active !== null && is_active !== undefined) {
    searchParams.append('is_active', is_active.toString())
  }
  searchParams.append('skip', skip.toString())
  searchParams.append('limit', limit.toString())
  searchParams.append('sort_by', sort_by)

  const url = `${API_BASE_URL}/api/v1/links/?${searchParams.toString()}`

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  const timeoutMs = isBuild ? 3000 : 12000

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 友链数据缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回空数组而不是抛出错误
      if (response.status >= 500) {
        logger.warn(`Links API returned ${response.status}: ${response.statusText}`)
        return []
      }
      throw new Error(`Links request failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as Link[]
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(
        isBuild
          ? 'Links request timeout during build, using empty list'
          : 'Links request timeout, using empty list'
      )
      return []
    }
    logger.warn('Failed to fetch links, using empty list:', error)
    return []
  }
}

/**
 * 赞助鸣谢 API
 * 对应后端 /api/v1/sponsors/ 公开接口（仅返回展示中的记录）
 */
export interface Sponsor {
  id: number
  name: string
  message: string | null
  amount: number | null
  source: string
  is_anonymous: boolean
  is_active: boolean
  sort_order: number
  sponsored_at: string | null
  created_at: string
  updated_at: string
}

export async function getSponsors(): Promise<Sponsor[]> {
  const url = `${API_BASE_URL}/api/v1/sponsors/`

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  const timeoutMs = isBuild ? 3000 : 12000

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // 鸣谢列表缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status >= 500) {
        logger.warn(`Sponsors API returned ${response.status}: ${response.statusText}`)
        return []
      }
      throw new Error(`Sponsors request failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as Sponsor[]
    return Array.isArray(data) ? data : []
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Sponsors request timeout, using empty list')
      return []
    }
    logger.warn('Failed to fetch sponsors, using empty list:', error)
    return []
  }
}

/**
 * 音乐馆 API
 * 对应后端 /api/v1/music/ 接口文档
 */
export interface MusicTrack {
  id: number
  title: string
  artist: string
  album: string | null
  cover_image_url: string | null
  duration: number | null
  year: number | null
  genre: string | null
  category: string
  tags: string | null
  status: string
  play_count: number
  rating: number | null
  is_favorite: boolean
  netease_id: string
}

export interface MusicPlaylist {
  id: number
  title: string
  description: string | null
  cover_image_url: string | null
  tags: string | null
  track_count: number
  view_count: number
  created_at: string
}

export interface MusicHomeResponse {
  stats: {
    total_playlists: number
    total_tracks: number
    total_play_count: number
    favorite_count: number
    category_stats: Array<{ category: string; count: number }>
    status_stats: Array<{ status: string; count: number }>
  }
  playlists: MusicPlaylist[]
  recent_tracks: MusicTrack[]
}

export interface MusicTrackPlayerResponse {
  iframe_code: string
}

/**
 * 获取音乐馆首页数据（含最近歌曲、歌单、统计）
 * 浏览器端走同源代理 /api/music/home，避免 CORS
 */
export async function getMusicHome(): Promise<MusicHomeResponse | null> {
  const isClient = typeof window !== 'undefined'
  const url = isClient ? '/api/music?type=home' : `${API_BASE_URL}/api/v1/music/`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(isClient ? {} : { next: { revalidate: 60 } }),
    })
    if (!response.ok) {
      if (response.status >= 500) {
        logger.warn(`Music API returned ${response.status}, returning null`)
      }
      return null
    }
    return (await response.json()) as MusicHomeResponse
  } catch (error) {
    if (error instanceof Error) {
      logger.warn('Music API request failed:', error.message)
    }
    return null
  }
}

/**
 * 随机推荐歌曲
 * 浏览器端走同源代理 /api/music/random，避免 CORS
 */
export async function getRandomTracks(count: number = 10): Promise<MusicTrack[]> {
  const isClient = typeof window !== 'undefined'
  const countParam = Math.min(20, Math.max(1, count))
  const url = isClient
    ? `/api/music?type=random&count=${countParam}`
    : `${API_BASE_URL}/api/v1/music/tracks/random?count=${countParam}`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(isClient ? {} : { next: { revalidate: 120 } }),
    })
    if (!response.ok) return []
    const data = (await response.json()) as MusicTrack[]
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (error instanceof Error) logger.warn('Random tracks API failed:', error.message)
    return []
  }
}

/**
 * 获取歌曲播放器 iframe 代码（可选，也可用 netease_id 自行拼接）
 */
export async function getTrackPlayerIframe(trackId: number): Promise<string | null> {
  const url = `${API_BASE_URL}/api/v1/music/tracks/${trackId}/player`
  try {
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    const data = (await response.json()) as MusicTrackPlayerResponse
    return data?.iframe_code ?? null
  } catch (error) {
    if (error instanceof Error) logger.warn('Track player API failed:', error.message)
    return null
  }
}

/**
 * 获取指定歌单的歌曲列表
 * 浏览器端走同源代理 /api/music?type=playlist&id=xxx，避免 CORS
 */
export async function getPlaylistTracks(playlistId: number): Promise<MusicTrack[]> {
  const isClient = typeof window !== 'undefined'
  const url = isClient
    ? `/api/music?type=playlist&id=${playlistId}`
    : `${API_BASE_URL}/api/v1/music/playlists/${playlistId}/tracks/`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'follow',
    })
    if (!response.ok) return []
    const data = await response.json()
    // 后端返回 { items: [...], total, page, size, pages } 格式
    if (data && Array.isArray(data.items)) return data.items
    if (Array.isArray(data)) return data
    return []
  } catch (error) {
    if (error instanceof Error) logger.warn('Playlist tracks API failed:', error.message)
    return []
  }
}

/** 根据 netease_id 生成网易云 iframe 播放地址；auto=1 时进入页面自动播放 */
export function getNeteasePlayerUrl(neteaseId: string, height: number = 66, autoPlay = false): string {
  const auto = autoPlay ? 1 : 0
  return `https://music.163.com/outchain/player?type=2&id=${encodeURIComponent(neteaseId)}&auto=${auto}&height=${height}`
}

/**
 * 检查网易云歌曲是否可播放（非 VIP 限制）
 * 通过 /api/music?type=check 代理调用网易云 API
 * 网络异常时默认返回 true，避免误跳
 */
export async function checkSongPlayable(neteaseId: string): Promise<boolean> {
  if (!neteaseId || !/^\d+$/.test(neteaseId)) return false
  try {
    const response = await fetch(`/api/music?type=check&id=${encodeURIComponent(neteaseId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return true // 网络错误时默认可播放
    const data = await response.json() as { playable: boolean }
    return !!data.playable
  } catch {
    return true // 网络异常默认可播放
  }
}

/** 获取网易云歌曲播放直链（用于 <audio> 播放） */
export async function getNeteaseSongUrl(neteaseId: string, br: number = 320000): Promise<string | null> {
  if (!neteaseId || !/^\d+$/.test(neteaseId)) return null
  try {
    const response = await fetch(`/api/music?type=url&id=${encodeURIComponent(neteaseId)}&br=${br}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data = await response.json() as { url?: string | null; playable?: boolean }
    return data?.url ?? null
  } catch {
    return null
  }
}

/** 游戏展示：对应前台 API /api/v1/games */
export interface GameShowcase {
  id: number
  title: string
  description?: string | null
  cover_image_url?: string | null
  steam_appid?: string | null
  steam_url?: string | null
  platform: string
  category: string
  tags?: string | null
  developer?: string | null
  publisher?: string | null
  status: string
  play_time: number
  rating?: number | null
  review?: string | null
  is_favorite: boolean
  is_active: boolean
  sort_order: number
  release_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface GamesStats {
  total_games: number
  total_play_time: number
  total_play_time_hours: number
  favorite_count: number
  average_rating?: number | null
  status_stats?: Array<{ status: string; count: number }>
  platform_stats?: Array<{ platform: string; count: number }>
  category_stats?: Array<{ category: string; count: number }>
}

export interface GamesOverviewResponse {
  stats: GamesStats
  recent_games: GameShowcase[]
  playing_games: GameShowcase[]
  favorite_games: GameShowcase[]
}

export interface GamesListResponse {
  items: GameShowcase[]
  total: number
  page: number
  size: number
  pages: number
}

export interface GamesListParams {
  page?: number
  size?: number
  platform?: string
  category?: string
  status?: string
  tags?: string
  is_favorite?: boolean
  sort_by?: 'sort_order' | 'created_at' | 'title' | 'play_time' | 'rating'
}

/** 获取游戏展示首页概览 GET /api/v1/games/；浏览器端走同源代理 /api/games 避免 CORS */
export async function getGamesOverview(): Promise<GamesOverviewResponse | null> {
  const isClient = typeof window !== 'undefined'
  const url = isClient ? '/api/games?type=overview' : `${API_BASE_URL}/api/v1/games/`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(isClient ? {} : { next: { revalidate: 60 } }),
    })
    if (!res.ok) return null
    return res.json()
  } catch (e) {
    if (e instanceof Error) logger.warn('Games overview failed:', e.message)
    return null
  }
}

/** 获取游戏列表（分页）GET /api/v1/games/list；浏览器端走同源代理 /api/games 避免 CORS */
export async function getGamesList(params: GamesListParams = {}): Promise<GamesListResponse | null> {
  const isClient = typeof window !== 'undefined'
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.size != null) searchParams.set('size', String(params.size))
  if (params.platform) searchParams.set('platform', params.platform)
  if (params.category) searchParams.set('category', params.category)
  if (params.status) searchParams.set('status', params.status)
  if (params.tags) searchParams.set('tags', params.tags)
  if (params.is_favorite != null) searchParams.set('is_favorite', String(params.is_favorite))
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  const query = searchParams.toString()
  const url = isClient ? `/api/games?type=list${query ? `&${query}` : ''}` : `${API_BASE_URL}/api/v1/games/list?${query}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(isClient ? {} : { next: { revalidate: 60 } }),
    })
    if (!res.ok) return null
    return res.json()
  } catch (e) {
    if (e instanceof Error) logger.warn('Games list failed:', e.message)
    return null
  }
}

/** 游玩时长（分钟）格式化为可读字符串 */
export function formatPlayTime(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return '--'
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** 游戏状态中文 */
export const GAME_STATUS_LABEL: Record<string, string> = {
  want_play: '想玩',
  playing: '在玩',
  completed: '已通关',
  shelved: '搁置',
  dropped: '弃坑',
}

/** 游戏平台中文 */
export const GAME_PLATFORM_LABEL: Record<string, string> = {
  steam: 'Steam',
  epic: 'Epic',
  ps: 'PlayStation',
  switch: 'Switch',
  pc: 'PC',
  mobile: '移动端',
  other: '其他',
}

/** 游戏分类中文 */
export const GAME_CATEGORY_LABEL: Record<string, string> = {
  rpg: 'RPG',
  fps: 'FPS',
  strategy: '策略',
  simulation: '模拟',
  indie: '独立',
  adventure: '冒险',
  other: '其他',
}

/** 时长（秒）格式化为 m:ss，接口文档建议 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '--:--'
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

/** 标签字符串解析为数组，接口文档建议 */
export function parseTags(tagsStr: string | null | undefined): string[] {
  if (!tagsStr || typeof tagsStr !== 'string') return []
  return tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
}

/** 歌曲分类 category 枚举 -> 中文 */
export const MUSIC_CATEGORY_LABEL: Record<string, string> = {
  pop: '流行',
  rock: '摇滚',
  jazz: '爵士',
  classical: '古典',
  electronic: '电子',
  hip_hop: '嘻哈',
  country: '乡村',
  blues: '蓝调',
  folk: '民谣',
  r_and_b: 'R&B',
  other: '其他',
}

/** 歌曲状态 status 枚举 -> 中文 */
export const MUSIC_STATUS_LABEL: Record<string, string> = {
  unplayed: '未听',
  listening: '在听',
  completed: '已听完',
  disliked: '不喜欢',
}

/**
 * 资源链接接口
 * 对应后端 /api/v1/resource-links/ 返回的数据结构
 */
export interface ResourceLink {
  title: string
  url: string
  description: string
  tags: string
  category: 'bilibili' | 'douyin' | 'weibo' | 'zhihu' | 'github' | 'personal' | 'other'
  is_active: boolean
  sort_order: number
  id: number
  created_at: string
  updated_at: string
}

/**
 * 获取资源链接列表的查询参数
 */
export interface ResourceLinksParams {
  category?: 'bilibili' | 'douyin' | 'weibo' | 'zhihu' | 'github' | 'personal' | 'other' | null
  tags?: string | null
  is_active?: boolean | null
  skip?: number
  limit?: number // maximum: 1000, minimum: 1
  sort_by?: 'sort_order' | 'created_at' | 'title'
}

/**
 * About 文件接口
 * 对应后端 /api/v1/about/ 返回的数据结构
 */
export interface AboutFile {
  id: number
  title: string
  filename: string
  url: string
  frontmatterTitle?: string // 从 Markdown frontmatter 中提取的标题
}

/**
 * 获取 About 文件列表
 * 对应后端 /api/v1/about/ 返回的数据结构
 * 返回对象数组，包含所有 about 文件的信息
 */
export async function getAboutFiles(): Promise<AboutFile[]> {
  const url = `${API_BASE_URL}/api/v1/about/`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // About 文件缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回空数组
      if (response.status >= 500) {
        logger.warn(`About Files API returned ${response.status}, returning empty array`)
        return []
      }
      // 对于其他错误，也返回空数组
      logger.warn(`About Files request failed: ${response.status} ${response.statusText}, returning empty array`)
      return []
    }

    const data = await response.json()

    // 确保返回的是数组
    if (!Array.isArray(data)) {
      logger.warn('About Files API returned non-array data:', typeof data)
      return []
    }

    // 验证并过滤有效数据
    const validFiles = data
      .filter((item): item is AboutFile => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'number' &&
          typeof item.title === 'string' &&
          typeof item.filename === 'string' &&
          typeof item.url === 'string' &&
          item.url.trim().length > 0
        )
      })
      .map(file => ({
        id: file.id,
        title: file.title.trim() || file.filename,
        filename: file.filename.trim(),
        url: file.url.trim(),
      }))

    return validFiles
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('About Files API request failed (network/timeout), returning empty array:', error.message)
      } else {
        logger.error('Failed to fetch about files:', error.message)
      }
    } else {
      logger.error('Failed to fetch about files:', error)
    }
    // 始终返回空数组，确保页面不会崩溃
    return []
  }
}

/**
 * 获取资源链接列表
 * 资源链接数据不经常变化，使用缓存策略（5分钟）
 */
export async function getResourceLinks(params: ResourceLinksParams = {}): Promise<ResourceLink[]> {
  const {
    category = null,
    tags = null,
    is_active = true,
    skip = 0,
    limit = 100,
    sort_by = 'sort_order',
  } = params

  // 验证参数
  const validatedLimit = Math.min(Math.max(limit || 100, 1), 1000)
  const validatedSkip = Math.max(skip || 0, 0)

  const searchParams = new URLSearchParams()
  if (category !== null && category !== undefined) {
    searchParams.append('category', category)
  }
  if (tags !== null && tags !== undefined && tags.trim()) {
    searchParams.append('tags', tags.trim())
  }
  if (is_active !== null && is_active !== undefined) {
    searchParams.append('is_active', is_active.toString())
  }
  searchParams.append('skip', validatedSkip.toString())
  searchParams.append('limit', validatedLimit.toString())
  searchParams.append('sort_by', sort_by)

  const url = `${API_BASE_URL}/api/v1/resource-links/?${searchParams.toString()}`

  if (process.env.NODE_ENV === 'development') {
    logger.log('Fetching resource links from:', url)
    logger.log('Request params:', {
      category,
      tags,
      is_active,
      skip: validatedSkip,
      limit: validatedLimit,
      sort_by,
    })
  }

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  const timeoutMs = isBuild ? 3000 : 12000

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 资源链接数据缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，静默处理并返回空数组
      if (response.status >= 500) {
        logger.warn(`ResourceLinks API returned ${response.status}, returning empty list`)
        return []
      }

      // 对于其他错误（4xx等），尝试获取错误详情
      let errorDetails = ''
      try {
        const errorData = await response.text()
        errorDetails = errorData
        if (process.env.NODE_ENV === 'development') {
          logger.error(`ResourceLinks API error response:`, errorData)
        }
      } catch {
        // 忽略解析错误
      }

      throw new Error(`ResourceLinks request failed: ${response.status} ${response.statusText} - ${errorDetails}`)
    }

    const data = (await response.json()) as ResourceLink[]
    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(
        isBuild
          ? 'ResourceLinks request timeout during build, using empty list'
          : 'ResourceLinks request timeout, using empty list'
      )
      return []
    }

    // 处理网络错误（fetch failed, connection refused, etc.）
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound')) {
        logger.warn(`ResourceLinks API request failed, using empty list: ${error.message}`)
        return []
      }
    }

    // 其他错误
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to fetch resource links:', error)
    } else {
      logger.warn('Failed to fetch resource links, returning empty list')
    }
    return []
  }
}

/**
 * 将 API 返回的 Link 转换为 FriendLinkList 需要的格式
 */
export function convertLinkToFriendLink(link: Link, locale: string) {
  const result = {
    id: link.id.toString(),
    title: link.name,
    description: link.description || '',
    url: link.url,
    image: link.image_url || undefined,
    icon: undefined as string | undefined,
    locale,
    category: link.category,
    tags: link.tags ? link.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    sortOrder: link.sort_order,
  }
  return result
}

/**
 * 动漫追番列表接口
 * 对应后端 /api/v1/anime-watchlist/ 返回的数据结构
 */
export interface AnimeWatchlist {
  title: string
  url: string
  cover_image_url: string
  description: string
  category: 'anime' | 'drama' | 'other'
  tags: string
  status: 'want_watch' | 'watching' | 'completed' | 'dropped' | 'planning'
  progress: number
  current_episode: number | null
  total_episodes: number | null
  rating: number | null
  is_favorite: boolean
  is_active: boolean
  sort_order: number
  id: number
  created_at: string
  updated_at: string
}

/**
 * 获取动漫追番列表的查询参数
 */
export interface AnimeWatchlistParams {
  category?: 'anime' | 'drama' | 'other' | null
  tags?: string | null
  status?: 'want_watch' | 'watching' | 'completed' | 'dropped' | 'planning' | null
  is_favorite?: boolean | null
  is_active?: boolean | null
  skip?: number
  limit?: number // maximum: 1000, minimum: 1
  sort_by?: 'sort_order' | 'created_at' | 'title' | 'progress' | 'rating'
}

/**
 * 分页获取动漫追番列表的查询参数
 */
export interface AnimeWatchlistPaginatedParams {
  category?: 'anime' | 'drama' | 'other' | null
  tags?: string | null
  status?: 'want_watch' | 'watching' | 'completed' | 'dropped' | null
  is_favorite?: boolean | null
  is_active?: boolean | null
  page?: number // minimum: 1, default: 1
  size?: number // maximum: 100, minimum: 1, default: 20
  sort_by?: 'sort_order' | 'created_at' | 'title' | 'progress' | 'rating'
}

/**
 * 分页获取动漫追番列表的响应
 */
export interface AnimeWatchlistPaginatedResponse {
  items: AnimeWatchlist[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * 分页获取动漫追番列表
 */
export async function getAnimeWatchlistPaginated(params: AnimeWatchlistPaginatedParams = {}): Promise<AnimeWatchlistPaginatedResponse> {
  const {
    category = null,
    tags = null,
    status = null,
    is_favorite = null,
    is_active = true,
    page = 1,
    size = 20,
    sort_by = 'sort_order',
  } = params

  // 验证参数
  const validatedPage = Math.max(page || 1, 1)
  const validatedSize = Math.min(Math.max(size || 20, 1), 100)

  const searchParams = new URLSearchParams()
  if (category !== null && category !== undefined) {
    searchParams.append('category', category)
  }
  if (tags !== null && tags !== undefined && tags.trim()) {
    searchParams.append('tags', tags.trim())
  }
  if (status !== null && status !== undefined) {
    searchParams.append('status', status)
  }
  if (is_favorite !== null && is_favorite !== undefined) {
    searchParams.append('is_favorite', is_favorite.toString())
  }
  if (is_active !== null && is_active !== undefined) {
    searchParams.append('is_active', is_active.toString())
  }
  searchParams.append('page', validatedPage.toString())
  searchParams.append('size', validatedSize.toString())
  searchParams.append('sort_by', sort_by)

  const url = `${API_BASE_URL}/api/v1/anime-watchlist/list?${searchParams.toString()}`

  if (process.env.NODE_ENV === 'development') {
    logger.log('Fetching paginated anime watchlist from:', url)
    logger.log('Request params:', {
      category,
      tags,
      status,
      is_favorite,
      is_active,
      page: validatedPage,
      size: validatedSize,
      sort_by,
    })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时（优化首屏加载）

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，静默处理并返回空数据
      if (response.status >= 500) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`AnimeWatchlist Paginated API returned ${response.status}, returning empty data`)
        }
        return { items: [], total: 0, page: validatedPage, size: validatedSize, pages: 0 }
      }

      // 对于其他错误（4xx等），尝试获取错误详情
      let errorDetails = ''
      try {
        const errorData = await response.text()
        errorDetails = errorData
        if (process.env.NODE_ENV === 'development') {
          logger.error(`AnimeWatchlist Paginated API error response:`, errorData)
        }
      } catch {
        // 忽略解析错误
      }

      throw new Error(`AnimeWatchlist Paginated request failed: ${response.status} ${response.statusText} - ${errorDetails}`)
    }

    const data = (await response.json()) as AnimeWatchlistPaginatedResponse
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('AnimeWatchlist Paginated request timeout (15s). This may be due to slow network or backend processing.')
      }
      return { items: [], total: 0, page: validatedPage, size: validatedSize, pages: 0 }
    }
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to fetch paginated anime watchlist:', error)
    } else {
      logger.warn('Failed to fetch paginated anime watchlist, returning empty data')
    }
    return { items: [], total: 0, page: validatedPage, size: validatedSize, pages: 0 }
  }
}

/**
 * 获取动漫追番列表
 */
export async function getAnimeWatchlist(params: AnimeWatchlistParams = {}): Promise<AnimeWatchlist[]> {
  const {
    category = null,
    tags = null,
    status = null,
    is_favorite = null,
    is_active = true,
    skip = 0,
    limit = 100,
    sort_by = 'sort_order',
  } = params

  // 验证 limit 参数（根据 API 文档：maximum: 1000, minimum: 1）
  const validatedLimit = Math.min(Math.max(limit || 100, 1), 1000)
  const validatedSkip = Math.max(skip || 0, 0)

  const searchParams = new URLSearchParams()
  if (category !== null && category !== undefined) {
    searchParams.append('category', category)
  }
  if (tags !== null && tags !== undefined && tags.trim()) {
    searchParams.append('tags', tags.trim())
  }
  if (status !== null && status !== undefined) {
    searchParams.append('status', status)
  }
  if (is_favorite !== null && is_favorite !== undefined) {
    searchParams.append('is_favorite', is_favorite.toString())
  }
  if (is_active !== null && is_active !== undefined) {
    searchParams.append('is_active', is_active.toString())
  }
  searchParams.append('skip', validatedSkip.toString())
  searchParams.append('limit', validatedLimit.toString())
  searchParams.append('sort_by', sort_by)

  // 根据API文档，端点应该是 /api/v1/anime-watchlist/
  const url = `${API_BASE_URL}/api/v1/anime-watchlist/?${searchParams.toString()}`

  // 只在开发环境输出详细日志
  if (process.env.NODE_ENV === 'development') {
    logger.log('Fetching anime watchlist from:', url)
    logger.log('Request params:', {
      category,
      tags,
      status,
      is_favorite,
      is_active,
      skip,
      limit,
      sort_by,
    })
  }

  const controller = new AbortController()
  // 增加超时时间到15秒，因为可能需要获取视频封面，处理时间较长
  const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时（优化首屏加载）

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，静默处理并返回空数组
      if (response.status >= 500) {
        // 只在开发环境输出简要警告
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`AnimeWatchlist API returned ${response.status}, returning empty list`)
        }
        return []
      }

      // 对于其他错误（4xx等），尝试获取错误详情
      let errorDetails = ''
      try {
        const errorData = await response.text()
        errorDetails = errorData
        if (process.env.NODE_ENV === 'development') {
          logger.error(`AnimeWatchlist API error response:`, errorData)
        }
      } catch {
        // 忽略解析错误
      }

      throw new Error(`AnimeWatchlist request failed: ${response.status} ${response.statusText} - ${errorDetails}`)
    }

    const data = (await response.json()) as AnimeWatchlist[]
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      // 超时错误改为警告，并提示可能的原因
      if (process.env.NODE_ENV === 'development') {
        logger.warn('AnimeWatchlist request timeout (15s). This may be due to slow network or backend processing.')
      }
      return []
    }
    // 处理 fetch 失败的情况（网络错误、连接被拒绝等）
    if (error instanceof Error) {
      // 检查是否是网络相关错误
      const isNetworkError =
        error.message.includes('fetch failed') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT') ||
        error.name === 'TypeError'

      if (isNetworkError) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`AnimeWatchlist network error: ${error.message}. URL: ${url}`)
        }
        return []
      }
    }
    // 其他错误也改为警告，避免在生产环境输出过多错误
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to fetch anime watchlist:', error)
    } else {
      logger.warn('Failed to fetch anime watchlist, returning empty list')
    }
    return []
  }
}

/**
 * 获取收藏的动漫/剧集
 */
export async function getFavoriteAnimeWatchlist(): Promise<AnimeWatchlist[]> {
  const url = `${API_BASE_URL}/api/v1/anime-watchlist/favorites`

  if (process.env.NODE_ENV === 'development') {
    logger.log('Fetching favorite anime watchlist from:', url)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时（优化首屏加载）

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，静默处理并返回空数组
      if (response.status >= 500) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Favorite AnimeWatchlist API returned ${response.status}, returning empty list`)
        }
        return []
      }

      // 对于其他错误（4xx等），尝试获取错误详情
      let errorDetails = ''
      try {
        const errorData = await response.text()
        errorDetails = errorData
        if (process.env.NODE_ENV === 'development') {
          logger.error(`Favorite AnimeWatchlist API error response:`, errorData)
        }
      } catch {
        // 忽略解析错误
      }

      throw new Error(`Favorite AnimeWatchlist request failed: ${response.status} ${response.statusText} - ${errorDetails}`)
    }

    const data = (await response.json()) as AnimeWatchlist[]
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Favorite AnimeWatchlist request timeout (15s). This may be due to slow network or backend processing.')
      }
      return []
    }
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to fetch favorite anime watchlist:', error)
    } else {
      logger.warn('Failed to fetch favorite anime watchlist, returning empty list')
    }
    return []
  }
}

/**
 * 从视频URL获取封面图（客户端函数）
 */
export async function getVideoThumbnailFromUrl(videoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/video-thumbnail?url=${encodeURIComponent(videoUrl)}`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.thumbnailUrl || null
  } catch (error) {
    logger.error('Failed to get video thumbnail:', error)
    return null
  }
}

/**
 * 从视频URL获取封面图（服务端函数）
 * 直接调用内部函数，避免HTTP请求
 */
export async function getVideoThumbnailFromUrlServer(videoUrl: string): Promise<string | null> {
  try {
    // 在服务端直接调用获取封面的逻辑
    return await getVideoThumbnailInternal(videoUrl)
  } catch (error) {
    logger.error('Failed to get video thumbnail:', error)
    return null
  }
}

/**
 * 内部函数：从视频URL提取封面图URL
 */
async function getVideoThumbnailInternal(videoUrl: string): Promise<string | null> {
  try {
    const url = new URL(videoUrl)
    const hostname = url.hostname.toLowerCase()

    // B站 (bilibili.com)
    if (hostname.includes('bilibili.com')) {
      const bvMatch = videoUrl.match(/BV([a-zA-Z0-9]+)/i)
      const avMatch = videoUrl.match(/av(\d+)/i)

      if (bvMatch) {
        const bvid = bvMatch[0]
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
          const response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.bilibili.com/',
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data.code === 0 && data.data?.pic) {
              return data.data.pic
            }
          }
        } catch (e) {
          logger.warn('B站API请求失败', e)
        }
        return null
      }

      if (avMatch) {
        const avid = avMatch[1]
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const apiUrl = `https://api.bilibili.com/x/web-interface/view?aid=${avid}`
          const response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.bilibili.com/',
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data.code === 0 && data.data?.pic) {
              return data.data.pic
            }
          }
        } catch (e) {
          logger.warn('B站API请求失败', e)
        }
        return null
      }
    }

    // YouTube (youtube.com, youtu.be)
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId: string | null = null

      if (hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1)
      } else {
        videoId = url.searchParams.get('v')
      }

      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    }

    // 尝试使用oEmbed API
    try {
      const oembedProviders = [
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`,
      ]

      for (const oembedUrl of oembedProviders) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data.thumbnail_url) {
              return data.thumbnail_url
            }
          }
        } catch {
          continue
        }
      }
    } catch {
      // oEmbed失败
    }

    return null
  } catch (error) {
    logger.error('Error parsing video URL:', error)
    return null
  }
}

/**
 * 将 API 返回的 AnimeWatchlist 转换为 AnimeList 需要的格式
 */
export async function convertAnimeWatchlistToAnimeEntry(anime: AnimeWatchlist): Promise<AnimeEntry> {
  // 解析 tags（假设 tags 是逗号分隔的字符串）
  // 处理各种情况：null, undefined, 空字符串, 只有空格的字符串
  let tags: string[] = []
  if (anime.tags && typeof anime.tags === 'string' && anime.tags.trim()) {
    tags = anime.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0) // 过滤掉空字符串
  }

  // 映射状态：want_watch -> planned, watching -> watching, completed -> completed, dropped -> dropped, planning -> planned
  const statusMap: Record<AnimeWatchlist['status'], 'watching' | 'completed' | 'planned' | 'dropped'> = {
    want_watch: 'planned',
    watching: 'watching',
    completed: 'completed',
    dropped: 'dropped',
    planning: 'planned',
  }

  // 封面图片：直接使用后端返回的cover_image_url，如果没有则使用默认占位图
  // 后端负责抓取和保存图片URL，前端只负责显示
  let cover = ''

  if (anime.cover_image_url && typeof anime.cover_image_url === 'string' && anime.cover_image_url.trim()) {
    cover = anime.cover_image_url.trim()
    logger.log(`[Anime ${anime.id}] Using cover_image_url from API:`, cover)
  } else {
    // 没有cover_image_url，使用默认占位图片
    cover = DEFAULT_ANIME_COVER_IMAGE
    logger.warn(`[Anime ${anime.id}] No cover_image_url, using default cover image:`, DEFAULT_ANIME_COVER_IMAGE, {
      cover_image_url: anime.cover_image_url,
      title: anime.title
    })
  }

  const result: AnimeEntry = {
    id: anime.id.toString(),
    title: anime.title || 'Untitled',
    description: anime.description || '',
    cover, // 使用 cover_image_url 作为列表卡片显示图片
    url: anime.url || undefined,
    status: statusMap[anime.status] || 'planned',
    rating: anime.rating ?? 0, // 处理 null 值
    watchedEpisodes: anime.current_episode ?? 0, // 处理 null 值
    totalEpisodes: anime.total_episodes ?? 0, // 处理 null 值
    progress: anime.progress,
    category: anime.category,
    is_favorite: anime.is_favorite,
    tags,
  }
  return result
}

/**
 * Diary Image interface
 * 对应后端 /api/v1/diaries/ 返回的图片数据结构
 */
export interface DiaryImage {
  id: number
  minio_bucket: string
  minio_object_name: string
  original_filename: string
  file_size: number
  mime_type: string
  width: number
  height: number
  thumbnail_minio_object_name: string
  image_url: string
  thumbnail_url: string
  created_at: string
}

/**
 * Diary interface
 * 对应后端 /api/v1/diaries/ 返回的日记数据结构
 */
export interface Diary {
  title: string
  content: string
  weather: string
  mood: string
  tags: string[]
  is_public: boolean
  id: number
  user_id: number
  created_at: string
  updated_at: string
  images: DiaryImage[]
}

/**
 * Diaries Response interface
 * 对应后端 /api/v1/diaries/ 返回的数据结构
 */
export interface DiariesResponse {
  diaries: Diary[]
  total: number
  page: number
  per_page: number
}

/**
 * 获取日记列表的查询参数
 */
export interface DiariesParams {
  skip?: number
  limit?: number
  public_only?: boolean
}

/**
 * 获取单篇日记详情
 * @param diaryId 日记 ID
 * @returns 日记详情，如果不存在或出错则返回 null
 */
export async function getDiary(diaryId: number): Promise<Diary | null> {
  const url = `${API_BASE_URL}/api/v1/diaries/${diaryId}`

  // 创建超时控制器
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 404 表示日记不存在
      if (response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Diary ${diaryId} not found`)
        }
        return null
      }

      // 对于其他错误，记录并返回 null
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Failed to fetch diary ${diaryId}: ${response.status} ${response.statusText}`)
      }
      return null
    }

    const data: Diary = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`Diary ${diaryId} request timeout (10s)`)
      }
      return null
    }

    // 处理网络错误
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound')) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Diary ${diaryId} API request failed (network/timeout): ${error.message}`)
        }
        return null
      }
    }

    if (process.env.NODE_ENV === 'development') {
      logger.error(`Failed to fetch diary ${diaryId}:`, error)
    }
    return null
  }
}

/**
 * 获取日记列表
 */
export async function getDiaries(params: DiariesParams = {}): Promise<DiariesResponse> {
  const { skip = 0, limit = 20, public_only = true } = params

  const searchParams = new URLSearchParams()
  searchParams.set('skip', skip.toString())
  searchParams.set('limit', limit.toString())
  searchParams.set('public_only', public_only.toString())

  const url = `${API_BASE_URL}/api/v1/diaries/?${searchParams.toString()}`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回空数据
      if (response.status >= 500) {
        logger.warn(`Diaries API returned ${response.status}, returning empty data`)
        return { diaries: [], total: 0, page: 0, per_page: 0 }
      }
      // 对于其他错误，也返回空数据
      logger.warn(`Diaries request failed: ${response.status} ${response.statusText}, returning empty data`)
      return { diaries: [], total: 0, page: 0, per_page: 0 }
    }

    const data: DiariesResponse = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Diaries API request failed (network/timeout), returning empty data:', error.message)
      } else {
        logger.error('Failed to fetch diaries:', error.message)
      }
    } else {
      logger.error('Failed to fetch diaries:', error)
    }
    // 始终返回空数据，确保页面不会崩溃
    return { diaries: [], total: 0, page: 0, per_page: 0 }
  }
}

/**
 * Skill Period interface
 * 对应后端 /api/v1/skills/ 返回的 periods 数据结构
 */
export interface SkillPeriod {
  id: number
  start_date: string
  end_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Skill interface
 * 对应后端 /api/v1/skills/ 返回的数据结构
 */
export interface ApiSkill {
  name: string
  category: string
  description: string
  id: number
  total_learning_days: number
  current_level: string
  created_at: string
  updated_at: string
  periods: SkillPeriod[]
  related_projects?: ApiProject[]
  project_count?: number
}

/**
 * 获取技能列表的查询参数
 */
export interface SkillsParams {
  skip?: number
  limit?: number
  category?: string | null
}

/**
 * 获取技能列表
 */
export async function getSkills(params: SkillsParams = {}): Promise<ApiSkill[]> {
  const { skip = 0, limit = 100, category = null } = params

  const searchParams = new URLSearchParams()
  searchParams.set('skip', skip.toString())
  searchParams.set('limit', limit.toString())
  if (category) {
    searchParams.set('category', category)
  }

  const url = `${API_BASE_URL}/api/v1/skills/?${searchParams.toString()}`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT.DEFAULT)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 技能列表缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回空数组
      if (response.status >= 500) {
        logger.warn(`Skills API returned ${response.status}, returning empty array`)
        return []
      }
      // 对于其他错误，也返回空数组
      logger.warn(`Skills request failed: ${response.status} ${response.statusText}, returning empty array`)
      return []
    }

    const data: ApiSkill[] = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Skills API request failed (network/timeout), returning empty array:', error.message)
      } else {
        logger.error('Failed to fetch skills:', error.message)
      }
    } else {
      logger.error('Failed to fetch skills:', error)
    }
    // 始终返回空数组，确保页面不会崩溃
    return []
  }
}

/**
 * 获取技能相关的项目列表
 */
export async function getSkillProjects(skillId: number): Promise<ApiProject[]> {
  const url = `${API_BASE_URL}/api/v1/skills/${skillId}/projects`

  // 创建超时控制器
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 404，返回空数组
      if (response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Skill projects for skill ${skillId} not found`)
        }
        return []
      }
      // 对于其他错误，返回空数组
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`Skill projects API returned ${response.status}: ${response.statusText}`)
      }
      return []
    }

    const data: ApiProject[] = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // 捕获所有错误
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Skill projects request timeout for skill ${skillId}`)
        }
        return []
      }

      // 处理网络错误
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound')) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Skill projects API request failed (network/timeout) for skill ${skillId}:`, error.message)
        }
        return []
      }
    }

    if (process.env.NODE_ENV === 'development') {
      logger.error(`Failed to fetch skill projects for skill ${skillId}:`, error)
    }
    return []
  }
}

/**
 * 获取单个技能详情的参数
 */
export interface GetSkillByIdParams {
  include_projects?: boolean
}

/**
 * 获取单个技能详情
 * @param skillId 技能ID
 * @param params 查询参数，可包含 include_projects（默认 true）
 */
export async function getSkillById(
  skillId: number,
  params: GetSkillByIdParams = { include_projects: true }
): Promise<ApiSkill | null> {
  const { include_projects = true } = params

  const searchParams = new URLSearchParams()
  searchParams.set('include_projects', include_projects.toString())

  const url = `${API_BASE_URL}/api/v1/skills/${skillId}?${searchParams.toString()}`

  try {
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时（因为可能包含项目数据）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 404，返回 null
      if (response.status === 404) {
        return null
      }
      // 对于其他错误，返回 null
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`Skill API returned ${response.status}: ${response.statusText}`)
      }
      return null
    }

    const data: ApiSkill = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Skill API request timeout for skill ${skillId}`)
        }
        return null
      }

      // 处理网络错误
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound')) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`Skill API request failed (network/timeout) for skill ${skillId}:`, error.message)
        }
        return null
      }

      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to fetch skill:', error.message)
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to fetch skill:', error)
      }
    }
    return null
  }
}

/**
 * 将 API 返回的 ApiSkill 转换为 SkillList 需要的格式
 */
export function convertApiSkillToSkill(apiSkill: ApiSkill, locale: string): import('@/components/SkillList').Skill {
  // 映射 level: API 返回的 current_level 字符串 -> Skill 需要的 level
  const levelMap: Record<string, 'expert' | 'advanced' | 'intermediate' | 'beginner'> = {
    'expert': 'expert',
    '专家': 'expert',
    '精通': 'expert',
    'advanced': 'advanced',
    '高级': 'advanced',
    '进阶': 'advanced',
    'intermediate': 'intermediate',
    '中级': 'intermediate',
    'beginner': 'beginner',
    '初级': 'beginner',
    '入门': 'beginner',
  }

  // 默认使用 intermediate，如果无法映射
  const levelKey = apiSkill.current_level?.trim().toLowerCase()
  const level = levelMap[levelKey] || 'intermediate'

  // 映射 category: API 返回的 category 字符串 -> Skill 需要的 category
  const categoryMap: Record<string, 'frontend' | 'backend' | 'database' | 'tools' | 'other'> = {
    'frontend': 'frontend',
    '前端': 'frontend',
    '前端开发': 'frontend',
    'backend': 'backend',
    '后端': 'backend',
    '后端开发': 'backend',
    'database': 'database',
    '数据库': 'database',
    '数据库开发': 'database',
    'tools': 'tools',
    '工具': 'tools',
    '开发工具': 'tools',
    'other': 'other',
    '其他': 'other',
  }

  // 默认使用 other，如果无法映射
  const categoryKey = apiSkill.category?.trim().toLowerCase()
  const category = categoryMap[categoryKey] || 'other'

  // 计算经验：从 total_learning_days 转换为 years 和 months
  const totalDays = apiSkill.total_learning_days || 0
  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)

  return {
    id: apiSkill.id.toString(),
    name: apiSkill.name || 'Untitled',
    description: apiSkill.description || '',
    level,
    category,
    experience: {
      years,
      months,
    },
    projects: apiSkill.project_count ?? 0, // 使用 API 返回的 project_count
    locale,
  }
}

/**
 * Language Stat interface
 */
export interface LanguageStat {
  language: string
  percentage: number
  bytes_count: number
}

/**
 * Language Stats interface
 */
export interface LanguageStats {
  languages: LanguageStat[]
  total_languages: number
  dominant_language: string | null
}

/**
 * Project interface
 * 对应后端 /api/v1/projects/ 返回的数据结构
 */
export interface ApiProject {
  id: number
  name: string
  description: string | null
  url: string
  platform: string
  tag: string
  avatar_url: string | null
  stars_count: number
  forks_count: number
  owner: string
  repository_name: string
  language_stats: LanguageStats
  created_at: string
  updated_at: string | null
  languages: LanguageStat[]
}

/**
 * 获取项目列表的查询参数
 */
export interface ProjectsParams {
  skip?: number
  limit?: number
  platform?: string | null
  tag?: string | null
  language?: string | null
  search?: string | null
}

/**
 * 获取项目列表
 */
export async function getProjects(params: ProjectsParams = {}): Promise<ApiProject[]> {
  const { skip = 0, limit = 100, platform = null, tag = null, language = null, search = null } = params

  const searchParams = new URLSearchParams()
  searchParams.set('skip', skip.toString())
  searchParams.set('limit', limit.toString())
  if (platform) {
    searchParams.set('platform', platform)
  }
  if (tag) {
    searchParams.set('tag', tag)
  }
  if (language) {
    searchParams.set('language', language)
  }
  if (search) {
    searchParams.set('search', search)
  }

  const url = `${API_BASE_URL}/api/v1/projects/?${searchParams.toString()}`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 项目列表缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回空数组
      if (response.status >= 500) {
        logger.warn(`Projects API returned ${response.status}, returning empty array`)
        return []
      }
      // 对于其他错误，也返回空数组
      logger.warn(`Projects request failed: ${response.status} ${response.statusText}, returning empty array`)
      return []
    }

    const data: ApiProject[] = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误等）
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Projects API request failed (network/timeout), returning empty array:', error.message)
      } else {
        logger.error('Failed to fetch projects:', error.message)
      }
    } else {
      logger.error('Failed to fetch projects:', error)
    }
    // 始终返回空数组，确保页面不会崩溃
    return []
  }
}

/**
 * 获取单个项目详情
 */
export async function getProjectById(projectId: number): Promise<ApiProject | null> {
  const url = `${API_BASE_URL}/api/v1/projects/${projectId}`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 404，返回 null
      if (response.status === 404) {
        return null
      }
      // 对于其他错误，返回 null
      logger.warn(`Project API returned ${response.status}: ${response.statusText}`)
      return null
    }

    const data: ApiProject = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Project API request failed (network/timeout):', error.message)
      } else {
        logger.error('Failed to fetch project:', error.message)
      }
    } else {
      logger.error('Failed to fetch project:', error)
    }
    return null
  }
}

/**
 * Tag Stat interface
 */
export interface TagStat {
  tag: string
  count: number
}

/**
 * Language Stat interface
 */
export interface LanguageStat {
  language: string
  total_percentage: number
  project_count: number
}

/**
 * 获取语言统计
 */
export async function getLanguageStats(limit: number = 10): Promise<LanguageStat[]> {
  const url = `${API_BASE_URL}/api/v1/projects/stats/language?limit=${limit}`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于错误，返回空数组
      logger.warn(`Language Stats API returned ${response.status}: ${response.statusText}`)
      return []
    }

    const data: LanguageStat[] = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Language Stats API request failed (network/timeout):', error.message)
      } else {
        logger.error('Failed to fetch language stats:', error.message)
      }
    } else {
      logger.error('Failed to fetch language stats:', error)
    }
    return []
  }
}

/**
 * 获取所有标签（从 API 和 contentlayer）
 * 用于在侧边栏显示标签列表
 */
export async function getAllTags(): Promise<{ tags: string[]; tagCountMap: Map<string, number> }> {
  const tagCountMap = new Map<string, number>()

  try {
    // 从 API 获取公开 MD 文件（减少数量，优化性能）
    // 只获取前 50 条，足够统计标签使用频率
    const apiResponse = await getPublicMdFiles({ skip: 0, limit: 50 })

    // 直接使用 API 返回的 parsed_metadata，不获取文件内容（大幅提升性能）
    apiResponse.files.forEach((file) => {
      const post = convertMdFileToPost(file, 'en') // locale 不影响标签提取

      // 直接使用 API 返回的 tags（parsed_metadata 中已解析好的）
      // 不再获取文件内容，避免大量网络请求
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim()
            tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1)
          }
        })
      }
    })

  } catch (error) {
    logger.warn('Failed to fetch tags from API:', error)
  }

  try {
    // 从 contentlayer 获取 posts（需要动态导入，因为 contentlayer 可能不可用）
    const { allPosts } = await import('contentlayer/generated')
    allPosts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim()
            tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1)
          }
        })
      }
    })
  } catch (error) {
    // contentlayer 可能不可用，忽略错误
    logger.warn('Failed to fetch tags from contentlayer:', error)
  }

  // 将标签按使用频率排序，取前 8 个
  const sortedTags = Array.from(tagCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag)

  return { tags: sortedTags, tagCountMap }
}

/**
 * 获取所有分类（从 API 和 contentlayer）
 * 用于在侧边栏显示分类列表
 */
export interface CategoryHierarchyItem {
  label: string
  count: number
  subcategories: Array<{ label: string; count: number }>
}

export async function getAllCategories(): Promise<{ categories: CategoryHierarchyItem[]; categoryCountMap: Map<string, number> }> {
  const categoryCountMap = new Map<string, number>()
  const subcategoryCountMap = new Map<string, Map<string, number>>()

  const addCategory = (category?: string, subcategory?: string) => {
    const primary = category?.trim()
    if (!primary) return
    categoryCountMap.set(primary, (categoryCountMap.get(primary) || 0) + 1)

    const secondary = subcategory?.trim()
    if (!secondary) return
    const children = subcategoryCountMap.get(primary) || new Map<string, number>()
    children.set(secondary, (children.get(secondary) || 0) + 1)
    subcategoryCountMap.set(primary, children)
  }

  try {
    // 从 API 获取公开 MD 文件（减少数量，优化性能）
    // 只获取前 50 条，足够统计分类使用频率
    const apiResponse = await getPublicMdFiles({ skip: 0, limit: 50 })

    // 直接使用 API 返回的 parsed_metadata，不获取文件内容（大幅提升性能）
    apiResponse.files.forEach((file) => {
      const post = convertMdFileToPost(file, 'en') // locale 不影响分类提取

      // 直接使用 API 返回的 category（parsed_metadata 中已解析好的）
      // 不再获取文件内容，避免大量网络请求
      addCategory(post.category, post.subcategory)
    })
  } catch (error) {
    logger.warn('Failed to fetch categories from API:', error)
  }

  try {
    // 从 contentlayer 获取 posts（需要动态导入，因为 contentlayer 可能不可用）
    const { allPosts } = await import('contentlayer/generated')
    allPosts.forEach((post) => {
      const contentPost = post as typeof post & { subcategory?: string }
      addCategory(contentPost.category, contentPost.subcategory)
    })
  } catch (error) {
    // contentlayer 可能不可用，忽略错误
    logger.warn('Failed to fetch categories from contentlayer:', error)
  }

  // 将分类按使用频率排序
  const sortedCategories = Array.from(categoryCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      subcategories: Array.from(subcategoryCountMap.get(label)?.entries() || [])
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([childLabel, childCount]) => ({ label: childLabel, count: childCount })),
    }))

  return { categories: sortedCategories, categoryCountMap }
}

/**
 * 获取标签统计
 */
export async function getTagStats(): Promise<TagStat[]> {
  const url = `${API_BASE_URL}/api/v1/projects/stats/tag`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 标签统计缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于错误，返回空数组
      logger.warn(`Tag Stats API returned ${response.status}: ${response.statusText}`)
      return []
    }

    const data: TagStat[] = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Tag Stats API request failed (network/timeout):', error.message)
      } else {
        logger.error('Failed to fetch tag stats:', error.message)
      }
    } else {
      logger.error('Failed to fetch tag stats:', error)
    }
    return []
  }
}

/**
 * Timeline interface (API response)
 */
export interface ApiTimeline {
  title: string
  subtitle: string
  description: string
  start_date: string
  end_date: string | null
  location: string | null
  tags: string[]
  skills: string[]
  is_public: boolean
  id: number
  user_id: number
  created_at: string
  updated_at: string
  duration: string
}

/**
 * Timelines Response interface
 */
export interface TimelinesResponse {
  timelines: ApiTimeline[]
  total: number
  skip: number
  limit: number
}

/**
 * Timelines query parameters
 */
export interface TimelinesParams {
  skip?: number
  limit?: number
  public_only?: boolean
  search?: string | null
  tags?: string | null
}

/**
 * 获取时间线列表
 */
export async function getTimelines(params: TimelinesParams = {}): Promise<TimelinesResponse> {
  const {
    skip = 0,
    limit = 20,
    public_only = true,
    search = null,
    tags = null,
  } = params

  const searchParams = new URLSearchParams()
  searchParams.set('skip', skip.toString())
  searchParams.set('limit', limit.toString())
  searchParams.set('public_only', public_only.toString())
  if (search) {
    searchParams.set('search', search)
  }
  if (tags) {
    searchParams.set('tags', tags)
  }

  const url = `${API_BASE_URL}/api/v1/timelines/?${searchParams.toString()}`

  try {
    // 创建超时控制器：缩短超时时间，快速失败（优化首屏加载）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时（开发环境快速失败）

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 时间线数据缓存 60 秒，确保更新及时显示
      next: { revalidate: 60 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于错误，返回空数据
      if (response.status >= 500) {
        logger.warn(`Timelines API returned ${response.status}, returning empty data`)
        return { timelines: [], total: 0, skip, limit }
      }
      logger.warn(`Timelines request failed: ${response.status} ${response.statusText}, returning empty data`)
      return { timelines: [], total: 0, skip, limit }
    }

    const data: TimelinesResponse = await response.json()
    return data
  } catch (error) {
    // 捕获所有错误
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn('Timelines API request failed (network/timeout):', error.message)
      } else {
        logger.error('Failed to fetch timelines:', error.message)
      }
    } else {
      logger.error('Failed to fetch timelines:', error)
    }
    return { timelines: [], total: 0, skip, limit }
  }
}

/**
 * 将 API 返回的 ApiTimeline 转换为 TimelineEntry 格式
 */
export function convertApiTimelineToTimelineEntry(
  apiTimeline: ApiTimeline,
  locale: string
): import('@/components/TimelineList').TimelineEntry {
  // 根据标题或标签推断类型
  const titleLower = apiTimeline.title.toLowerCase()
  // 以下变量保留用于将来的功能扩展（搜索、过滤等）
  // const subtitleLower = apiTimeline.subtitle?.toLowerCase() || ''
  // const tagsLower = apiTimeline.tags.map(t => t.toLowerCase())

  let type: 'work' | 'project' | 'education' | 'achievement' = 'project'
  let icon = '📅'
  let color = 'bg-gray-500'

  // 判断类型
  if (
    titleLower.includes('work') ||
    titleLower.includes('job') ||
    titleLower.includes('intern') ||
    titleLower.includes('employment') ||
    titleLower.includes('公司') ||
    titleLower.includes('工作') ||
    titleLower.includes('实习')
  ) {
    type = 'work'
    icon = '💼'
    color = 'bg-green-500'
  } else if (
    titleLower.includes('education') ||
    titleLower.includes('study') ||
    titleLower.includes('university') ||
    titleLower.includes('school') ||
    titleLower.includes('学习') ||
    titleLower.includes('教育') ||
    titleLower.includes('大学')
  ) {
    type = 'education'
    icon = '🎓'
    color = 'bg-blue-500'
  } else if (
    titleLower.includes('achievement') ||
    titleLower.includes('award') ||
    titleLower.includes('contest') ||
    titleLower.includes('prize') ||
    titleLower.includes('成就') ||
    titleLower.includes('奖项') ||
    titleLower.includes('比赛')
  ) {
    type = 'achievement'
    icon = '🏆'
    color = 'bg-orange-500'
  } else {
    type = 'project'
    icon = '💻'
    color = 'bg-purple-500'
  }

  // 格式化日期
  const startDate = new Date(apiTimeline.start_date)
  const endDate = apiTimeline.end_date ? new Date(apiTimeline.end_date) : null
  const now = new Date()

  // 判断是否为当前状态（没有结束日期或结束日期在未来）
  const isCurrent = !endDate || endDate > now

  // 格式化日期字符串
  const dateStr = locale === 'zh'
    ? `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`
    : `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`

  return {
    id: apiTimeline.id.toString(),
    title: apiTimeline.title,
    subtitle: apiTimeline.subtitle || undefined,
    description: apiTimeline.description,
    type,
    date: dateStr,
    duration: apiTimeline.duration,
    location: apiTimeline.location || undefined,
    tags: [...apiTimeline.tags, ...apiTimeline.skills],
    icon,
    color,
    isCurrent,
    locale,
  }
}

/**
 * 将 API 返回的 ApiProject 转换为 ProjectList 需要的格式
 */
export function convertApiProjectToProject(apiProject: ApiProject, locale: string): import('@/components/ProjectList').Project {
  // 状态映射：根据 tag 字段判断
  const statusMap: Record<string, 'completed' | 'in-progress' | 'planned'> = {
    '已完成': 'completed',
    '完成': 'completed',
    '进行中': 'in-progress',
    '计划中': 'planned',
    'planned': 'planned',
    'completed': 'completed',
    'in-progress': 'in-progress',
    'in_progress': 'in-progress',
  }

  // 分类映射：根据 platform 判断
  const categoryMap: Record<string, 'web' | 'mobile' | 'other'> = {
    web: 'web',
    mobile: 'mobile',
    ios: 'mobile',
    android: 'mobile',
    desktop: 'other',
    github: 'other',
    gitee: 'other',
  }

  const status = statusMap[apiProject.tag || ''] || 'planned'
  const category = categoryMap[apiProject.platform?.toLowerCase() || ''] || 'other'

  // 技术栈：从 languages 数组中提取 language 字段
  const techStack: string[] = (apiProject.languages || [])
    .map((lang) => lang.language)
    .filter((lang): lang is string => typeof lang === 'string' && lang.trim().length > 0)

  // 根据 platform 判断是 GitHub 还是其他 URL
  const isGithub = apiProject.platform?.toLowerCase() === 'github'
  const isGitee = apiProject.platform?.toLowerCase() === 'gitee'

  // 处理空字符串：将空字符串转换为 undefined 或空字符串
  const avatarUrl = apiProject.avatar_url && apiProject.avatar_url.trim() ? apiProject.avatar_url : undefined
  const description = apiProject.description && apiProject.description.trim() ? apiProject.description : ''
  // 项目截图/封面图：优先使用 avatar_url 作为项目图片
  const imageUrl = avatarUrl

  return {
    id: apiProject.id.toString(),
    title: apiProject.name || 'Untitled Project',
    description,
    status,
    techStack,
    projectUrl: apiProject.url || undefined,
    githubUrl: (isGithub || isGitee) ? apiProject.url : undefined,
    category,
    locale,
    platform: apiProject.platform,
    starsCount: apiProject.stars_count || 0,
    forksCount: apiProject.forks_count || 0,
    owner: apiProject.owner,
    repositoryName: apiProject.repository_name,
    avatarUrl,
    imageUrl,
    tag: apiProject.tag,
    createdAt: apiProject.created_at,
    updatedAt: apiProject.updated_at,
    languageStats: apiProject.language_stats,
  } as import('@/components/ProjectList').Project
}

/**
 * 相册照片接口
 * 对应后端 /api/v1/albums/ 返回的 photos 数据结构
 */
export interface AlbumPhoto {
  id: number
  minio_bucket: string
  minio_object_name: string
  original_filename: string
  file_size: number
  mime_type: string
  width: number
  height: number
  title: string
  description: string
  tags: string[]
  thumbnail_minio_object_name: string
  is_cover: boolean
  sort_order: number
  image_url: string
  thumbnail_url: string
  created_at: string
}

/**
 * 相册接口
 * 对应后端 /api/v1/albums/ 返回的数据结构
 */
export interface Album {
  title: string
  description: string
  tags: string[]
  is_public: boolean
  id: number
  user_id: number
  cover_photo_id: number
  view_count: number
  created_at: string
  updated_at: string
  photos: AlbumPhoto[]
  cover_photo: AlbumPhoto | null
  photo_count: number
}

/**
 * 获取相册列表的查询参数
 */
export interface AlbumsParams {
  skip?: number
  limit?: number
  public_only?: boolean
  tag?: string | null
  sort_by?: 'created_at' | 'updated_at' | 'view_count' | 'title'
}

/**
 * 获取相册列表的响应
 */
export interface AlbumsResponse {
  albums: Album[]
  total: number
  page: number
  per_page: number
}

/**
 * 获取相册列表
 */
export async function getAlbums(params: AlbumsParams = {}): Promise<AlbumsResponse> {
  const {
    skip = 0,
    limit = 20,
    public_only = true,
    tag = null,
    sort_by = 'created_at',
  } = params

  // 验证参数
  const validatedSkip = Math.max(skip || 0, 0)
  const validatedLimit = Math.min(Math.max(limit || 20, 1), 100)

  const searchParams = new URLSearchParams()
  searchParams.append('skip', validatedSkip.toString())
  searchParams.append('limit', validatedLimit.toString())
  searchParams.append('public_only', public_only.toString())
  if (tag !== null && tag !== undefined && tag.trim()) {
    searchParams.append('tag', tag.trim())
  }
  searchParams.append('sort_by', sort_by)

  const url = `${API_BASE_URL}/api/v1/albums/?${searchParams.toString()}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 相册数据缓存 60 秒
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回空数据
      if (response.status >= 500) {
        logger.warn(`Albums API returned ${response.status}, returning empty data`)
        return { albums: [], total: 0, page: 0, per_page: validatedLimit }
      }
      throw new Error(`Albums request failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as AlbumsResponse
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Albums request timeout')
      return { albums: [], total: 0, page: 0, per_page: validatedLimit }
    }
    logger.error('Failed to fetch albums:', error)
    return { albums: [], total: 0, page: 0, per_page: validatedLimit }
  }
}

/**
 * 获取单个相册详情
 */
export async function getAlbumById(albumId: number): Promise<Album | null> {
  const url = `${API_BASE_URL}/api/v1/albums/${albumId}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 相册详情缓存 60 秒
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 404 错误，返回 null
      if (response.status === 404) {
        logger.warn(`Album ${albumId} not found`)
        return null
      }
      // 对于 5xx 错误，返回 null
      if (response.status >= 500) {
        logger.warn(`Albums API returned ${response.status} for album ${albumId}`)
        return null
      }
      throw new Error(`Album request failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as Album
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(`Album ${albumId} request timeout`)
      return null
    }
    logger.error(`Failed to fetch album ${albumId}:`, error)
    return null
  }
}

/**
 * 将 API 返回的 Album 转换为 GalleryList 需要的格式
 */
export function convertAlbumToGalleryEntry(album: Album, locale: string) {
  const rawCover = album.cover_photo?.image_url || album.cover_photo?.thumbnail_url || ''
  const coverImage = getImageUrl(rawCover)

  return {
    id: album.id.toString(),
    title: album.title,
    description: album.description || '',
    coverImage,
    photoCount: album.photo_count || album.photos?.length || 0,
    source: '', // 相册没有 source 字段
    date: new Date(album.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US'),
    tags: album.tags || [],
    locale,
    viewCount: album.view_count || 0,
    createdAt: album.created_at,
    updatedAt: album.updated_at,
  }
}

/**
 * 站点统计信息接口
 * 对应后端 /api/v1/site-stats/ 返回的数据结构
 */
export interface SiteStats {
  uptime_days: number
  uptime_hours: number
  start_time: string
  total_requests: number
  today_requests: number
  total_visitors: number
  today_visitors: number
  average_requests_per_day: number
  top_pages: Array<string | {
    path?: string
    url?: string
    visits?: number
  }>
  album_count: number
  photo_count: number
  diary_count: number
  memory_usage_mb: number
  db_connections: number
}

/**
 * 获取站点统计信息
 */
export async function getSiteStats(): Promise<SiteStats | null> {
  const url = `${API_BASE_URL}/api/v1/site-stats/`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 站点统计只是仪表盘的展示数据，接口异常（5xx/401/403 等）统一降级为“暂无数据”，
      // 交给页面 loadFailed 空态。这里不能抛错——抛出去会被下面的 catch 记成 error，
      // 在开发浮层里报成服务端错误。
      logger.warn(`SiteStats API returned ${response.status} ${response.statusText}, returning null`)
      return null
    }

    const data = (await response.json()) as SiteStats
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('SiteStats request timeout')
      return null
    }
    logger.error('Failed to fetch site stats:', error)
    return null
  }
}

