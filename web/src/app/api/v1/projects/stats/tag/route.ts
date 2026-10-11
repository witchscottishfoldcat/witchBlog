import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

const API_BASE_URL = getApiBaseUrl()

/**
 * Tag Stat interface
 */
interface TagStat {
  tag: string
  count: number
}

/**
 * GET /api/v1/projects/stats/tag
 * Get Tag Stats
 * 
 * 获取各标签项目数量统计
 * 
 * @param request - NextRequest object
 * @returns Array of tag statistics (200)
 */
export async function GET() {
  // Build the backend API URL
  const backendUrl = `${API_BASE_URL}/api/v1/projects/stats/tag`
  
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
      // For other errors, return error response
      logger.error(`Tag Stats API returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch tag stats: ${response.status} ${response.statusText}` },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const data = (await response.json()) as TagStat[]
    
    // Return data with CORS headers
    return NextResponse.json<TagStat[]>(data, {
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
      logger.error('Tag Stats API request timeout')
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
    
    logger.error('Failed to fetch tag stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch tag stats',
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

