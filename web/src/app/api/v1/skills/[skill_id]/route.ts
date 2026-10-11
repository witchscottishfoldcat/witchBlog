import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

const API_BASE_URL = getApiBaseUrl()

/**
 * Skill Period interface
 */
interface SkillPeriod {
  id: number
  start_date: string
  end_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Skill interface
 * 对应后端 /api/v1/skills/{skill_id} 返回的数据结构
 */
interface Skill {
  name: string
  category: string
  description: string
  id: number
  total_learning_days: number
  current_level: string
  created_at: string
  updated_at: string
  periods: SkillPeriod[]
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ skill_id: string }> }
) {
  const { skill_id } = await params
  
  // 验证 skill_id 是否为有效数字
  const skillIdNum = parseInt(skill_id, 10)
  if (isNaN(skillIdNum) || skillIdNum < 0) {
    return NextResponse.json<ValidationErrorResponse>(
      {
        detail: [
          {
            loc: ['path', 'skill_id'],
            msg: 'skill_id must be a valid integer >= 0',
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
  const backendUrl = `${API_BASE_URL}/api/v1/skills/${skillIdNum}`
  
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
          { error: 'Skill not found' },
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
      
      // For other errors, return error response
      logger.error(`Skill API returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch skill: ${response.status} ${response.statusText}` },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const data = (await response.json()) as Skill
    
    // Return data with CORS headers
    return NextResponse.json<Skill>(data, {
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
      logger.error('Skill API request timeout')
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
    
    logger.error('Failed to fetch skill:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch skill',
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

