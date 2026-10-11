import { NextRequest, NextResponse } from 'next/server'
import { ApiTimeline } from '@/lib/api'

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
 * GET /api/v1/timelines/{timeline_id}
 * Get Timeline
 * 
 * 获取单个时间线记录
 * 
 * @param request - NextRequest object
 * @param params - Route parameters containing timeline_id
 * @returns Timeline data (200) or validation error (422)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ timeline_id: string }> }
) {
  const { timeline_id } = await params
  
  // 验证 timeline_id 是否为有效数字
  const timelineIdNum = parseInt(timeline_id, 10)
  if (isNaN(timelineIdNum) || timelineIdNum < 0) {
    return NextResponse.json<ValidationErrorResponse>(
      {
        detail: [
          {
            loc: ['path', 'timeline_id'],
            msg: 'timeline_id must be a valid integer >= 0',
            type: 'value_error',
          },
        ],
      },
      {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  // Build the backend API URL
  const backendUrl = `${API_BASE_URL}/api/v1/timelines/${timelineIdNum}`
  
  try {
    // Create timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds timeout
    
    const response = await fetch(backendUrl, {
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
      
      // For 404, return not found
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Timeline not found' },
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
      
      // For other errors, return error response
      logger.error(`Timeline API returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch timeline: ${response.status} ${response.statusText}` },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const data = (await response.json()) as ApiTimeline
    
    // Return data with CORS headers
    return NextResponse.json<ApiTimeline>(data, {
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
      logger.error('Timeline API request timeout')
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
    
    logger.error('Failed to fetch timeline:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch timeline',
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

