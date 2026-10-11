/**
 * 统一的 API 请求客户端
 * 提供超时控制、错误处理和重试机制
 */

import { API_TIMEOUT } from './env'
import { logger } from './logger'

export interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface FetchError extends Error {
  status?: number
  statusText?: string
  response?: Response
}

/**
 * 带超时的 fetch 请求
 * @param url 请求 URL
 * @param options 请求选项
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = API_TIMEOUT.DEFAULT,
    retries = 0,
    retryDelay = 1000,
    signal: externalSignal,
    ...fetchOptions
  } = options

  let attempt = 0
  const maxAttempts = retries + 1

  while (attempt < maxAttempts) {
    let timeoutId: NodeJS.Timeout | null = null
    try {
      // 创建超时控制器
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), timeout)

      // 合并信号（如果外部提供了信号）
      const signal = externalSignal
        ? (() => {
            const combinedController = new AbortController()
            externalSignal.addEventListener('abort', () => combinedController.abort())
            controller.signal.addEventListener('abort', () => combinedController.abort())
            return combinedController.signal
          })()
        : controller.signal

      const response = await fetch(url, {
        ...fetchOptions,
        signal,
      })

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // 如果响应成功，直接返回
      if (response.ok) {
        return response
      }

      // 如果是服务器错误且还有重试机会，进行重试
      if (response.status >= 500 && attempt < maxAttempts - 1) {
        logger.warn(
          `API request failed with ${response.status}, retrying... (${attempt + 1}/${maxAttempts})`
        )
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
        attempt++
        continue
      }

      // 其他错误直接返回响应
      return response
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // 如果是超时错误且还有重试机会，进行重试
      if (
        error instanceof Error &&
        error.name === 'AbortError' &&
        attempt < maxAttempts - 1
      ) {
        logger.warn(
          `API request timeout, retrying... (${attempt + 1}/${maxAttempts})`
        )
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
        attempt++
        continue
      }

      // 其他错误直接抛出
      throw error
    }
  }

  throw new Error('Max retries exceeded')
}

/**
 * 获取 JSON 数据（带错误处理）
 * @param url 请求 URL
 * @param options 请求选项
 * @returns Promise<T>
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error: FetchError = new Error(
      `Request failed: ${response.status} ${response.statusText}`
    )
    error.status = response.status
    error.statusText = response.statusText
    error.response = response
    throw error
  }

  return response.json() as Promise<T>
}

/**
 * 获取文本数据（带错误处理）
 * @param url 请求 URL
 * @param options 请求选项
 * @returns Promise<string>
 */
export async function fetchText(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const response = await fetchWithTimeout(url, options)

  if (!response.ok) {
    const error: FetchError = new Error(
      `Request failed: ${response.status} ${response.statusText}`
    )
    error.status = response.status
    error.statusText = response.statusText
    error.response = response
    throw error
  }

  return response.text()
}

/**
 * 安全获取 JSON 数据（错误时返回默认值）
 * @param url 请求 URL
 * @param defaultValue 默认值
 * @param options 请求选项
 * @returns Promise<T>
 */
export async function fetchJsonSafe<T>(
  url: string,
  defaultValue: T,
  options: FetchOptions = {}
): Promise<T> {
  try {
    return await fetchJson<T>(url, options)
  } catch (error) {
    if (error instanceof Error) {
      // 如果是超时或网络错误，静默处理
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        logger.warn(`API request failed (network/timeout), using default value:`, error.message)
      } else {
        const fetchError = error as FetchError
        // 对于 5xx 错误，使用默认值
        if (fetchError.status && fetchError.status >= 500) {
          logger.warn(`API returned ${fetchError.status}, using default value`)
        } else {
          logger.error('Failed to fetch JSON:', error.message)
        }
      }
    } else {
      logger.error('Failed to fetch JSON:', error)
    }
    return defaultValue
  }
}

/**
 * 安全获取数组数据（错误时返回空数组）
 * @param url 请求 URL
 * @param options 请求选项
 * @returns Promise<T[]>
 */
export async function fetchArraySafe<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T[]> {
  return fetchJsonSafe<T[]>(url, [], options)
}
