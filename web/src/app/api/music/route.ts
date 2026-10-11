import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * 音乐 API 代理（同源，避免 CORS）
 * GET /api/music?type=home     -> 后端 /api/v1/music/
 * GET /api/music?type=random&count=10 -> 后端 /api/v1/music/tracks/random?count=10
 */
export async function GET(request: NextRequest) {
  const API_BASE_URL = getApiBaseUrl()
  const type = request.nextUrl.searchParams.get('type') || 'home'

  // 获取歌曲直链（用于 <audio> 播放）
  if (type === 'url') {
    const id = request.nextUrl.searchParams.get('id')
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ url: null, playable: false, reason: 'invalid id' })
    }
    const br = Math.min(320000, Math.max(64000, Number(request.nextUrl.searchParams.get('br')) || 320000))
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)
      const url = `https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=${br}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) return NextResponse.json({ url: null, playable: false, reason: 'api_error' }, { status: 502 })
      const data = await response.json()
      const songData = data?.data?.[0]
      const playable = !!songData?.url
      return NextResponse.json({
        url: songData?.url ?? null,
        playable,
        br: songData?.br ?? br,
        type: songData?.type ?? null,
      })
    } catch (error) {
      if (error instanceof Error) logger.warn('Netease url API failed:', error.message)
      return NextResponse.json({ url: null, playable: false, reason: 'network_error' }, { status: 502 })
    }
  }

  // 检查歌曲是否可播放（非 VIP）
  if (type === 'check') {
    const id = request.nextUrl.searchParams.get('id')
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ playable: false, reason: 'invalid id' })
    }
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const url = `https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) {
        return NextResponse.json({ playable: false, reason: 'api_error' })
      }
      const data = await response.json()
      // data.data 是数组，每项的 url 为 null 表示不可播放（VIP）
      const songData = data?.data?.[0]
      const playable = !!(songData?.url)
      return NextResponse.json({ playable })
    } catch (error) {
      if (error instanceof Error) logger.warn('Netease check API failed:', error.message)
      // 网络错误时默认认为可播放，避免误跳
      return NextResponse.json({ playable: true, reason: 'network_error' })
    }
  }

  // 获取歌单的歌曲列表
  if (type === 'playlist') {
    const id = request.nextUrl.searchParams.get('id')
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ items: [] }, { status: 400 })
    }
    const url = `${API_BASE_URL}/api/v1/music/playlists/${id}/tracks/`
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) return NextResponse.json({ items: [] }, { status: response.status })
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      if (error instanceof Error) logger.warn('Playlist tracks API proxy failed:', error.message)
      return NextResponse.json({ items: [] }, { status: 502 })
    }
  }

  if (type === 'random') {
    const count = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get('count')) || 10))
    const url = `${API_BASE_URL}/api/v1/music/tracks/random?count=${count}`
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: 120 },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) return NextResponse.json([], { status: response.status })
      const data = await response.json()
      return NextResponse.json(Array.isArray(data) ? data : [])
    } catch (error) {
      if (error instanceof Error) logger.warn('Music random API proxy failed:', error.message)
      return NextResponse.json([], { status: 502 })
    }
  }

  // type === 'home'
  const url = `${API_BASE_URL}/api/v1/music/`
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!response.ok) {
      if (response.status >= 500) logger.warn(`Music API returned ${response.status}, returning null`)
      return NextResponse.json(null, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error) logger.warn('Music API proxy failed:', error.message)
    return NextResponse.json(null, { status: 502 })
  }
}
