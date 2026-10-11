'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Hero from './Hero'
import { HERO_ENTRANCE_REPLAY_EVENT } from '@/lib/hero-entrance'

const ENTER_DELAY_MS = 140
const ENTER_DURATION_MS = 1050
const MIN_ENTER_SCROLL_Y = 160
const FALLBACK_REVEAL_HEIGHT = 320
const NAVBAR_FADE_GAP = 32

export default function ArchiveHeroBanner() {
  const bannerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  // 点击当前导航项/翻页时只改查询串或根本没有导航，挂载不会重来，
  // 用递增的 key 让下面的两个 effect 重新执行一次动画。
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    const handleReplay = () => setReplayKey((key) => key + 1)
    window.addEventListener(HERO_ENTRANCE_REPLAY_EVENT, handleReplay)
    return () => window.removeEventListener(HERO_ENTRANCE_REPLAY_EVENT, handleReplay)
  }, [])

  useLayoutEffect(() => {
    let animationFrame = 0
    let animatedContent: HTMLElement | null = null

    const restartEntranceAnimation = (attempt = 0) => {
      const pageLayout = bannerRef.current?.parentElement?.nextElementSibling
      const candidate = pageLayout?.firstElementChild

      if (!(candidate instanceof HTMLElement)) {
        if (attempt < 4) {
          animationFrame = window.requestAnimationFrame(() => {
            restartEntranceAnimation(attempt + 1)
          })
        }
        return
      }

      animatedContent = candidate
      candidate.style.animation = 'none'
      void candidate.offsetHeight
      candidate.style.removeProperty('animation')
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restartEntranceAnimation()
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('pageshow', handlePageShow)
      animatedContent?.style.removeProperty('animation')
    }
  }, [pathname, replayKey])

  useEffect(() => {
    if (
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let animationFrame = 0
    let stopAnimation: (() => void) | undefined
    const scrollRoot = document.documentElement
    const previousScrollBehavior = scrollRoot.style.scrollBehavior
    const previousNavbarFadeStart = scrollRoot.style.getPropertyValue('--navbar-fade-start-y')
    const previousScrollRestoration = window.history.scrollRestoration

    // The entrance scroll already has its own easing. Let Hero follow it in the
    // same frame instead of applying a second smoothing pass that can jitter.
    scrollRoot.dataset.heroEntranceActive = 'true'

    // 刷新和新路由都从统一的动画起点开始，避免浏览器滚动恢复跳过动画。
    window.history.scrollRestoration = 'manual'
    scrollRoot.style.scrollBehavior = 'auto'
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.dispatchEvent(new CustomEvent<number>('hero-entrance-frame', { detail: 0 }))
    scrollRoot.style.scrollBehavior = previousScrollBehavior

    const maxScrollY = Math.max(0, scrollRoot.scrollHeight - window.innerHeight)
    const profileCard = document.querySelector<HTMLElement>('[data-hero-parallax-boundary]')
    const getDocumentTop = (element: HTMLElement) => {
      let top = 0
      let current: HTMLElement | null = element

      while (current) {
        top += current.offsetTop
        current = current.offsetParent as HTMLElement | null
      }

      return top
    }
    const revealBoundaryBottom = profileCard
      ? getDocumentTop(profileCard) + profileCard.offsetHeight
      : getDocumentTop(bannerRef.current as HTMLElement) +
        (bannerRef.current?.offsetHeight || 0) +
        FALLBACK_REVEAL_HEIGHT
    const revealProfileScrollY = revealBoundaryBottom - window.innerHeight
    const requestedTargetY = profileCard
      ? Math.max(0, revealProfileScrollY)
      : Math.max(MIN_ENTER_SCROLL_Y, revealProfileScrollY)
    const targetY = Math.min(requestedTargetY, maxScrollY)

    scrollRoot.style.setProperty('--navbar-fade-start-y', `${targetY + NAVBAR_FADE_GAP}px`)
    window.dispatchEvent(new Event('scroll'))

    const timer = window.setTimeout(() => {
      // 用户在等待动画期间已经主动滚动时，不再抢夺控制权。
      if (window.scrollY > 2) {
        delete scrollRoot.dataset.heroEntranceActive
        return
      }

      const startY = window.scrollY

      if (targetY <= startY) {
        delete scrollRoot.dataset.heroEntranceActive
        return
      }

      let active = true
      const startTime = performance.now()

      function removeInteractionListeners() {
        window.removeEventListener('wheel', stop)
        window.removeEventListener('touchstart', stop)
        window.removeEventListener('pointerdown', stop)
        window.removeEventListener('keydown', handleKeyDown)
      }

      function stop() {
        if (!active) return
        active = false
        if (animationFrame) window.cancelAnimationFrame(animationFrame)
        removeInteractionListeners()
        delete scrollRoot.dataset.heroEntranceActive
        scrollRoot.style.scrollBehavior = previousScrollBehavior
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
          stop()
        }
      }

      function animateScroll(currentTime: number) {
        if (!active) return

        const progress = Math.min((currentTime - startTime) / ENTER_DURATION_MS, 1)
        const easedProgress = (1 - Math.cos(Math.PI * progress)) / 2

        window.scrollTo({
          top: startY + (targetY - startY) * easedProgress,
          behavior: 'auto',
        })
        window.dispatchEvent(new CustomEvent<number>('hero-entrance-frame', {
          detail: window.scrollY,
        }))

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(animateScroll)
        } else {
          stop()
        }
      }

      scrollRoot.style.scrollBehavior = 'auto'
      stopAnimation = stop
      window.addEventListener('wheel', stop, { passive: true })
      window.addEventListener('touchstart', stop, { passive: true })
      window.addEventListener('pointerdown', stop, { passive: true })
      window.addEventListener('keydown', handleKeyDown)
      animationFrame = window.requestAnimationFrame(animateScroll)
    }, ENTER_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
      stopAnimation?.()
      delete scrollRoot.dataset.heroEntranceActive
      window.history.scrollRestoration = previousScrollRestoration
      if (previousNavbarFadeStart) {
        scrollRoot.style.setProperty('--navbar-fade-start-y', previousNavbarFadeStart)
      } else {
        scrollRoot.style.removeProperty('--navbar-fade-start-y')
      }
    }
  }, [pathname, replayKey])

  return (
    <div ref={bannerRef} className="archive-hero-banner relative z-10 w-full">
      <Hero />
    </div>
  )
}


