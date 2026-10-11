import Link from 'next/link'
import { Chip } from '@/components/ui/Chip'

export type ArchiveListPost = {
  slug: string
  title: string
  date: string
  description?: string
  tags: string[]
}

interface ArchiveYearListProps {
  locale: string
  yearSections: { year: number; posts: ArchiveListPost[] }[]
  emptyLabel: string
  getYearPostsLabel: (count: number) => string
}

const getLocaleFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
  })

export default function ArchiveYearList({
  locale,
  yearSections,
  emptyLabel,
  getYearPostsLabel,
}: ArchiveYearListProps) {
  const formatter = getLocaleFormatter(locale)

  if (yearSections.length === 0) {
    return (
      <div className="mobile-app-section max-md:mobile-page-card py-8 text-center text-xs text-gray-500 dark:text-gray-400 md:py-12 md:text-sm">
        {emptyLabel}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {yearSections.map(({ year, posts }) => (
          <section key={`m-${year}`}>
            <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
              <h2 className="text-xs font-bold tabular-nums text-gray-900 dark:text-gray-100">{year}</h2>
              <Chip>{getYearPostsLabel(posts.length)}</Chip>
            </div>
            <div className="mobile-feed-panel mobile-feed-list">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${locale}/posts/${post.slug}`}
                  prefetch
                  className="mobile-feed-item block p-2.5 active:opacity-90"
                >
                  <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900 dark:text-gray-100">
                    {post.title}
                  </h3>
                  <div className="chip-scroll -mx-0.5 mt-1 flex gap-1 overflow-x-auto pb-0.5">
                    <Chip>{formatter.format(new Date(post.date))}</Chip>
                    {post.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag}>#{tag}</Chip>
                    ))}
                  </div>
                  {post.description ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                      {post.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 桌面端：时间线 */}
      <div className="hidden space-y-8 md:block">
        {yearSections.map(({ year, posts }) => (
          <section key={`d-${year}`} id={`y-${year}`} className="scroll-mt-24 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100 sm:text-3xl">
                  {year}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: 'var(--theme-primary-50)',
                    color: 'var(--theme-primary-600)',
                  }}
                >
                  {getYearPostsLabel(posts.length)}
                </span>
              </div>
              <div
                className="h-px flex-1 bg-gradient-to-r to-transparent dark:from-gray-700"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--theme-primary-200), transparent)',
                }}
              />
            </div>

            <div className="space-y-2">
              {posts.map((post, index) => (
                <div key={post.slug} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="relative z-10 mt-1 h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--theme-primary-500)',
                        boxShadow: '0 0 0 2px var(--theme-primary-100)',
                      }}
                    />
                    {index !== posts.length - 1 && (
                      <span
                        className="mt-1 h-full w-px bg-gradient-to-b to-transparent dark:from-gray-700"
                        style={{
                          backgroundImage:
                            'linear-gradient(to bottom, var(--theme-primary-200), transparent)',
                        }}
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <Link
                      href={`/${locale}/posts/${post.slug}`}
                      prefetch
                      className="archive-link-hover line-clamp-2 text-sm font-medium text-gray-900 transition dark:text-gray-100 sm:flex-1 sm:line-clamp-none sm:text-base"
                    >
                      {post.title}
                    </Link>
                    <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 sm:whitespace-nowrap sm:text-sm">
                      {formatter.format(new Date(post.date))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
