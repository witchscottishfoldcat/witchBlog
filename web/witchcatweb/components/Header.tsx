'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Search, Globe, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    window.location.href = `/${newLocale}`;
  };

  const navItems = [
    { key: 'home', href: `/${locale}` },
    { key: 'archive', href: `/${locale}/archive` },
    { key: 'links', href: `/${locale}/links` },
    { key: 'my', href: `/${locale}/my` },
    { key: 'about', href: `/${locale}/about` },
    { key: 'others', href: `/${locale}/others` },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-black/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500"></div>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            MizukiUI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleLanguage}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle Language"
          >
            <Globe className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-white dark:bg-black md:hidden">
          <div className="flex flex-col gap-2 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="py-2 text-sm font-medium text-gray-700 transition-colors hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400"
                onClick={() => setIsMenuOpen(false)}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}




