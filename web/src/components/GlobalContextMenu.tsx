'use client'

import ContextMenu from './ContextMenu'

interface GlobalContextMenuProps {
  children: React.ReactNode
}

export default function GlobalContextMenu({ children }: GlobalContextMenuProps) {
  return (
    <ContextMenu>
      {children}
    </ContextMenu>
  )
}
