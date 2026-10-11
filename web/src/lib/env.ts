/**
 * 环境变量配置
 * 统一管理所有环境变量，提供类型安全和默认值
 */

/**
 * 获取 API 基础 URL
 * 优先使用环境变量，否则使用默认值
 */
export function getApiBaseUrl(): string {
  // 优先使用环境变量；本地默认连本机后端（相册/日记图走 /api/v1/proxy/oss rewrite）
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
}

/**
 * 获取允许的 CORS 来源
 * 从环境变量读取，支持多个来源（逗号分隔）
 */
export function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS?.split(',') || []
  
  // 开发环境默认允许 localhost
  if (process.env.NODE_ENV === 'development') {
    return [
      ...origins,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]
  }
  
  return origins
}

/**
 * 检查是否为开发环境
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * 检查是否为生产环境
 */
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * API 请求超时配置（毫秒）
 */
export const API_TIMEOUT = {
  DEFAULT: 10000,      // 默认超时：10秒
  SHORT: 5000,         // 短超时：5秒（用于快速请求）
  LONG: 20000,         // 长超时：20秒（用于复杂请求）
  IMAGE: 15000,        // 图片请求超时：15秒
}

