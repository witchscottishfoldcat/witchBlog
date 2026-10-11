import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface TagPost {
  slug: string
  title: string
}

interface TagPostsNavProps {
  locale: string
  tag: string
  posts: TagPost[]
}

/** 标签筛选页左栏：仅展示带有当前标签的文章。 */
export default async function TagPostsNav({ locale, tag, posts }: TagPostsNavProps) {
  const [sidebarT, commonT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('common'),
  ])

  return (
    <SidebarCard title={sidebarT('tagPosts')}>
      <div className="mb-3 rounded-xl border border-[var(--theme-card-border)] bg-[var(--theme-primary-100)]/60 p-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {sidebarT('currentTag')}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]">
          #{tag}
        </p>
      </div>

      <Link
        href={NAV_ROUTES.home(locale)}
        className="mb-2 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--theme-primary-600)] transition hover:bg-[var(--theme-primary-100)]"
      >
        <span aria-hidden>‹</span>
        {commonT('backToHome')}
      </Link>

      {posts.length > 0 ? (
        <div className="max-h-[22rem] space-y-1 overflow-y-auto pr-1">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={NAV_ROUTES.post(locale, post.slug)}
              className={`${sidebarLinkClass} !items-start !justify-start gap-2`}
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-primary-400)]" />
              <span className="line-clamp-2 min-w-0 flex-1 text-left">{post.title}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-2.5 py-3 text-xs text-gray-500 dark:text-gray-400">{sidebarT('noTagPosts')}</p>
      )}
    </SidebarCard>
  )
}
