/**
 * 看板娘入场滚动动画的重播机制
 *
 * ArchiveHeroBanner 在挂载/切换路由时会“回到顶部再向下滑出内容”。
 * 点击当前页面的导航项（Next 不会导航）和翻页（只改查询串，路径不变）都不会
 * 触发挂载，所以这里用自定义事件让页面主动重播这段动画。
 */

/** ArchiveHeroBanner 监听的入场动画重播事件名 */
export const HERO_ENTRANCE_REPLAY_EVENT = 'hero-entrance-replay'

/** 重播当前页面的入场滚动动画 */
export function replayHeroEntrance(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(HERO_ENTRANCE_REPLAY_EVENT))
}

/** 链接是否就是当前地址（路径与查询串都相同，即点击后不会发生导航） */
export function isCurrentLocation(href: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const target = new URL(href, window.location.origin)
    return (
      target.pathname === window.location.pathname && target.search === window.location.search
    )
  } catch {
    return false
  }
}
