import Link from 'next/link'
import type { ReactNode } from 'react'

interface MobilePageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  trailing?: ReactNode
}

/** 手机端页面顶栏（列表/归档等），桌面端隐藏 */
export default function MobilePageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  trailing,
}: MobilePageHeaderProps) {
  return (
    <header className="mobile-page-header mb-3 md:hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {backHref && (
            <Link
              href={backHref}
              className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-primary-600)] active:opacity-70"
            >
              <span aria-hidden>‹</span>
              {backLabel}
            </Link>
          )}
          <h1 className="truncate text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </header>
  )
}
