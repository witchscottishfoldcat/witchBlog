import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * 游戏展示 API 代理（同源，避免 CORS）
 * GET /api/games 或 ?type=overview -> 后端 /api/v1/games/
 * GET /api/games?type=list&page=1&size=20&... -> 后端 /api/v1/games/list?...
 */
export async function GET(request: NextRequest) {
  const API_BASE_URL = getApiBaseUrl()
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'overview'

  if (type === 'list') {
    const listParams = new URLSearchParams()
    const page = searchParams.get('page')
    const size = searchParams.get('size')
    const platform = searchParams.get('platform')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')
    const is_favorite = searchParams.get('is_favorite')
    const sort_by = searchParams.get('sort_by')
    if (page != null) listParams.set('page', page)
    if (size != null) listParams.set('size', size)
    if (platform != null) listParams.set('platform', platform)
    if (category != null) listParams.set('category', category)
    if (status != null) listParams.set('status', status)
    if (tags != null) listParams.set('tags', tags)
    if (is_favorite != null) listParams.set('is_favorite', is_favorite)
    if (sort_by != null) listParams.set('sort_by', sort_by)
    const url = `${API_BASE_URL}/api/v1/games/list?${listParams.toString()}`
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) {
        logger.warn(`Games list API returned ${response.status}`)
        return NextResponse.json(null, { status: response.status })
      }
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      if (error instanceof Error) logger.warn('Games list API proxy failed:', error.message)
      return NextResponse.json(null, { status: 502 })
    }
  }

  // type === 'overview'
  const url = `${API_BASE_URL}/api/v1/games/`
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!response.ok) {
      if (response.status >= 500) logger.warn(`Games overview API returned ${response.status}`)
      return NextResponse.json(null, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error) logger.warn('Games overview API proxy failed:', error.message)
    return NextResponse.json(null, { status: 502 })
  }
}
