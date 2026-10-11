import { getRequestConfig } from 'next-intl/server';
import type { Messages } from './types/messages';
import { logger } from './lib/logger';

/**
 * 支持的语言列表
 */
export const locales = ['zh', 'en', 'ja', 'ko'] as const;
export type Locale = (typeof locales)[number];

/**
 * 默认语言
 */
export const defaultLocale: Locale = 'zh';

/**
 * 验证 locale 是否为有效值
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * 获取语言显示名称
 */
export function getLocaleDisplayName(locale: Locale): string {
  const displayNames: Record<Locale, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
  };
  return displayNames[locale];
}

/**
 * 获取所有语言的显示名称
 */
export function getAllLocaleDisplayNames(): Record<Locale, string> {
  return {
    zh: '中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
  };
}

/**
 * 加载消息文件
 */
async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    // 动态导入翻译文件，确保每次都加载最新的
    const messages = (await import(`./messages/${locale}.json`)).default;
    
    // 开发环境下验证消息结构
    if (process.env.NODE_ENV === 'development') {
      // 基本验证：确保消息对象存在
      if (!messages || typeof messages !== 'object') {
        logger.warn(`[i18n] Invalid messages structure for locale: ${locale}`);
      } else {
        logger.log(`[i18n] Successfully loaded messages for locale: ${locale}, keys: ${Object.keys(messages).join(', ')}`);
      }
    }
    
    return messages as Messages;
  } catch (error) {
    logger.error(`[i18n] Failed to load messages for locale: ${locale}`, error);
    throw error;
  }
}

/**
 * Next-intl 请求配置
 * 在服务器端为每个请求提供正确的语言和消息
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl 新版本可能传入 Promise，需先 resolve
  const rawLocale = typeof requestLocale === 'object' && requestLocale !== null && 'then' in requestLocale
    ? await (requestLocale as Promise<string | undefined>)
    : requestLocale;

  if (process.env.NODE_ENV === 'development') {
    logger.log(`[i18n] getRequestConfig received requestLocale: ${rawLocale ?? 'undefined'}`);
  }

  if (process.env.NODE_ENV === 'development' && (!rawLocale || !isValidLocale(rawLocale))) {
    logger.warn(`[i18n] Invalid requestLocale: ${rawLocale ?? 'undefined'}, falling back to ${defaultLocale}`);
  }

  if (!rawLocale || !isValidLocale(rawLocale)) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`[i18n] Using default locale: ${defaultLocale}`);
    }
    return {
      locale: defaultLocale,
      messages: await loadMessages(defaultLocale),
    };
  }

  const messages = await loadMessages(rawLocale);

  return {
    locale: rawLocale,
    messages,
    // 可选：设置时区
    timeZone: 'Asia/Shanghai',
  };
});


