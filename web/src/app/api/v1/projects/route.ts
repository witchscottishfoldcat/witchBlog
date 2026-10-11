import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

const API_BASE_URL = getApiBaseUrl()

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
 * Validate and parse query parameters
 */
function validateQueryParams(searchParams: URLSearchParams): {
  skip: number
  limit: number
  platform: string | null
  tag: string | null
  language: string | null
  search: string | null
  errors: ValidationError[]
} {
  const errors: ValidationError[] = []
  
  // Parse skip
  let skip = 0
  const skipParam = searchParams.get('skip')
  if (skipParam !== null) {
    const skipNum = parseInt(skipParam, 10)
    if (isNaN(skipNum) || skipNum < 0) {
      errors.push({
        loc: ['query', 'skip'],
        msg: 'skip must be an integer >= 0',
        type: 'value_error',
      })
    } else {
      skip = skipNum
    }
  }
  
  // Parse limit
  let limit = 100
  const limitParam = searchParams.get('limit')
  if (limitParam !== null) {
    const limitNum = parseInt(limitParam, 10)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push({
        loc: ['query', 'limit'],
        msg: 'limit must be an integer between 1 and 1000',
        type: 'value_error',
      })
    } else {
      limit = limitNum
    }
  }
  
  // Parse optional filters
  const platform = searchParams.get('platform')
  const tag = searchParams.get('tag')
  const language = searchParams.get('language')
  const search = searchParams.get('search')
  
  return { skip, limit, platform, tag, language, search, errors }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Validate query parameters
  const { skip, limit, platform, tag, language, search, errors } = validateQueryParams(searchParams)
  
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
  
  // Build the backend API URL with query parameters
  const backendUrl = new URL(`${API_BASE_URL}/api/v1/projects/`)
  backendUrl.searchParams.set('skip', skip.toString())
  backendUrl.searchParams.set('limit', limit.toString())
  if (platform) {
    backendUrl.searchParams.set('platform', platform)
  }
  if (tag) {
    backendUrl.searchParams.set('tag', tag)
  }
  if (language) {
    backendUrl.searchParams.set('language', language)
  }
  if (search) {
    backendUrl.searchParams.set('search', search)
  }
  
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
      logger.error(`Projects API returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch projects: ${response.status} ${response.statusText}` },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const data = await response.json()
    
    // Return data with CORS headers
    return NextResponse.json(data, {
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
      logger.error('Projects API request timeout')
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
    
    logger.error('Failed to fetch projects:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
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

