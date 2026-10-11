import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface CategoryPost {
  slug: string
  title: string
  subcategory?: string
}

interface CategoryPostsNavProps {
  locale: string
  category: string
  subcategory?: string
  posts: CategoryPost[]
  subcategories: Array<{ label: string; count: number }>
}

/** 分类筛选页左栏：仅展示当前分类内的文章，并提供清晰的返回路径。 */
export default async function CategoryPostsNav({
  locale,
  category,
  subcategory,
  posts,
  subcategories,
}: CategoryPostsNavProps) {
  const t = await getTranslations('sidebar')
  const commonT = await getTranslations('common')
  const categoryPath = subcategory ? `${category} › ${subcategory}` : category
  const backHref = subcategory
    ? `${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(category)}`
    : NAV_ROUTES.home(locale)

  return (
    <SidebarCard title={t('categoryPosts')}>
      <div className="mb-3 rounded-xl border border-[var(--theme-card-border)] bg-[var(--theme-primary-100)]/60 p-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('currentCategory')}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]">
          {categoryPath}
        </p>
      </div>

      <Link
        href={backHref}
        className="mb-2 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--theme-primary-600)] transition hover:bg-[var(--theme-primary-100)]"
      >
        <span aria-hidden>‹</span>
        {subcategory ? t('backToParentCategory') : commonT('backToHome')}
      </Link>

      {subcategories.length > 0 && (
        <div className="mb-3 border-y border-[var(--theme-card-border)] py-2.5">
          <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('secondaryCategories')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((item) => (
              <Link
                key={item.label}
                href={`${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(item.label)}`}
                scroll={false}
                className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition ${
                  item.label === subcategory
                    ? 'bg-[var(--theme-primary-500)] text-white'
                    : 'bg-[var(--theme-tag-bg)] text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]'
                }`}
              >
                <span>{item.label}</span>
                <span className="opacity-65">{item.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
        <p className="px-2.5 py-3 text-xs text-gray-500 dark:text-gray-400">{t('noCategoryPosts')}</p>
      )}
    </SidebarCard>
  )
}
