/**
 * 站点对外 URL（RSS、OG 等），不依赖 request.url，避免构建时动态路由报错
 */
export function getSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    return vercel.startsWith('http') ? vercel.replace(/\/$/, '') : `https://${vercel}`
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://example.com'
  }

  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}
