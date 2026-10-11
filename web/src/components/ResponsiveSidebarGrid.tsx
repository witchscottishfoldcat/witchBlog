import { ReactNode } from 'react'

interface ResponsiveSidebarGridProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

/**
 * 侧栏 + 主内容网格：移动端主内容优先（order-1），侧栏在下（order-2）
 */
export default function ResponsiveSidebarGrid({
  sidebar,
  children,
  className = '',
}: ResponsiveSidebarGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-4 ${className}`}>
      <div className="order-2 lg:order-1 lg:col-span-1">{sidebar}</div>
      <div className="order-1 lg:order-2 lg:col-span-3 min-w-0">{children}</div>
    </div>
  )
}
