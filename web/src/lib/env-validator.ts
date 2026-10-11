/**
 * 环境变量验证
 * 在应用启动时验证必需的环境变量
 */

import { logger } from './logger'

interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * 必需的环境变量（生产环境）
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
] as const

/**
 * 可选但推荐的环境变量
 */
const RECOMMENDED_ENV_VARS = [
  'ALLOWED_ORIGINS',
] as const

/**
 * 验证环境变量
 * @param strict 是否严格模式（生产环境应该使用严格模式）
 * @returns 验证结果
 */
export function validateEnv(strict: boolean = process.env.NODE_ENV === 'production'): EnvValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  // 检查必需的环境变量
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  // 检查推荐的环境变量
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(envVar)
    }
  }

  const isValid = missing.length === 0

  if (!isValid && strict) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }

  if (missing.length > 0) {
    logger.warn(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (warnings.length > 0) {
    logger.warn(`Recommended environment variables not set: ${warnings.join(', ')}`)
  }

  return {
    isValid,
    missing,
    warnings,
  }
}

/**
 * 在应用启动时验证环境变量
 * 应该在应用入口处调用
 */
export function validateEnvOnStartup(): void {
  try {
    const result = validateEnv()
    
    if (result.isValid) {
      logger.log('Environment variables validation passed')
    } else {
      logger.warn('Environment variables validation completed with issues', {
        missing: result.missing,
        warnings: result.warnings,
      })
    }
  } catch (error) {
    // 在生产环境，如果验证失败应该抛出错误
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    // 在开发环境，只记录警告
    logger.error('Environment variables validation failed:', error)
  }
}

