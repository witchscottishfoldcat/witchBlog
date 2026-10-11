'use client'

import { useEffect, useState } from 'react'

interface KawaiiLoaderProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

const sizeMap = {
  small: {
    container: 'w-12 h-12',
    eye: 'w-1.5 h-1.5',
    eyeOffset: 6,
    mouth: 'w-2 h-2',
  },
  medium: {
    container: 'w-16 h-16',
    eye: 'w-2 h-2',
    eyeOffset: 8,
    mouth: 'w-3 h-3',
  },
  large: {
    container: 'w-24 h-24',
    eye: 'w-3 h-3',
    eyeOffset: 12,
    mouth: 'w-4 h-4',
  },
}

export default function KawaiiLoader({ size = 'medium', text }: KawaiiLoaderProps) {
  const [eyeOffset, setEyeOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setEyeOffset((prev) => (prev === 0 ? 1 : 0))
    }, 600)
    return () => clearInterval(interval)
  }, [])

  const sizes = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizes.container} relative rounded-full border-4 flex items-center justify-center animate-bounce`}
        style={{
          borderColor: 'var(--theme-primary-400)',
          backgroundColor: 'var(--theme-card-bg)',
          animationDuration: '1s',
        }}
      >
        {/* 左眼 */}
        <div
          className={`absolute ${sizes.eye} rounded-full bg-pink-500 dark:bg-pink-400 transition-all duration-300`}
          style={{
            left: `calc(50% - ${sizes.eyeOffset}px - ${eyeOffset * 2}px)`,
            top: '35%',
            transform: 'translateY(-50%)',
          }}
        />
        {/* 右眼 */}
        <div
          className={`absolute ${sizes.eye} rounded-full bg-pink-500 dark:bg-pink-400 transition-all duration-300`}
          style={{
            right: `calc(50% - ${sizes.eyeOffset}px - ${eyeOffset * 2}px)`,
            top: '35%',
            transform: 'translateY(-50%)',
          }}
        />
        {/* 嘴巴 */}
        <div
          className={`absolute ${sizes.mouth} border-2 border-pink-500 dark:border-pink-400 rounded-full`}
          style={{
            bottom: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
          }}
        />
        {/* 脸颊红晕 */}
        <div
          className="absolute w-2 h-2 rounded-full bg-pink-300/50 dark:bg-pink-400/50 blur-sm"
          style={{ left: '15%', top: '50%' }}
        />
        <div
          className="absolute w-2 h-2 rounded-full bg-pink-300/50 dark:bg-pink-400/50 blur-sm"
          style={{ right: '15%', top: '50%' }}
        />
      </div>
      {text && (
        <p
          className="text-sm font-medium animate-pulse"
          style={{ color: 'var(--theme-primary-600)' }}
        >
          {text}
        </p>
      )}
    </div>
  )
}

