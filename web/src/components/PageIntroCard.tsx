import type { ReactNode } from 'react'
import { Icon } from '@iconify/react'

type PageIntroCardProps = {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}

export function PageIntroBadge({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-primary-100)] bg-[var(--theme-primary-50)] px-2.5 py-1 text-[11px] font-medium text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]">
      {icon ? <Icon icon={icon} className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {children}
    </span>
  )
}

export default function PageIntroCard({
  title,
  subtitle,
  meta,
  actions,
}: PageIntroCardProps) {
  return (
    <section
      data-page-intro
      className="hidden rounded-[32px] border p-8 backdrop-blur md:!mt-0 md:mb-5 md:block"
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className={`flex min-w-0 items-center gap-3 ${subtitle || meta ? 'mb-2' : ''}`}>
        <span className="h-8 w-1 shrink-0 rounded-full accent-bar-theme" aria-hidden />
        <h1 className="min-w-0 flex-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {subtitle ? (
        <p className="ml-4 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">{subtitle}</p>
      ) : null}

      {meta ? (
        <div className="ml-4 mt-5 flex min-w-0 flex-wrap items-center gap-2">{meta}</div>
      ) : null}
    </section>
  )
}
