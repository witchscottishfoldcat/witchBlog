'use client'

import MusicPlayer from '@/components/MusicPlayer'

/**
 * MusicPlayer 包装组件
 * 在客户端组件中包装 MusicPlayer，避免在 Server Component 中直接使用客户端组件
 * 注意：由于 MusicPlayer 已经是客户端组件，直接导入即可
 */
export default function MusicPlayerWrapper() {
  return <MusicPlayer />
}

