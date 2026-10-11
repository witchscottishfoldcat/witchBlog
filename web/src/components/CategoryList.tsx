import Link from 'next/link'
import { getAllCategories } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import { NAV_ROUTES } from '@/constants'
import { Chip } from '@/components/ui/Chip'

interface CategoryListProps {
  locale: string
}

/**
 * 分类列表组件
 * 从 API 和 contentlayer 获取所有分类，按使用频率排序显示
 * 点击分类跳转到对应分类的文章列表
 */
export default async function CategoryList({ locale }: CategoryListProps) {
  const t = await getTranslations('components')
  // 获取所有分类（从 API 和 contentlayer）
  const { categories } = await getAllCategories()

  return (
    <>
      <div className="chip-scroll -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 md:hidden">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Chip
              key={category.label}
              href={`${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(category.label)}`}
              count={category.count}
              className="!font-semibold"
              scroll={false}
            >
              {category.label}
            </Chip>
          ))
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t('noCategories')}</span>
        )}
      </div>
      <div className="hidden space-y-2.5 md:block">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.label}
              className="overflow-hidden rounded-xl border border-[var(--theme-card-border)] bg-[var(--theme-card-bg-80)]"
            >
              <Link
                href={`${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(category.label)}`}
                scroll={false}
                className="sidebar-item-theme flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition dark:text-gray-200"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3.5 6.75A1.75 1.75 0 0 1 5.25 5h4.1l1.8 2h7.6a1.75 1.75 0 0 1 1.75 1.75v8.5A1.75 1.75 0 0 1 18.75 19H5.25a1.75 1.75 0 0 1-1.75-1.75z" />
                    </svg>
                  </span>
                  <span className="truncate">{category.label}</span>
                </span>
                <span className="rounded-full bg-[var(--theme-primary-100)] px-2 py-0.5 text-xs tabular-nums text-[var(--theme-primary-600)]">
                  {category.count}
                </span>
              </Link>
            </div>
          ))
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400 px-4 py-2">
            {t('noCategories')}
          </span>
        )}
      </div>
    </>
  )
}

