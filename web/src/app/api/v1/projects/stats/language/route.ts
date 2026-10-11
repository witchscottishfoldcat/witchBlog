import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

const API_BASE_URL = getApiBaseUrl()

/**
 * Language Stat interface
 */
interface LanguageStat {
  language: string
  total_percentage: number
  project_count: number
}

/**
 * Validation Error interface
 */
interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

/**
 * Validation Error Response interface
 */
interface ValidationErrorResponse {
  detail: ValidationError[]
}

/**
 * GET /api/v1/projects/stats/language
 * Get Language Stats
 * 
 * 获取使用最多的编程语言统计
 * 
 * @param request - NextRequest object
 * @returns Array of language statistics (200) or validation error (422)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Parse and validate limit parameter
  let limit = 10 // default value
  const limitParam = searchParams.get('limit')
  const errors: ValidationError[] = []
  
  if (limitParam !== null) {
    const limitNum = parseInt(limitParam, 10)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      errors.push({
        loc: ['query', 'limit'],
        msg: 'limit must be an integer between 1 and 50',
        type: 'value_error',
      })
    } else {
      limit = limitNum
    }
  }
  
  // If validation errors exist, return 422
  if (errors.length > 0) {
    return NextResponse.json<ValidationErrorResponse>(
      {
        detail: errors,
      },
      {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  // Build the backend API URL with query parameter
  const backendUrl = new URL(`${API_BASE_URL}/api/v1/projects/stats/language`)
  backendUrl.searchParams.set('limit', limit.toString())
  
  try {
    // Create timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds timeout
    
    const response = await fetch(backendUrl.toString(), {
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
      // If backend returns validation error, forward it
      if (response.status === 422) {
        const errorData = await response.json()
        return NextResponse.json<ValidationErrorResponse>(
          errorData,
          {
            status: 422,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
      
      // For other errors, return error response
      logger.error(`Language Stats API returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch language stats: ${response.status} ${response.statusText}` },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const data = (await response.json()) as LanguageStat[]
    
    // Return data with CORS headers
    return NextResponse.json<LanguageStat[]>(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    })
  } catch (error) {
    // Handle timeout and network errors
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Language Stats API request timeout')
      return NextResponse.json(
        { error: 'Request timeout' },
        {
          status: 504,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    logger.error('Failed to fetch language stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch language stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

