'use client'

import { useLayout } from '@/contexts/LayoutContext'
import Sidebar from '@/components/Sidebar'
import { ReactNode } from 'react'

interface PageLayoutProps {
  leftSidebar?: ReactNode
  rightSidebar?: ReactNode
  content: ReactNode
  forceThreeColumn?: boolean
}

const shellClass =
  'mobile-main container mx-auto max-md:px-3 max-md:py-2 max-md:pb-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8'

export default function PageLayout({ leftSidebar, rightSidebar, content, forceThreeColumn = false }: PageLayoutProps) {
  const { sidebarPosition } = useLayout()
  const hasSidebar = !!(leftSidebar || rightSidebar)

  if (!hasSidebar) {
    return (
      <div className={shellClass} suppressHydrationWarning>
        <div className="mx-auto w-full max-w-[1600px] min-w-0">{content}</div>
      </div>
    )
  }

  // 当切换到右侧模式时，显示左中右三栏布局
  // 使用 suppressHydrationWarning 因为布局模式在客户端挂载后会从 localStorage 更新
  if (forceThreeColumn || sidebarPosition === 'right') {
    return (
      <div className={shellClass} suppressHydrationWarning>
        <div className="flex justify-center" suppressHydrationWarning>
          <div className="w-full max-w-[1600px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
              {/* 左侧边栏 - 手机端隐藏，由底部 Tab / 更多菜单进入 */}
              <div className="hidden lg:block lg:col-span-3 order-2 lg:order-1">
                <Sidebar position="left">
                  {leftSidebar}
                </Sidebar>
              </div>

              {/* 主内容 - 移动端优先 */}
              <div className={`${rightSidebar ? 'lg:col-span-6' : 'lg:col-span-9'} order-1 lg:order-2 min-w-0`}>
                {content}
              </div>

              {/* 右侧边栏 - 最新动态、RSS、音乐 */}
              {rightSidebar && (
                <div className="hidden lg:block lg:col-span-3 order-3">
                  <Sidebar position="right">
                    {rightSidebar}
                  </Sidebar>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 左侧合并模式：左栏叠放左右两侧内容 | 内容（两栏）
  return (
    <div className={shellClass} suppressHydrationWarning>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 sm:gap-6 lg:gap-8" suppressHydrationWarning>
        <div className="hidden lg:block order-2 lg:order-1">
          <Sidebar position="left">
            {leftSidebar}
            {rightSidebar}
          </Sidebar>
        </div>

        {/* 主内容 — 移动端优先 */}
        <div className="lg:col-span-3 order-1 lg:order-2 min-w-0">
          {content}
        </div>
      </div>
    </div>
  )
}

