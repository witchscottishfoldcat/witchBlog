/**
 * 统一的日志工具
 * 在生产环境仅输出错误日志，开发环境输出所有日志
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * 普通日志（仅在开发环境输出）
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  /**
   * 错误日志（生产环境和开发环境都输出）
   */
  error: (...args: unknown[]) => {
    // 生产环境也输出错误日志，便于排查问题
    console.error(...args)
  },

  /**
   * 警告日志（仅在开发环境输出）
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  /**
   * 信息日志（仅在开发环境输出）
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args)
    }
  },

  /**
   * 调试日志（仅在开发环境输出）
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },
}

