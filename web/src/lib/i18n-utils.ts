/**
 * i18n 工具函数
 * 提供便捷的国际化辅助方法
 */

import type { Locale } from '@/i18n';
import { getLocaleDisplayName, getAllLocaleDisplayNames } from '@/i18n';

/**
 * 格式化带参数的翻译文本
 * 例如：formatTranslation('Hello {name}', { name: 'World' }) => 'Hello World'
 */
export function formatTranslation(
  template: string,
  values: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() ?? match;
  });
}

/**
 * 获取语言的本地化名称
 */
export function getLocalizedLocaleName(locale: Locale, targetLocale: Locale = 'zh'): string {
  const names: Record<Locale, Record<Locale, string>> = {
    zh: {
      zh: '中文',
      en: '英语',
      ja: '日语',
      ko: '韩语',
    },
    en: {
      zh: 'Chinese',
      en: 'English',
      ja: 'Japanese',
      ko: 'Korean',
    },
    ja: {
      zh: '中国語',
      en: '英語',
      ja: '日本語',
      ko: '韓国語',
    },
    ko: {
      zh: '중국어',
      en: '영어',
      ja: '일본어',
      ko: '한국어',
    },
  };
  return names[targetLocale]?.[locale] ?? getLocaleDisplayName(locale);
}

/**
 * 切换语言
 * 生成新的 URL 路径，替换当前路径中的语言部分
 */
export function switchLocale(pathname: string, currentLocale: Locale, targetLocale: Locale): string {
  // 移除开头的斜杠
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  
  // 如果路径以当前语言开头，替换它
  if (path.startsWith(`${currentLocale}/`)) {
    return `/${targetLocale}/${path.slice(currentLocale.length + 1)}`;
  }
  
  // 如果路径就是当前语言，直接替换
  if (path === currentLocale) {
    return `/${targetLocale}`;
  }
  
  // 否则在路径前添加目标语言
  return `/${targetLocale}/${path}`;
}

/**
 * 从路径中提取语言
 */
export function extractLocaleFromPath(pathname: string): Locale | null {
  const match = pathname.match(/^\/(zh|en)(\/|$)/);
  return (match?.[1] as Locale) ?? null;
}

/**
 * 获取所有可用语言的配置
 */
export function getAvailableLocales() {
  const displayNames = getAllLocaleDisplayNames();
  return Object.entries(displayNames).map(([code, name]) => ({
    code: code as Locale,
    name,
  }));
}

/**
 * 检测浏览器首选语言
 */
/**
 * 从嵌套消息对象中解析点分路径的字符串值
 */
export function resolveNestedMessage(messages: object, key: string): string {
  const keys = key.split('.')
  let value: unknown = messages
  for (const k of keys) {
    value = (value as Record<string, unknown> | undefined)?.[k]
  }
  return typeof value === 'string' ? value : key
}

export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  const browserLang =
    navigator.language ||
    (navigator as Navigator & { userLanguage?: string }).userLanguage ||
    'en';
  
  // 检查是否支持中文
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  
  // 默认返回英语
  return 'en';
}

