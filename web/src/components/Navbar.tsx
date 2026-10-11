/**
 * 导航栏组件
 * 简洁、稳定的实现
 */

'use client'

import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ZCOOL_KuaiLe } from 'next/font/google'
import { useTheme } from '@/components/ThemeProvider'
import { useTranslations, useLocale } from 'next-intl'
import ThemeColorPicker from '@/components/ThemeColorPicker'
import SakuraToggle from '@/components/SakuraToggle'
import LayoutToggle from '@/components/LayoutToggle'
import NavbarDropdown from '@/components/NavbarDropdown'
import SearchModal from '@/components/SearchModal'
import { logoConfig, profileConfig } from '@/config/assets'
import { publicSiteConfig } from '@/config/public-site'
import { NAV_ROUTES } from '@/constants'
import avatarImage from '@/assets/images/avatar.webp'
import { Icon } from '@iconify/react'
import { logger } from '@/lib/logger'
import { getAvatarUrl, isProxyUrl } from '@/lib/image-utils'
import { isCurrentLocation, replayHeroEntrance } from '@/lib/hero-entrance'

// 头像请求 Promise（避免并发重复请求）
let avatarFetchPromise: Promise<string | null> | null = null
const NAVBAR_SOLID_SCROLL_Y = 220
const NAVBAR_FADE_DISTANCE = 160
const zcoolKuaiLe = ZCOOL_KuaiLe({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['cursive', 'system-ui', 'sans-serif'],
})

