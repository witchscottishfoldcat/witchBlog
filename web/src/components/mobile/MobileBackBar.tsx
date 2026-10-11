import Link from 'next/link'

interface MobileBackBarProps {
  href: string
  label: string
}

/** 手机端文章详情顶栏返回 */
export default function MobileBackBar({ href, label }: MobileBackBarProps) {
  return (
    <div className="sticky top-0 z-20 -mx-3 mb-3 flex items-center gap-2 border-b border-gray-200/80 bg-[var(--theme-card-bg)]/95 px-3 py-2.5 backdrop-blur-md dark:border-gray-700/80 md:hidden">
      <Link
        href={href}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-lg font-medium text-[var(--theme-primary-600)] active:bg-[var(--theme-primary-100)]"
        aria-label={label}
      >
        ‹
      </Link>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </div>
  )
}
