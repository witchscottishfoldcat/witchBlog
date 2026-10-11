import Link from 'next/link'
import { type ReactNode } from 'react'

export interface ChipProps {
  children: ReactNode
  href?: string
  count?: number
  active?: boolean
  className?: string
  onClick?: () => void
  title?: string
  scroll?: boolean
}

const chipBase =
  'inline-flex h-6 shrink-0 items-center gap-1 self-center align-middle rounded-full border border-transparent px-2.5 py-0 text-[11px] font-medium leading-none transition-transform active:scale-95 sm:px-3 sm:text-xs'

const chipIdle =
  'bg-[var(--theme-tag-bg)] text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]'

const chipActive = 'bg-[var(--theme-primary-500)] text-white border-[var(--theme-primary-600)]'

export function Chip({ children, href, count, active, className = '', onClick, title, scroll }: ChipProps) {
  const classNames = `${chipBase} ${active ? chipActive : chipIdle} ${className}`

  const content = (
    <>
      <span className="inline-flex h-full max-w-[8rem] items-center gap-1 overflow-hidden whitespace-nowrap leading-none sm:max-w-none">
        {children}
      </span>
      {count != null && (
        <span
          className={`inline-flex h-4 min-w-[1.1rem] items-center justify-center rounded-full px-1 text-center text-[10px] leading-none tabular-nums ${
            active ? 'bg-white/25' : 'bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)] dark:bg-white/10'
          }`}
        >
          {count}
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classNames} onClick={onClick} title={title} scroll={scroll}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" className={classNames} onClick={onClick} title={title}>
        {content}
      </button>
    )
  }

  return (
    <span className={classNames} title={title}>
      {content}
    </span>
  )
}

export function ChipRow({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {title ? (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </p>
      ) : null}
      <div className="chip-scroll -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">{children}</div>
    </div>
  )
}
