import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

const API_BASE_URL = getApiBaseUrl()

/**
 * Diary Image interface
 */
interface DiaryImage {
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
 */
interface Diary {
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
 */
interface DiariesResponse {
  diaries: Diary[]
  total: number
  page: number
  per_page: number
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
 * Validate and parse query parameters
 */
function validateQueryParams(searchParams: URLSearchParams): {
  skip: number
  limit: number
  public_only: boolean
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
  let limit = 20
  const limitParam = searchParams.get('limit')
  if (limitParam !== null) {
    const limitNum = parseInt(limitParam, 10)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({
        loc: ['query', 'limit'],
        msg: 'limit must be an integer between 1 and 100',
        type: 'value_error',
      })
    } else {
      limit = limitNum
    }
  }
  
  // Parse public_only
  let public_only = true
  const publicOnlyParam = searchParams.get('public_only')
  if (publicOnlyParam !== null) {
    if (publicOnlyParam.toLowerCase() === 'true') {
      public_only = true
    } else if (publicOnlyParam.toLowerCase() === 'false') {
      public_only = false
    } else {
      errors.push({
        loc: ['query', 'public_only'],
        msg: 'public_only must be a boolean',
        type: 'type_error',
      })
    }
  }
  
  return { skip, limit, public_only, errors }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Validate query parameters
  const { skip, limit, public_only, errors } = validateQueryParams(searchParams)
  
  // If validation errors exist, return 422
  if (errors.length > 0) {
    return NextResponse.json<ValidationErrorResponse>(
      { detail: errors },
      {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  // Build the backend API URL
  const backendUrl = new URL(`${API_BASE_URL}/api/v1/diaries/`)
  backendUrl.searchParams.set('skip', skip.toString())
  backendUrl.searchParams.set('limit', limit.toString())
  backendUrl.searchParams.set('public_only', public_only.toString())
  
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
      logger.error(`Diaries API returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch diaries: ${response.status} ${response.statusText}` },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const data = (await response.json()) as DiariesResponse
    
    // Return data with CORS headers
    return NextResponse.json<DiariesResponse>(data, {
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
      logger.error('Diaries API request timeout')
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
    
    logger.error('Failed to fetch diaries:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch diaries',
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

