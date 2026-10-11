import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  // 尝试多种方式获取 URL 参数，确保正确处理编码
  const searchParams = request.nextUrl.searchParams
  let imageUrl = searchParams.get('url')

  logger.log('[Proxy Image] Raw request:', {
    searchParams: request.nextUrl.search,
    rawUrl: imageUrl,
    searchParamsKeys: Array.from(searchParams.keys()),
    hasPercent: imageUrl?.includes('%') || false
  })

  // Next.js 的 searchParams.get() 应该已经自动解码，但为了确保正确性，我们进行多重检查
  if (!imageUrl) {
    // 如果 searchParams.get() 返回 null，尝试从原始 search 字符串解析
    const searchString = request.nextUrl.search
    const urlMatch = searchString.match(/[?&]url=([^&]+)/)
    if (urlMatch) {
      try {
        const rawUrl = urlMatch[1]
        imageUrl = decodeURIComponent(rawUrl)
        logger.log('[Proxy Image] Extracted URL from search string:', { raw: rawUrl, decoded: imageUrl })
      } catch (e) {
        logger.warn('[Proxy Image] Failed to decode URL from search string:', e)
      }
    }
  }

  if (!imageUrl) {
    logger.error('Proxy image: Missing URL parameter')
    return NextResponse.json(
      { error: 'Missing image URL parameter' },
      { status: 400 }
    )
  }

  // 确保 URL 完全解码（处理可能的双重编码或部分编码）
  // 如果 URL 仍然包含编码字符（%），尝试解码
  if (imageUrl.includes('%')) {
    try {
      let decoded = imageUrl
      let decodeCount = 0
      let previousDecoded = ''
      
      // 继续解码直到不再变化或达到最大次数（最多解码 3 次，防止无限循环）
      while (decoded.includes('%') && decodeCount < 3 && decoded !== previousDecoded) {
        previousDecoded = decoded
        decoded = decodeURIComponent(decoded)
        decodeCount++
      }
      
      if (decoded !== imageUrl) {
        logger.log('[Proxy Image] URL decoded:', { 
          original: imageUrl, 
          decoded, 
          decodeCount,
          stillHasPercent: decoded.includes('%')
        })
        imageUrl = decoded
      }
    } catch (e) {
      logger.warn('[Proxy Image] Failed to decode URL, using original:', imageUrl, e)
      // 如果解码失败，尝试从原始 search 字符串重新获取
      const searchString = request.nextUrl.search
      const urlMatch = searchString.match(/[?&]url=([^&]+)/)
      if (urlMatch) {
        try {
          imageUrl = decodeURIComponent(urlMatch[1])
          logger.log('[Proxy Image] Retried decoding from search string:', imageUrl)
        } catch (e2) {
          logger.error('[Proxy Image] Failed to decode URL completely:', e2)
        }
      }
    }
  }

  // 在解析 URL 之前记录最终解码后的 URL
  logger.log('[Proxy Image] Final imageUrl before parsing:', {
    imageUrl,
    length: imageUrl.length,
    startsWithHttp: imageUrl.startsWith('http://') || imageUrl.startsWith('https://'),
    hasPercent: imageUrl.includes('%')
  })

  try {
    // 验证URL格式
    let url: URL
    try {
      url = new URL(imageUrl)
      logger.log('[Proxy Image] URL parsed successfully:', {
        protocol: url.protocol,
        hostname: url.hostname,
        host: url.host,
        port: url.port,
        pathname: url.pathname,
        fullUrl: url.toString()
      })
      
      // 验证 hostname 是否存在
      if (!url.hostname || url.hostname.trim() === '') {
        logger.error('[Proxy Image] Hostname is empty after URL parsing!', {
          imageUrl,
          url: url.toString(),
          hostname: url.hostname,
          host: url.host
        })
        return NextResponse.json(
          { error: 'Invalid URL: hostname is empty after parsing' },
          { status: 400 }
        )
      }
    } catch (e) {
      logger.error('[Proxy Image] Invalid URL format:', {
        imageUrl,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined
      })
      return NextResponse.json(
        { error: 'Invalid URL format', details: e instanceof Error ? e.message : 'Unknown error' },
        { status: 400 }
      )
    }

    // 只允许http和https协议
    if (!['http:', 'https:'].includes(url.protocol)) {
      logger.error('[Proxy Image] Invalid protocol:', url.protocol)
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    // 验证 URL 是否来自允许的主机（安全措施）
    // 与 src/lib/image-utils.ts 中的 PROXY_IMAGE_HOST_PATTERNS 保持一致
    // 内网/自建图片服务器从 IMAGE_SERVER_HOSTS 环境变量读取（host 或 host:port，
    // 逗号分隔），真实 IP 不硬编码进仓库；本地开发在 .env.local 中配置。
    // 安全规则：只做精确匹配（真实域名额外允许子域名），
    // 禁止任何关键字模糊匹配——否则 attacker-minio.example.com 之类的主机名
    // 会绕过白名单，让服务器替攻击者发起请求（SSRF）
    const envImageHosts = (process.env.IMAGE_SERVER_HOSTS || '')
      .split(',')
      .map((entry) => entry.trim().split(':')[0].toLowerCase())
      .filter((host) => Boolean(host) && ![
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
      ].includes(host))

    const developmentHosts = process.env.NODE_ENV === 'production'
      ? []
      : ['localhost', '127.0.0.1']
    const allowedHosts = [...developmentHosts, ...envImageHosts]

    // 规范化 hostname：去除空格、转换为小写
    let hostname = url.hostname
    if (!hostname) {
      logger.error('[Proxy Image] Hostname is empty!', { url: url.toString(), hostname: url.hostname, host: url.host })
      return NextResponse.json(
        { error: 'Invalid URL: hostname is empty' },
        { status: 400 }
      )
    }
    hostname = hostname.toLowerCase().trim()

    const isIpv4Address = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)

    const isAllowed = allowedHosts.some(host => {
      const normalizedHost = host.toLowerCase().trim()

      // 精确匹配（主要匹配方式）
      if (hostname === normalizedHost) {
        return true
      }

      // 子域名匹配仅对真实域名开放；IP 与 localhost 不允许子域名
      // （*.localhost 在多数解析器下指向回环地址，等于放开内网访问）
      if (
        !isIpv4Address &&
        normalizedHost !== 'localhost' &&
        hostname.endsWith(`.${normalizedHost}`)
      ) {
        return true
      }

      return false
    })

    logger.log('[Proxy Image] Domain check result:', {
      hostname,
      isAllowed,
    })

    if (!isAllowed) {
      // 不向客户端回显白名单内容，避免泄露服务器拓扑
      logger.error('[Proxy Image] ✗ URL not allowed', {
        hostname,
        imageUrl,
      })

      return NextResponse.json(
        { error: 'Image URL not allowed' },
        { status: 403 }
      )
    }

    logger.log('Proxy image: Fetching from', imageUrl)

    // 获取图片，添加适当的请求头
    const headers: HeadersInit = {
      'Accept': 'image/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    
    // 检查是否是 MinIO 服务器（自建服务器列表同样来自 IMAGE_SERVER_HOSTS）
    const isMinIOServer =
      url.hostname.includes('minio') ||
      envImageHosts.includes(url.hostname)
    
    // 根据域名设置不同的请求头
    if (url.hostname.includes('nflxso.net')) {
      headers['Referer'] = 'https://www.netflix.com/'
    } else if (url.hostname.includes('bilibili.com') || url.hostname.includes('hdslb.com')) {
      headers['Referer'] = 'https://www.bilibili.com/'
    } else if (isMinIOServer) {
      // MinIO 服务器：不设置 Referer，避免可能的 CORS/安全策略问题
      // 对于公开的 MinIO bucket，通常不需要特殊请求头
      logger.log('[Proxy Image] MinIO server detected, using minimal headers')
    } else {
      // 其他服务器：设置 Referer 为源站
      headers['Referer'] = url.origin + '/'
    }
    
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    // 获取图片（支持MinIO和外部图片）
    // redirect: 'manual' —— 不跟随重定向：重定向目标不经过白名单校验，
    // 跟随等于允许白名单主机把请求转投到任意外部地址（SSRF）
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'manual',
    })

    clearTimeout(timeoutId)

    if (response.status >= 300 && response.status < 400) {
      logger.error('Proxy image: refused redirect', {
        status: response.status,
        location: response.headers.get('location'),
        url: imageUrl,
      })
      return NextResponse.json(
        { error: 'Image URL not allowed' },
        { status: 403 }
      )
    }

    if (!response.ok) {
      // 尝试获取错误响应体（如果有）
      let errorBody = ''
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          errorBody = JSON.stringify(errorData)
        } else if (contentType && contentType.includes('text/')) {
          errorBody = await response.text()
        }
      } catch {
        // 忽略获取错误体的错误
      }
      
      logger.error('Proxy image: Fetch failed', {
        status: response.status,
        statusText: response.statusText,
        url: imageUrl,
        hostname: url.hostname,
        headers: Object.fromEntries(response.headers.entries()),
        errorBody: errorBody || 'N/A'
      })
      
      // 对于 403 错误，提示上游拒绝访问（不回显上游响应体，避免泄露内部信息）
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: `Failed to fetch image: ${response.status} ${response.statusText}`,
            details: 'The upstream server returned 403 Forbidden. This may be due to access policies or authentication requirements.',
          },
          { status: response.status }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    // 检查响应类型
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      )
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer()

    logger.log('Proxy image: Success', {
      contentType,
      size: imageBuffer.byteLength,
      url: imageUrl
    })

    // 返回图片，设置适当的 CORS 头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 缓存1天
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    logger.error('Error proxying image:', error, { imageUrl })
    
    // 如果是超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

