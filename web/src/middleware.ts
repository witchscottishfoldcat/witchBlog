import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

/**
 * 国际化中间件
 * 处理语言路由和重定向
 */
export default createMiddleware({
  // 支持的语言列表
  locales,
  // 默认语言
  defaultLocale,
  // 语言前缀策略：始终显示语言前缀
  localePrefix: 'always',
  // 语言检测策略：优先使用 URL 中的语言，然后使用 Accept-Language 头
  localeDetection: true,
  // 备用语言：如果检测到的语言不支持，使用默认语言
  alternateLinks: false,
});

/**
 * 中间件匹配配置
 * 排除 API 路由、Next.js 内部路由、静态文件等
 */
export const config = {
  matcher: [
    // 匹配所有路径，除了：
    // - api 路由
    // - _next 内部路由
    // - _vercel 内部路由
    // - 静态文件（包含 . 的文件，如 .ico, .png, .jpg 等）
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};


