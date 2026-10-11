import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getPublicMdFiles, getArchives, convertMdFileToPost, convertArchiveToPost } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface RecentPostsNavProps {
  locale: string
  limit?: number
}

export default async function RecentPostsNav({ locale, limit = 6 }: RecentPostsNavProps) {
  const t = await getTranslations('sidebar')
  const [mdFilesResponse, archives] = await Promise.all([
    getPublicMdFiles({ skip: 0, limit: 50 }),
    getArchives({ skip: 0, limit: 50, is_public: true }),
  ])

  const posts = [
    ...mdFilesResponse.files.map((f) => convertMdFileToPost(f, locale)),
    ...archives.map((a) => convertArchiveToPost(a, locale)),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

  if (posts.length === 0) return null

  return (
    <SidebarCard title={t('recentPosts')}>
      <div className="space-y-1">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={NAV_ROUTES.post(locale, post.slug)}
            className={`${sidebarLinkClass} !justify-start gap-2`}
          >
            <span className="line-clamp-2 min-w-0 flex-1 text-left">{post.title}</span>
          </Link>
        ))}
        <Link
          href={NAV_ROUTES.posts(locale)}
          className="mt-2 block text-center text-xs font-medium text-[var(--theme-primary-600)] hover:underline"
        >
          {t('viewAllPosts')}
        </Link>
      </div>
    </SidebarCard>
  )
}