export default function Navbar() {
  const [navbarOpacity, setNavbarOpacity] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null) // 统一管理所有下拉菜单状态
  const [isMounted, setIsMounted] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profileConfig.avatar)
  const [avatarError, setAvatarError] = useState(false)
  
  const { theme, toggleTheme } = useTheme()
  const t = useTranslations('nav')
  const galleryT = useTranslations('gallery')
  const locale = useLocale()
  const isScrolled = navbarOpacity >= 0.55

  // 滚动检测
  useEffect(() => {
    if (typeof window === 'undefined') return

    let ticking = false
    const handleScroll = () => {
      if (document.documentElement.dataset.heroEntranceActive === 'true') return

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const configuredFadeStart = Number.parseFloat(
            document.documentElement.style.getPropertyValue('--navbar-fade-start-y')
          )
          const hasAnimatedHero = document.querySelector('.archive-hero-banner') !== null
          const fadeStart = Number.isFinite(configuredFadeStart)
            ? configuredFadeStart
            : hasAnimatedHero
              ? Number.POSITIVE_INFINITY
              : NAVBAR_SOLID_SCROLL_Y
          const nextOpacity = Math.min(
            1,
            Math.max(0, (window.scrollY - fadeStart) / NAVBAR_FADE_DISTANCE)
          )

          setNavbarOpacity((currentOpacity) =>
            Math.abs(currentOpacity - nextOpacity) < 0.005 ? currentOpacity : nextOpacity
          )
          ticking = false
        })
        ticking = true
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
      return () => {
        try {
          if (typeof window !== 'undefined' && window.removeEventListener) {
            window.removeEventListener('scroll', handleScroll)
          }
        } catch {
          // 静默处理清理错误
        }
      }
    }
    return () => {} // 确保所有代码路径都有返回值
  }, [])

  // 客户端挂载
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 获取头像
  useEffect(() => {
    if (!isMounted) return

    const cachedAvatar = localStorage.getItem('site_profile_image')
    if (cachedAvatar && cachedAvatar !== profileConfig.avatar) {
      setAvatarUrl(cachedAvatar)
      return
    }

    if (avatarFetchPromise) {
      avatarFetchPromise.then((url) => {
        if (url && url !== profileConfig.avatar) {
          setAvatarUrl(url)
        }
      })
      return
    }

    avatarFetchPromise = (async () => {
      try {
        // 使用缓存策略：头像不经常变化，缓存 5 分钟
        // 添加超时控制，避免长时间等待
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/site-config/public', { 
          next: { revalidate: 300 },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          const newAvatarUrl = data.profile_image || profileConfig.avatar
          
          if (newAvatarUrl && newAvatarUrl !== profileConfig.avatar) {
            localStorage.setItem('site_profile_image', newAvatarUrl)
            setAvatarUrl(newAvatarUrl)
            return newAvatarUrl
          }
        }
        return null
      } catch (error) {
        // 静默处理连接错误，避免控制台噪音
        if (error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('connection') ||
          error.message.includes('reset')
        )) {
          // 连接错误静默处理
        } else {
          logger.error('Navbar: Failed to fetch avatar:', error)
        }
        return null
      } finally {
        avatarFetchPromise = null
      }
    })()

    const timer = setTimeout(() => {
      avatarFetchPromise?.then((url) => {
        if (url && url !== profileConfig.avatar) {
          setAvatarUrl(url)
        }
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [isMounted])

  // 头像处理
  const { displayAvatar, isProxyUrl: needsProxy, imageSrc } = useMemo(() => {
    const avatar = (isMounted && avatarUrl && avatarUrl !== profileConfig.avatar) ? avatarUrl : profileConfig.avatar
    const src = getAvatarUrl(avatar)
    const proxy = isMounted && avatar && typeof avatar === 'string' && isProxyUrl(avatar)
    
    return {
      displayAvatar: avatar,
      isProxyUrl: proxy,
      imageSrc: src
    }
  }, [avatarUrl, isMounted])

  // 菜单项（与左侧边栏链接地址一致，使用统一路由常量）
  const navLinks = useMemo(() => [
    { key: 'home', href: NAV_ROUTES.home(locale), label: t('home'), icon: 'mdi:home' },
    { key: 'archive', href: NAV_ROUTES.archive(locale), label: t('archive'), icon: 'mdi:archive' },
    { key: 'links', href: NAV_ROUTES.friendLinks(locale), label: t('links'), icon: 'mdi:link' },
    { key: 'music', href: NAV_ROUTES.music(locale), label: t('music'), icon: 'mdi:music' },
    { key: 'my', href: NAV_ROUTES.my(locale), label: t('my'), icon: 'mdi:account' },
    { key: 'about', href: NAV_ROUTES.about(locale), label: t('about'), icon: 'mdi:information' },
    { key: 'dashboard', href: NAV_ROUTES.dashboard(locale), label: t('dashboard'), icon: 'mdi:view-dashboard' },
    { key: 'others', href: NAV_ROUTES.others(locale), label: t('others'), icon: 'mdi:dots-horizontal' },
  ], [locale, t])

  // 下拉菜单项
  const externalLinks = publicSiteConfig.socialLinks

  const linksMenuItems = useMemo(() => 
    externalLinks.map(link => ({ ...link, key: link.label.toLowerCase(), external: true })),
    [externalLinks]
  )

  const myMenuItems = useMemo(() => [
    { key: 'anime', label: t('anime'), icon: 'mdi:television', href: NAV_ROUTES.my(locale) },
    { key: 'diary', label: t('diary'), icon: 'mdi:book-edit', href: NAV_ROUTES.myDiary(locale) },
    { key: 'gallery', label: galleryT('gallery'), icon: 'mdi:image-multiple', href: NAV_ROUTES.myGallery(locale) },
    { key: 'games', label: t('games'), icon: 'mdi:gamepad-variant', href: NAV_ROUTES.games(locale) },
  ], [locale, t, galleryT])

  const aboutMenuItems = useMemo(() => [
    { key: 'about', label: t('about'), icon: 'mdi:account', href: NAV_ROUTES.about(locale) },
    { key: 'friendLinks', label: t('friendLinks'), icon: 'mdi:account-group', href: NAV_ROUTES.friendLinks(locale) },
    { key: 'support', label: t('support'), icon: 'mdi:heart', href: NAV_ROUTES.support(locale) },
  ], [locale, t])

  const othersMenuItems = useMemo(
    () => [
      { key: 'projects', label: t('projects'), icon: 'mdi:briefcase', href: NAV_ROUTES.projects(locale) },
      { key: 'skills', label: t('skills'), icon: 'mdi:brain', href: NAV_ROUTES.skills(locale) },
      { key: 'timeline', label: t('timeline'), icon: 'mdi:chart-timeline-variant', href: NAV_ROUTES.timeline(locale) },
    ],
    [locale, t]
  )

  // 切换语言（支持 zh, en, ja, ko）
  const switchLanguage = useCallback(
    (newLocale: string) => {
      if (typeof window === 'undefined') return
      
      // 使用实际 URL 路径
      const currentPath = window.location.pathname || '/'

      // 统一用正则把开头的语言前缀替换为新 locale
      let newPath = currentPath.replace(/^\/(zh|en|ja|ko)(\/|$)/, `/${newLocale}$2`)
      
      // 如果替换后路径没有变化（说明原路径没有语言前缀），添加语言前缀
      if (newPath === currentPath && !currentPath.startsWith(`/${newLocale}`)) {
        // 如果是根路径，直接添加语言前缀
        if (currentPath === '/') {
          newPath = `/${newLocale}`
        } else {
          // 移除开头的 /，然后添加新语言前缀
          const pathWithoutSlash = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath
          newPath = `/${newLocale}/${pathWithoutSlash}`
        }
      }
      
      // 确保路径以 / 开头
      if (!newPath.startsWith('/')) {
        newPath = `/${newPath}`
      }

      // 直接使用 window.location 导航，确保页面完全刷新并重新加载翻译
      window.location.href = newPath
    },
    []
  )

  // 下拉菜单切换（统一管理）
  const handleMenuToggle = useCallback((menuKey: string) => {
    return () => {
      setOpenMenu(prev => prev === menuKey ? null : menuKey)
    }
  }, [])

  const handleMenuClose = useCallback(() => {
    setOpenMenu(null)
  }, [])

  return (
    <nav
      className="scroll-aware-navbar fixed top-0 left-0 right-0 z-[100] max-md:bg-white/95 max-md:dark:bg-gray-900/95 max-md:backdrop-blur-lg max-md:shadow-sm max-md:border-b max-md:border-gray-200/80 max-md:dark:border-gray-800/80"
      style={{
        '--navbar-light-bg': `rgba(255, 255, 255, ${navbarOpacity * 0.9})`,
        '--navbar-dark-bg': `rgba(17, 24, 39, ${navbarOpacity * 0.9})`,
        '--navbar-backdrop': navbarOpacity > 0.001 ? `blur(${navbarOpacity * 12}px)` : 'none',
        '--navbar-shadow': `0 8px 24px rgba(15, 23, 42, ${navbarOpacity * 0.14})`,
        '--navbar-scroll-progress': navbarOpacity,
      } as CSSProperties}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-16 max-md:pt-[env(safe-area-inset-top)]">
          {/* Logo 和头像 */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href={NAV_ROUTES.about(locale)}
              prefetch={true}
              className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 max-md:border-gray-200 max-md:dark:border-gray-700 ${
                isScrolled
                  ? 'md:border-gray-200 md:dark:border-gray-700 hover:border-[var(--theme-primary-500)]'
                  : 'md:border-white/50 md:hover:border-white/80'
              }`}
            >
              {!avatarError && displayAvatar ? (
                needsProxy ? (
                  <img
                    src={imageSrc as string}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Image
                    src={imageSrc}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="40px"
                    priority
                    onError={() => setAvatarError(true)}
                  />
                )
              ) : (
                <Image
                  src={avatarImage}
                  alt="Avatar"
                  fill
                  className="object-cover"
                  sizes="40px"
                  priority
                />
              )}
            </Link>
            
            <Link href={NAV_ROUTES.home(locale)} className="group" prefetch={true}>
              <span className={`navbar-brand relative inline-grid text-lg tracking-wide sm:text-xl md:text-2xl ${zcoolKuaiLe.className}`}>
                <span className="navbar-brand-on-transparent col-start-1 row-start-1 text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.45)]">
                  {logoConfig.text}
                </span>
                <span className="navbar-brand-on-solid col-start-1 row-start-1 bg-gradient-to-r from-[var(--theme-primary-500)] to-[var(--theme-secondary)] bg-clip-text text-transparent">
                  {logoConfig.text}
                </span>
              </span>
            </Link>
          </div>

          {/* 桌面导航 */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              if (link.key === 'links') {
                return (
                  <NavbarDropdown
                    key={link.key}
                    label={link.label}
                    icon={link.icon}
                    items={linksMenuItems}
                    isScrolled={isScrolled}
                    isOpen={openMenu === 'links'}
                    onToggle={handleMenuToggle('links')}
                    onClose={handleMenuClose}
                  />
                )
              }
              if (link.key === 'my') {
                return (
                  <NavbarDropdown
                    key={link.key}
                    label={link.label}
                    icon={link.icon}
                    items={myMenuItems}
                    isScrolled={isScrolled}
                    isOpen={openMenu === 'my'}
                    onToggle={handleMenuToggle('my')}
                    onClose={handleMenuClose}
                  />
                )
              }
              if (link.key === 'about') {
                return (
                  <NavbarDropdown
                    key={link.key}
                    label={link.label}
                    icon={link.icon}
                    items={aboutMenuItems}
                    isScrolled={isScrolled}
                    isOpen={openMenu === 'about'}
                    onToggle={handleMenuToggle('about')}
                    onClose={handleMenuClose}
                  />
                )
              }
              if (link.key === 'others') {
                return (
                  <NavbarDropdown
                    key={link.key}
                    label={link.label}
                    icon={link.icon}
                    items={othersMenuItems}
                    isScrolled={isScrolled}
                    isOpen={openMenu === 'others'}
                    onToggle={handleMenuToggle('others')}
                    onClose={handleMenuClose}
                  />
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={(e) => {
                    // 已经在本页时 Next 不会导航，改为重播入场滚动动画
                    if (isCurrentLocation(link.href)) {
                      e.preventDefault()
                      replayHeroEntrance()
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                    isScrolled
                      ? 'text-gray-700 dark:text-gray-300 hover:bg-[var(--theme-primary-100)] dark:hover:bg-[var(--theme-primary-100)]'
                      : 'text-white hover:bg-white/20 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon icon={link.icon} className="h-5 w-5" style={{ color: 'var(--theme-primary-500)' }} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
            <span className="hidden sm:inline-flex">
              <SakuraToggle isScrolled={isScrolled} />
            </span>
            <span className="max-md:hidden">
              <ThemeColorPicker isScrolled={isScrolled} />
            </span>

            {/* 语言切换下拉菜单 */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleMenuToggle('language')}
                className={`touch-target p-2 rounded-lg transition-colors duration-200 max-md:text-gray-700 max-md:dark:text-gray-300 max-md:hover:bg-[var(--theme-primary-100)] max-md:dark:hover:bg-[var(--theme-primary-100)] ${
                  isScrolled
                    ? 'md:hover:bg-[var(--theme-primary-100)] md:dark:hover:bg-[var(--theme-primary-100)] md:text-gray-700 md:dark:text-gray-300'
                    : 'md:hover:bg-white/20 md:dark:hover:bg-white/10 md:text-white'
                }`}
                aria-label="Switch language"
                style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}
              >
                <span className="text-sm font-medium hidden sm:inline">
                  {locale === 'zh' ? '中文' : locale === 'en' ? 'EN' : locale === 'ja' ? '日本語' : '한국어'}
                </span>
                <Icon icon="mdi:translate" className="sm:hidden text-lg" aria-hidden />
              </button>
              {openMenu === 'language' && (
                <div className="absolute right-0 top-full mt-2 w-32 rounded-lg shadow-lg border backdrop-blur-lg z-50"
                  style={{
                    backgroundColor: isScrolled 
                      ? (theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)') 
                      : (theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(17, 24, 39, 0.95)'),
                    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="py-1">
                    {[
                      { code: 'zh', label: '中文' },
                      { code: 'en', label: 'English' },
                      { code: 'ja', label: '日本語' },
                      { code: 'ko', label: '한국어' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          switchLanguage(lang.code)
                          handleMenuClose()
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          locale === lang.code
                            ? 'bg-[var(--theme-primary-500)] text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-[var(--theme-primary-100)] dark:hover:bg-[var(--theme-primary-100)]'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 布局切换（平板及以上显示） */}
            <div className={`hidden md:block p-2 rounded-lg transition-colors duration-200 ${
              isScrolled
                ? 'hover:bg-[var(--theme-primary-100)] dark:hover:bg-[var(--theme-primary-100)]'
                : 'hover:bg-white/20 dark:hover:bg-white/10'
            }`}>
              <LayoutToggle isScrolled={isScrolled} />
            </div>

            {/* 手机端：搜索 */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden touch-target p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-[var(--theme-primary-100)] dark:hover:bg-[var(--theme-primary-100)] transition-colors"
              aria-label={t('search')}
            >
              <Icon icon="mdi:magnify" className="text-xl" />
            </button>

            {/* 手机端：樱花 / 布局 */}
            <div className="md:hidden flex items-center gap-0.5">
              <SakuraToggle isScrolled={true} />
              <div className="p-2 rounded-lg">
                <LayoutToggle isScrolled={true} />
              </div>
            </div>

            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className={`touch-target p-2 rounded-lg transition-colors duration-200 max-md:text-gray-700 max-md:dark:text-gray-300 max-md:hover:bg-[var(--theme-primary-100)] max-md:dark:hover:bg-[var(--theme-primary-100)] ${
                isScrolled
                  ? 'md:hover:bg-[var(--theme-primary-100)] md:dark:hover:bg-[var(--theme-primary-100)] md:text-gray-700 md:dark:text-gray-300'
                  : 'md:hover:bg-white/20 md:dark:hover:bg-white/10 md:text-white'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Icon icon="mdi:weather-night" className="text-xl" />
              ) : (
                <Icon icon="mdi:weather-sunny" className="text-xl" />
              )}
            </button>
          </div>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  )
}
