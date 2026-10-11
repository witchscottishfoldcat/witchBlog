'use client'

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { useLocale } from 'next-intl'
import NextImage from 'next/image'
import WaveAnimation from './WaveAnimation'
import TypewriterText from './TypewriterText'
import { bannerConfig } from '@/config/assets'
import { useTheme } from './ThemeProvider'

interface CarouselItem {
  id: number
  title: string
  subtitle: string
  image: string
  gradient: string
}

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const parallaxLayerRef = useRef<HTMLDivElement>(null) // 追焦视差层（滚动时让画面中心跟随视口中心）
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null) // 正在淡出的旧图
  const isPausedRef = useRef(false) // 页面后台或触摸滑动时暂停自动轮播
  const isScrollingRef = useRef(false) // 滚动页面时只暂停轮播切图，Ken Burns 缩放保持连续
  const lastSwitchAtRef = useRef(Date.now()) // 上次切换时间戳，控制自动轮播间隔
  const goToNextRef = useRef<() => void>(() => {}) // 最新切换函数引用（供触摸监听使用）
  const goToPreviousRef = useRef<() => void>(() => {})
  const switchToIndexRef = useRef<(index: number) => Promise<void>>(async () => {})
  const isSwitchingRef = useRef(false)
  const isDisplaySyncingRef = useRef(false)
  const preparedSlideIndexRef = useRef<number | null>(null)
  const imagePreloadPromisesRef = useRef(new Map<string, Promise<boolean>>())
  const slideImageRefs = useRef(new Map<number, HTMLImageElement>())
  const slideWarmPromisesRef = useRef(new WeakMap<HTMLImageElement, Promise<boolean>>())
  const desktopIndexRef = useRef(0) // 桌面端轮播进度（与移动端独立）
  const mobileIndexRef = useRef(0) // 移动端轮播进度（与桌面端独立）
  const isMobileRef = useRef(false) // 同步 isMobile，供 interval/触摸闭包读取
  const [canPreloadNextSlide, setCanPreloadNextSlide] = useState(false)
  const [preparedSlideIndex, setPreparedSlideIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [renderMobile, setRenderMobile] = useState(false)
  const [renderTheme, setRenderTheme] = useState<'light' | 'dark'>('light')
  const [isInitialDisplayReady, setIsInitialDisplayReady] = useState(false)
  // 水合安全：挂载前一律按亮色主题渲染（与 SSR 一致），挂载后再切换到真实主题，
  // 避免 ThemeProvider 客户端初始化读到暗色导致轮播图 src 水合不匹配
  const [isMounted, setIsMounted] = useState(false)
  const locale = useLocale()
  const { theme } = useTheme()

  // 独立于可见 DOM 的预加载器。只有浏览器确认图片已下载并解码后，轮播才会切过去。
  const preloadImage = useCallback((src: string, priority: 'high' | 'low' = 'low') => {
    if (typeof window === 'undefined') return Promise.resolve(false)

    const cached = imagePreloadPromisesRef.current.get(src)
    if (cached) return cached

    const promise = new Promise<boolean>((resolve) => {
      const image = new window.Image()
      let settled = false

      const finish = (loaded: boolean) => {
        if (settled) return
        settled = true
        resolve(loaded)
      }

      image.decoding = 'async'
      image.setAttribute('fetchpriority', priority)
      image.onload = () => {
        const decoded = typeof image.decode === 'function'
          ? image.decode().catch(() => undefined)
          : Promise.resolve()
        void decoded.then(() => finish(image.naturalWidth > 0))
      }
      image.onerror = () => finish(false)
      image.src = src
    })

    imagePreloadPromisesRef.current.set(src, promise)
    void promise.then((loaded) => {
      if (!loaded) imagePreloadPromisesRef.current.delete(src)
    })
    return promise
  }, [])

  // 预加载器完成后，仍需让真正参与淡化的 <img> 完成解码并进入一次绘制。
  // 否则 visibility 从 hidden 切到 visible 时才上传大纹理，容易在切换瞬间掉帧。
  const warmMountedSlide = useCallback(async (index: number) => {
    if (typeof window === 'undefined') return false

    for (let attempt = 0; attempt < 4; attempt++) {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
      const image = slideImageRefs.current.get(index)
      if (!image) continue

      const cachedWarmup = slideWarmPromisesRef.current.get(image)
      if (cachedWarmup) return cachedWarmup

      const warmup = (async () => {
        if (typeof image.decode === 'function') {
          await image.decode().catch(() => undefined)
        }

        // 解码完成后再留一帧给浏览器建立合成纹理，随后才开始交叉淡化。
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
        return image.complete && image.naturalWidth > 0
      })()

      slideWarmPromisesRef.current.set(image, warmup)
      return warmup
    }

    return false
  }, [])


  // 挂载标记（水合完成后启用真实主题图片）
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 检测移动端
  useEffect(() => {
    // SSR 安全检查
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768
      setIsMobile(isMobileNow)
      isMobileRef.current = isMobileNow
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('resize', checkMobile)
        }
      } catch {
        // 静默处理清理错误
      }
    }
  }, [])

  // 根据设备类型和主题选择图片并构建轮播项（使用 useMemo 优化性能）
  const carouselItems: CarouselItem[] = useMemo(() => {
    const deviceImages = renderMobile ? bannerConfig.mobile : bannerConfig.desktop
    const images = renderTheme === 'dark' ? deviceImages.dark : deviceImages.light
    return bannerConfig.items.map((item, index) => {
      // 支持所有语言：zh, en, ja, ko，回退到 en
      const title = item.title[locale as 'zh' | 'en' | 'ja' | 'ko'] || item.title.en
      const subtitle = item.subtitle[locale as 'zh' | 'en' | 'ja' | 'ko'] || item.subtitle.en
      return {
        id: item.id,
        title,
        subtitle,
        image: images[index % images.length],
        gradient: item.gradient,
      }
    })
  }, [renderMobile, locale, renderTheme])

  // 当前幻灯片对应的文案（每张图各自的标题/副标题，随轮播切换）
  const currentItem = carouselItems[currentIndex] ?? carouselItems[0]
  const overlayTitle = currentItem?.title ?? ''
  const overlaySubtitle = currentItem?.subtitle ?? ''

  // 追焦视差：滚动时平移加高的轮播层，让画面中心始终对准视口可见中心
  // （纯 JS 直接写 transform，不触发 React 重渲染；移动端与减弱动态偏好时禁用）
  // 注意：滚动事件直接应用位移，不叠加 rAF 平滑（页面 scroll-behavior: smooth，
  // 双重平滑会导致快速滚动时拖尾/卡帧）
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return

    const heroElement = heroRef.current
    const parallaxLayer = parallaxLayerRef.current
    if (!heroElement || !parallaxLayer) return

    let animationFrame = 0
    let currentOffset = 0
    let targetOffset = 0
    let lastFrameTime = 0
    let heroTop = 0
    let heroHeight = 0
    let boundaryEnd = Number.POSITIVE_INFINITY

    const getDocumentTop = (element: HTMLElement) => {
      let top = 0
      let current: HTMLElement | null = element

      while (current) {
        top += current.offsetTop
        current = current.offsetParent as HTMLElement | null
      }

      return top
    }

    const updateMetrics = () => {
      heroTop = getDocumentTop(heroElement)
      heroHeight = heroElement.offsetHeight
      const boundary = document.querySelector<HTMLElement>('[data-hero-parallax-boundary]')
      boundaryEnd = boundary
        ? getDocumentTop(boundary) + boundary.offsetHeight
        : Number.POSITIVE_INFINITY
    }

    const applyParallaxTransform = (offset: number) => {
      const pixelRatio = window.devicePixelRatio || 1
      const renderedOffset = Math.round(offset * pixelRatio) / pixelRatio
      parallaxLayer.style.transform = `translate3d(0, ${renderedOffset}px, 0)`
    }

    const renderParallax = (currentTime: number) => {
      const elapsed = lastFrameTime ? Math.min(currentTime - lastFrameTime, 40) : 16.67
      lastFrameTime = currentTime
      const smoothing = 1 - Math.exp(-elapsed / 62)
      currentOffset += (targetOffset - currentOffset) * smoothing

      if (Math.abs(targetOffset - currentOffset) < 0.08) {
        currentOffset = targetOffset
      }

      applyParallaxTransform(currentOffset)

      if (currentOffset !== targetOffset) {
        animationFrame = window.requestAnimationFrame(renderParallax)
      } else {
        animationFrame = 0
        lastFrameTime = 0
      }
    }

    const scheduleRender = () => {
      if (!animationFrame) {
        lastFrameTime = performance.now()
        animationFrame = window.requestAnimationFrame(renderParallax)
      }
    }

    const applyEntranceTransform = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }
      currentOffset = targetOffset
      lastFrameTime = 0
      applyParallaxTransform(currentOffset)
    }

    const updateParallaxTarget = (scrollY = window.scrollY, immediate = false) => {
      const heroViewportTop = heroTop - scrollY
      const heroViewportBottom = heroViewportTop + heroHeight

      if (
        scrollY >= boundaryEnd ||
        heroViewportBottom <= 0 ||
        heroViewportTop >= window.innerHeight
      ) {
        targetOffset = 0
        if (immediate) applyEntranceTransform()
        else scheduleRender()
        return
      }

      const visibleTop = Math.max(heroViewportTop, 0)
      const visibleBottom = Math.min(heroViewportBottom, window.innerHeight)
      const visibleCenter = (visibleTop + visibleBottom) / 2
      const heroCenter = heroViewportTop + heroHeight / 2
      targetOffset = visibleCenter - heroCenter

      if (immediate) applyEntranceTransform()
      else scheduleRender()
    }

    let pendingScrollY: number | null = null
    let scrollFrame = 0

    const handleScroll = () => {
      if (document.documentElement.dataset.heroEntranceActive === 'true') return
      // rAF 节流：滚动事件可能比显示帧率密集（高速滚轮/触摸板），每帧最多应用一次
      // transform，同帧内多次事件合并取最新值；不插值平滑（直接应用），画面与滚动同步无拖尾
      pendingScrollY = window.scrollY
      if (scrollFrame) return
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0
        if (pendingScrollY !== null) {
          const y = pendingScrollY
          pendingScrollY = null
          updateParallaxTarget(y, true)
        }
      })
    }

    const handleEntranceFrame = (event: Event) => {
      const entranceScrollY = event instanceof CustomEvent && typeof event.detail === 'number'
        ? event.detail
        : window.scrollY
      updateParallaxTarget(entranceScrollY, true)
    }

    const handleResize = () => {
      updateMetrics()
      updateParallaxTarget(
        window.scrollY,
        document.documentElement.dataset.heroEntranceActive === 'true'
      )
    }

    updateMetrics()
    updateParallaxTarget(
      window.scrollY,
      document.documentElement.dataset.heroEntranceActive === 'true'
    )
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('hero-entrance-frame', handleEntranceFrame)
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hero-entrance-frame', handleEntranceFrame)
      window.removeEventListener('resize', handleResize)
      parallaxLayer.style.removeProperty('transform')
    }
  }, [])

  // 轮播（Mizuki 式 Ken Burns + Crossfade）：每张图独立 Ken Burns 动画
  // （CSS 类 hero-ken-burns，6000ms linear = 切换间隔 4500ms + 淡化 1500ms，
  //  旧图淡出全程持续放大不封顶、画面永不静止），动画时长略大于切换间隔，切换永不打断动画；
  // 自动轮播
  useEffect(() => {
    if (!bannerConfig.enabled) return

    const SWITCH_INTERVAL = 4500 // 距上次切换（含手动/触摸）至少间隔（毫秒）

    // 定时检查（200ms 粒度，切换更准时）：距上次切换满 4.5 秒且未暂停（页面后台/触摸）才自动切换，
    // 手动/触摸切换后计时自然重置，不会立即再切
    const switchTimer = window.setInterval(() => {
      if (
        isPausedRef.current ||
        isScrollingRef.current ||
        isSwitchingRef.current ||
        isDisplaySyncingRef.current
      ) return
      if (Date.now() - lastSwitchAtRef.current < SWITCH_INTERVAL) return
      // 使用当前设备自己的轮播进度（桌面/移动端独立轮播）
      const deviceRef = isMobileRef.current ? mobileIndexRef : desktopIndexRef
      const next = (deviceRef.current + 1) % carouselItems.length
      void switchToIndexRef.current(next)
    }, 200)

    return () => {
      window.clearInterval(switchTimer)
    }
  }, [carouselItems.length])

  // 滚动页面时暂停轮播：滚动期间停止切换（避免与视差平移叠加造成卡帧），滚动停止 1s 后恢复
  useEffect(() => {
    if (typeof window === 'undefined') return
    let scrollTimer = 0
    const onScroll = () => {
      isScrollingRef.current = true
      // 标记滚动中：提升视差层合成优先级；仅暂停轮播切图，不暂停 Ken Burns 缩放。
      document.documentElement.setAttribute('data-hero-scrolling', 'true')
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        isScrollingRef.current = false
        document.documentElement.removeAttribute('data-hero-scrolling')
      }, 1000)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(scrollTimer)
      document.documentElement.removeAttribute('data-hero-scrolling')
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  // 页面后台（切标签页/最小化）暂停轮播，回到前台按原节奏继续（Mizuki 同款）
  useEffect(() => {
    if (typeof document === 'undefined') return
    let hiddenAt = 0
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        isPausedRef.current = true
      } else if (hiddenAt) {
        isPausedRef.current = false
        // 后台期间不计入切换间隔，保持剩余时间语义
        lastSwitchAtRef.current += Date.now() - hiddenAt
        hiddenAt = 0
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])


  // 触摸左右滑动切换（Mizuki 同款：横向滑动超过 50px 切换，滑动期间暂停自动轮播）
  useEffect(() => {
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return
    const hero = heroRef.current
    if (!hero) return

    let touchStartX = 0
    let touchStartY = 0
    let isSwiping = false

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      isSwiping = false
      isPausedRef.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return
      const diffX = Math.abs(e.touches[0].clientX - touchStartX)
      const diffY = Math.abs(e.touches[0].clientY - touchStartY)
      if (diffX > diffY && diffX > 30) {
        isSwiping = true
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX && touchStartY && isSwiping) {
        const diffX = touchStartX - e.changedTouches[0].clientX
        if (Math.abs(diffX) > 50) {
          if (diffX > 0) goToNextRef.current()
          else goToPreviousRef.current()
        }
      }
      touchStartX = 0
      touchStartY = 0
      isSwiping = false
      isPausedRef.current = false
    }

    hero.addEventListener('touchstart', onTouchStart, { passive: true })
    hero.addEventListener('touchmove', onTouchMove, { passive: false })
    hero.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      hero.removeEventListener('touchstart', onTouchStart)
      hero.removeEventListener('touchmove', onTouchMove)
      hero.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // 随机首图、设备和主题切换都先在后台解码目标图片，再一次性更新可见内容。
  // 这样保留原来的随机/主题行为，同时避免 SSR 首图被未完成的 lazy 图片替换。
  useEffect(() => {
    if (!isMounted) return

    const count = bannerConfig.items.length
    const deviceRef = isMobile ? mobileIndexRef : desktopIndexRef
    const index = deviceRef.current % count

    // SSR 首屏已经按桌面亮色首图渲染，避免挂载后对同一张图重复创建预加载器并再次解码。
    if (renderMobile === isMobile && renderTheme === theme) {
      isDisplaySyncingRef.current = false
      setIsInitialDisplayReady(true)
      return
    }

    const deviceImages = isMobile ? bannerConfig.mobile : bannerConfig.desktop
    const images = theme === 'dark' ? deviceImages.dark : deviceImages.light
    const image = images[index % images.length]
    let cancelled = false

    isDisplaySyncingRef.current = true
    void preloadImage(image, 'high').then((loaded) => {
      if (cancelled) return
      if (!loaded) {
        // 资源异常时解除首屏遮挡，允许现有主题图片作为降级内容显示。
        setIsInitialDisplayReady(true)
        return
      }
      setRenderMobile(isMobile)
      setRenderTheme(theme)
      preparedSlideIndexRef.current = null
      setPreparedSlideIndex(null)
      setPreviousIndex(null)
      setCurrentIndex(index)
      setIsInitialDisplayReady(true)
      lastSwitchAtRef.current = Date.now()
    }).finally(() => {
      if (!cancelled) isDisplaySyncingRef.current = false
    })

    return () => {
      cancelled = true
    }
  }, [isMounted, isMobile, preloadImage, renderMobile, renderTheme, theme])

  useEffect(() => {
    // 首屏入场结束后再解码下一张，避免图片解码与入场动画争抢主线程。
    const timer = window.setTimeout(() => setCanPreloadNextSlide(true), 1800)
    return () => window.clearTimeout(timer)
  }, [])

  // 交叉淡化（1500ms 重叠溶解）完成后清除旧图引用，避免残留在 DOM 中
  useEffect(() => {
    if (previousIndex === null) return
    const timer = window.setTimeout(() => setPreviousIndex(null), 1600)
    return () => window.clearTimeout(timer)
  }, [previousIndex])

  const renderedSlideIndexes = useMemo(() => {
    const indexes = new Set<number>([currentIndex])

    // 正在交叉淡化退场的旧图必须保留在 DOM 中
    if (previousIndex !== null) indexes.add(previousIndex)
    // 下一张完成后台解码后先以 opacity: 0 挂载，给交叉淡化保留过渡起点。
    if (preparedSlideIndex !== null) indexes.add(preparedSlideIndex)

    return indexes
  }, [currentIndex, preparedSlideIndex, previousIndex])

  // 入场完成后先后台解码下一张，完成后才以隐藏状态挂载，避免解码阻塞首屏动画。
  useEffect(() => {
    if (!canPreloadNextSlide || previousIndex !== null || carouselItems.length <= 1) return
    const count = carouselItems.length
    const next = (currentIndex + 1) % count
    let cancelled = false

    // 直接挂载真正参与淡化的 NextImage，让网络加载、解码和纹理预热只发生一次。
    // 该节点保持 visible + opacity: 0，浏览器可以在切换前完成绘制准备。
    window.requestAnimationFrame(() => {
      if (cancelled) return
      preparedSlideIndexRef.current = next
      setPreparedSlideIndex(next)
    })

    return () => {
      cancelled = true
    }
  }, [canPreloadNextSlide, carouselItems, currentIndex, previousIndex])

  useEffect(() => {
    if (preparedSlideIndex === null) return
    void warmMountedSlide(preparedSlideIndex)
  }, [preparedSlideIndex, warmMountedSlide])

  const switchToIndex = useCallback(async (next: number) => {
    if (isSwitchingRef.current || carouselItems.length <= 1) return

    const deviceRef = isMobileRef.current ? mobileIndexRef : desktopIndexRef
    const prev = deviceRef.current
    if (next === prev) return

    const target = carouselItems[next]
    if (!target) return

    isSwitchingRef.current = true

    try {
      // 等待期间若发生设备切换或其他状态提交，丢弃过期的切换请求。
      const latestDeviceRef = isMobileRef.current ? mobileIndexRef : desktopIndexRef
      if (latestDeviceRef !== deviceRef || deviceRef.current !== prev) return

      // 手动向后切换等目标未预挂载的情况：先隐藏挂载一帧，再开始双图淡化。
      if (preparedSlideIndexRef.current !== next) {
        preparedSlideIndexRef.current = next
        setPreparedSlideIndex(next)
      }

      const mountedImageReady = await warmMountedSlide(next)
      const latestRefAfterMount = isMobileRef.current ? mobileIndexRef : desktopIndexRef
      if (!mountedImageReady || latestRefAfterMount !== deviceRef || deviceRef.current !== prev) return

      deviceRef.current = next
      setPreviousIndex(prev)
      setCurrentIndex(next)
      preparedSlideIndexRef.current = null
      setPreparedSlideIndex(null)
      lastSwitchAtRef.current = Date.now()
    } finally {
      isSwitchingRef.current = false
    }
  }, [carouselItems, warmMountedSlide])

  const goToPrevious = useCallback(() => {
    const deviceRef = isMobileRef.current ? mobileIndexRef : desktopIndexRef
    const next = (deviceRef.current - 1 + carouselItems.length) % carouselItems.length
    void switchToIndex(next)
  }, [carouselItems.length, switchToIndex])

  const goToNext = useCallback(() => {
    const deviceRef = isMobileRef.current ? mobileIndexRef : desktopIndexRef
    const next = (deviceRef.current + 1) % carouselItems.length
    void switchToIndex(next)
  }, [carouselItems.length, switchToIndex])

  // 将最新切换函数同步到 ref，供原生触摸监听调用（避免闭包过期）
  useEffect(() => {
    goToNextRef.current = goToNext
    goToPreviousRef.current = goToPrevious
    switchToIndexRef.current = switchToIndex
  }, [goToNext, goToPrevious, switchToIndex])

  return (
    <div 
      ref={heroRef} 
      className="relative w-full h-[min(420px,55vh)] sm:h-[480px] md:h-[clamp(760px,82vh,900px)] overflow-hidden bg-slate-100 dark:bg-slate-950"
    >
      {/* Carousel Container（加高 1/2 的追焦视差层，滚动时平移保持画面中心居中） */}
      <div
        ref={parallaxLayerRef}
        data-render-theme={renderTheme}
        data-initial-display-ready={isInitialDisplayReady ? 'true' : 'false'}
        className="hero-carousel hero-parallax-layer absolute inset-x-0 -top-1/4 -bottom-1/4"
      >
        {carouselItems.map((item, index) => renderedSlideIndexes.has(index) && (
          <div
            key={item.id}
            aria-hidden={index !== currentIndex}
            className={`absolute inset-0 ${
              index === currentIndex
                ? 'visible opacity-100 z-10'
                : index === previousIndex
                  ? 'visible opacity-0 z-0'
                  : index === preparedSlideIndex
                    ? 'visible opacity-0 z-0 pointer-events-none'
                    : 'invisible opacity-0 z-0'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className={`absolute inset-0 ${
              index === currentIndex || index === previousIndex ? 'hero-ken-burns' : ''
            }`}>
              <NextImage
                ref={(image) => {
                  if (image) slideImageRefs.current.set(index, image)
                  else slideImageRefs.current.delete(index)
                }}
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                priority={index === 0}
                loading={index === 0 ? undefined : 'eager'}
                fetchPriority={index === currentIndex ? 'high' : 'low'}
                unoptimized
                sizes="100vw"
              />
            </div>

          </div>
        ))}

        {/* Banner 文字（随轮播切换到当前图的标题/副标题，fadeInUp 入场 + 打字机副标题；
            位于视差层内，追焦时与画面一起平移） */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div key={currentIndex} className="w-4/5 lg:w-3/4 text-center">
            <h1 className="banner-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 lg:mb-4">
              {overlayTitle}
            </h1>
            <p className="banner-subtitle text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90">
              <TypewriterText text={overlaySubtitle} />
            </p>
          </div>
        </div>
      </div>

      {/* Wave Animation */}
      <WaveAnimation />

    </div>
  )
}

export default memo(Hero)


