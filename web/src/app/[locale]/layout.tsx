import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale, isValidLocale } from '@/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { MusicProvider } from '@/contexts/MusicContext';
import Footer from '@/components/Footer';
import FloatingCalendar from '@/components/FloatingCalendar';
import SakuraFallsWrapper from '@/components/SakuraFallsWrapper';
import GlobalMusicPlayer from '@/components/GlobalMusicPlayer';
import MobileBottomNav from '@/components/MobileBottomNav';
import type { Messages } from '@/types/messages';
import { logger } from '@/lib/logger';

/**
 * 允许动态参数，支持所有配置的语言
 * 在开发模式下允许动态生成路由
 */
export const dynamicParams = true;

/**
 * 生成静态参数，为所有支持的语言生成路由
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * 加载消息文件
 */
async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[Layout] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    if (locale !== 'zh') {
      return (await import(`../../messages/zh.json`)).default as Messages;
    }
    throw error;
  }
}

/**
 * 语言布局组件
 * 为每个语言路由提供正确的国际化上下文
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 验证 locale 是否有效
  if (!isValidLocale(locale)) {
    notFound();
  }

  // 使用流式加载消息文件，不阻塞渲染
  // 这样可以提高首屏加载性能
  // 在开发环境下记录加载的语言
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[Layout] Loading messages for locale: ${locale}`);
  }
  const messages = await loadMessages(locale);

  return (
    <ThemeProvider>
      <LayoutProvider>
        <MusicProvider>
          <NextIntlClientProvider
            messages={messages}
            locale={locale}
            timeZone="Asia/Shanghai"
          >
            <div className="flex min-h-screen flex-col pb-safe">
              <SakuraFallsWrapper petalCount={25} />
              <main className="mobile-main flex-1 relative z-10 min-w-0 overflow-x-clip pt-[calc(3rem+env(safe-area-inset-top,0px))] sm:pt-0 pb-16 sm:pb-0">
                {children}
              </main>
              <Footer />
              <FloatingCalendar />
              <MobileBottomNav />
            </div>
          </NextIntlClientProvider>
          <GlobalMusicPlayer />
        </MusicProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}

