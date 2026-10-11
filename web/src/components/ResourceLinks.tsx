import { ResourceLink } from '@/lib/api'
import { getActiveResourceLinks } from '@/lib/resource-links-cache'
import { Icon } from '@iconify/react'
import { getTranslations } from 'next-intl/server'

interface ResourceLinksProps {
  locale: string
  limit?: number
}

/**
 * 资源链接组件
 * 从 API 获取资源链接列表并显示
 */
export default async function ResourceLinks({ locale, limit = 10 }: ResourceLinksProps) {
  const t = await getTranslations('components')
  // 获取资源链接列表
  const resourceLinks = await getActiveResourceLinks(limit)

  // 分类图标映射
  const categoryIconMap: Record<ResourceLink['category'], string> = {
    bilibili: 'mdi:bilibili',
    douyin: 'mdi:video',
    weibo: 'mdi:weibo',
    zhihu: 'mdi:zhihu',
    github: 'mdi:github',
    personal: 'mdi:link-variant',
    other: 'mdi:link',
  }

  // 分类标签映射
  const categoryLabelMap: Record<ResourceLink['category'], { zh: string; en: string }> = {
    bilibili: { zh: 'B站', en: 'Bilibili' },
    douyin: { zh: '抖音', en: 'Douyin' },
    weibo: { zh: '微博', en: 'Weibo' },
    zhihu: { zh: '知乎', en: 'Zhihu' },
    github: { zh: 'GitHub', en: 'GitHub' },
    personal: { zh: '个人', en: 'Personal' },
    other: { zh: '其他', en: 'Other' },
  }

  if (resourceLinks.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('noResourceLinks')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {resourceLinks.map((link) => {
        const icon = categoryIconMap[link.category] || 'mdi:link'
        const categoryLabel = categoryLabelMap[link.category]?.[locale as 'zh' | 'en'] || link.category

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all hover:shadow-md sidebar-item-theme"
            title={link.description || link.title}
          >
            <div className="flex-shrink-0">
              <Icon
                icon={icon}
                className="text-xl"
                style={{ color: 'var(--theme-primary-500)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {link.title}
              </div>
              {link.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {link.description}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: 'var(--theme-primary-100)',
                  color: 'var(--theme-primary-600)'
                }}
              >
                {categoryLabel}
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

