'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Hero() {
  const t = useTranslations('blog');

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 dark:from-pink-900 dark:via-purple-900 dark:to-blue-900">
      <div className="relative flex h-[400px] items-center justify-center px-8">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl"></div>
          <div className="absolute right-20 bottom-20 h-40 w-40 rounded-full bg-pink-300/30 blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white drop-shadow-lg md:text-6xl">
            {t('title')}
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md md:text-2xl">
            {t('subtitle')}
          </p>
        </div>

        {/* Avatar */}
        <div className="absolute bottom-0 left-8 translate-y-1/2">
          <div className="h-20 w-20 rounded-full border-4 border-white bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg dark:border-gray-800"></div>
        </div>
      </div>
    </div>
  );
}
