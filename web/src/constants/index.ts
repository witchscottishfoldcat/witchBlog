/**
 * 项目常量定义
 * 集中管理所有魔法数字和字符串
 */

/**
 * 分页相关常量
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DIARY_PAGE_SIZE: 4,
} as const

/**
 * 缓存时间常量（秒）
 */
export const CACHE = {
  SITE_CONFIG: 60, // 站点配置缓存 60 秒
  POSTS: 300, // 文章列表缓存 5 分钟
  STATS: 600, // 统计数据缓存 10 分钟
} as const

/**
 * 默认值常量
 */
export const DEFAULT_VALUES = {
  SITE_NAME: 'WitchCat',
  PLACEHOLDER_IMAGE: '/sakura.png',
  DEFAULT_AVATAR: '/assets/images/avatar.webp',
} as const

/**
 * API 相关常量
 */
export const API = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1000,
  DEFAULT_SKIP: 0,
} as const

/**
 * 图片相关常量
 */
export const IMAGE = {
  DEFAULT_COVER: '/sakura.png',
  MAX_WIDTH: 1920,
  THUMBNAIL_WIDTH: 400,
  QUALITY: 85,
} as const

/**
 * 动画相关常量
 */
export const ANIMATION = {
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,
} as const

/**
 * UI 相关常量
 */
export const UI = {
  SIDEBAR_WIDTH: 320, // 侧边栏宽度（px）
  NAVBAR_HEIGHT: 64, // 导航栏高度（px）
  CARD_BORDER_RADIUS: 32, // 卡片圆角（px）
} as const

/**
 * 导航/侧栏统一路由路径（与左侧边栏组件里的链接一致）
 */
export const NAV_ROUTES = {
  home: (locale: string) => `/${locale}`,
  archive: (locale: string) => `/${locale}/archive`,
  posts: (locale: string) => `/${locale}/posts`,
  post: (locale: string, slug: string) => `/${locale}/posts/${slug}`,
  friendLinks: (locale: string) => `/${locale}/friend-links`,
  support: (locale: string) => `/${locale}/support`,
  music: (locale: string) => `/${locale}/music`,
  games: (locale: string) => `/${locale}/games`,
  about: (locale: string) => `/${locale}/about`,
  my: (locale: string) => `/${locale}/my`,
  myDiary: (locale: string) => `/${locale}/my/diary`,
  myGallery: (locale: string) => `/${locale}/my/gallery`,
  dashboard: (locale: string) => `/${locale}/dashboard`,
  others: (locale: string) => `/${locale}/others`,
  projects: (locale: string) => `/${locale}/projects`,
  skills: (locale: string) => `/${locale}/skills`,
  timeline: (locale: string) => `/${locale}/timeline`,
} as const

