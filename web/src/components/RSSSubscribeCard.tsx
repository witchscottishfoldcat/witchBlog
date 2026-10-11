'use client'

import { SidebarCard } from '@/components/Sidebar'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

const RSS_URL = 'https://example.com/rss/feed'

export default function RSSSubscribeCard() {
  const t = useTranslations('sidebar')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RSS_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = RSS_URL
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        console.error('Failed to copy:', e)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <SidebarCard title={t('rssTitle')}>
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('rssDescription')}
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            readOnly
            value={RSS_URL}
            className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 font-mono"
            onClick={(e) => {
              e.currentTarget.select()
              handleCopy()
            }}
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs rounded-md transition-colors"
            style={{
              backgroundColor: copied
                ? 'var(--theme-primary-200)'
                : 'var(--theme-primary-100)',
              color: 'var(--theme-primary-600)',
            }}
            title={t('copyLink')}
          >
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      </div>
    </SidebarCard>
  )
}
