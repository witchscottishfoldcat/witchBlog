import { getTranslations } from 'next-intl/server'
import { getLinks, convertLinkToFriendLink } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { Chip } from '@/components/ui/Chip'
import { NAV_ROUTES } from '@/constants'

interface FriendLinkTagsNavProps {
  locale: string
}

export default async function FriendLinkTagsNav({ locale }: FriendLinkTagsNavProps) {
  const t = await getTranslations('sidebar')
  const apiLinks = await getLinks({ is_active: true, skip: 0, limit: 100 })
  const tagCounts = new Map<string, number>()

  for (const link of apiLinks) {
    const converted = convertLinkToFriendLink(link, locale)
    for (const tag of converted.tags || []) {
      const trimmed = tag.trim()
      if (trimmed) tagCounts.set(trimmed, (tagCounts.get(trimmed) || 0) + 1)
    }
  }

  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  if (tags.length === 0) return null

  return (
    <SidebarCard title={t('linkTags')}>
      <div className="flex flex-wrap gap-2">
        {tags.map(([tag, count]) => (
          <Chip
            key={tag}
            href={`${NAV_ROUTES.friendLinks(locale)}?tag=${encodeURIComponent(tag)}`}
            count={count}
            title={`${tag} (${count})`}
            scroll={false}
          >
            #{tag}
          </Chip>
        ))}
      </div>
    </SidebarCard>
  )
}
