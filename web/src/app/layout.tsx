import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import Live2DViewer from '@/components/Live2DViewer'
import { faviconConfig } from '@/config/assets'
import { getPublicSiteConfig } from '@/lib/api'
import { getSiteBaseUrl } from '@/lib/site-url'
import { getAvatarUrl } from '@/lib/image-utils'

export async function generateMetadata(): Promise<Metadata> {
  const { site_name: siteName, site_icon: siteIcon } = await getPublicSiteConfig()
  const dynamicIcon = siteIcon?.trim()
  const siteUrl = getSiteBaseUrl()

  return {
    metadataBase: new URL(siteUrl),
    // 浏览器标签页标题跟随后台「站点配置-网站名称」；后端异常返回默认值，
    // 仅在名称为空时回退到历史硬编码标题
    title: siteName?.trim() || 'WitchCat QAQ 愿幸运与你相伴',
    description: "Witch's Folded Ear Blog",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: dynamicIcon
      ? {
          icon: [{ url: dynamicIcon }],
          shortcut: [{ url: dynamicIcon }],
          apple: [{ url: dynamicIcon }],
        }
      : {
          icon: [
            {
              url: faviconConfig.light[32],
              media: '(prefers-color-scheme: light)',
              sizes: '32x32',
              type: 'image/png',
            },
            {
              url: faviconConfig.dark[32],
              media: '(prefers-color-scheme: dark)',
              sizes: '32x32',
              type: 'image/png',
            },
          ],
          apple: [
            {
              url: faviconConfig.light[180],
              sizes: '180x180',
              type: 'image/png',
            },
          ],
        },
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 首屏 loading 头像与站点头像保持一致：优先使用后端配置的 profile_image，
  // 与 generateMetadata 的站点图标请求共用同一次 fetch 缓存，不会增加额外延迟
  const { profile_image: profileImage } = await getPublicSiteConfig()
  const resolvedAvatar = getAvatarUrl(profileImage)
  const loadingAvatarSrc = typeof resolvedAvatar === 'string' ? resolvedAvatar : resolvedAvatar.src
  return (
    <html suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* RSS Feed 链接 */}
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/rss/feed" />
        {/* 内联关键 CSS 和主题初始化脚本，立即显示内容，避免黑屏 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') ||
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
                // 首屏 loading 头像加载失败时隐藏，露出外层兜底渐变底色
                // （error 不冒泡，需用捕获阶段监听）
                document.addEventListener('error', function(e) {
                  var target = e.target;
                  if (target && target.id === 'initial-loading-avatar') {
                    target.style.visibility = 'hidden';
                  }
                }, true);
              })();
            `
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(to bottom, #f8f9fa, #ffffff);
              transition: background 0.2s ease;
            }
            html.dark body {
              background: linear-gradient(to bottom, #0f172a, #1e293b);
            }
          `
        }} />
      </head>
      <body style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* 立即显示加载状态，避免黑屏 */}
        <noscript>
          <style>{`
            #initial-loading { display: none !important; }
          `}</style>
        </noscript>
        <div id="initial-loading" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            // 兜底底色：本地头像加载失败时至少显示主题色圆形
            background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
          }}>
            <img
              id="initial-loading-avatar"
              src={loadingAvatarSrc}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes loading-breathe {
              0%, 100% { opacity: 0.45; }
              50% { opacity: 1; }
            }
            #initial-loading-avatar {
              animation: loading-breathe 2.5s ease-in-out infinite;
            }
            html.dark #initial-loading { background: linear-gradient(to bottom, #0f172a, #1e293b); }
            body.loaded #initial-loading {
              opacity: 0;
              visibility: hidden;
              pointer-events: none;
            }
          `
        }} />
        <Script
          id="error-handler"
          strategy="afterInteractive"
          src="/scripts/error-handler.js"
        />
        <Script
          id="remove-loading"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.classList.add('loaded');
              document.body.classList.add('loaded');
            `
          }}
        />
        <Live2DViewer />
        {children}
      </body>
    </html>
  )
}
