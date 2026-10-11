'use client'

import Image from 'next/image'
import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'

interface PhotoStackProps {
  photos: string[]
  title: string
  maxStack?: number
  className?: string
}

interface StackConfig {
  rotate: number
  translateX: number
  translateY: number
  scale: number
  zIndex: number
}

function getStackConfig(index: number, total: number): StackConfig {
  // 预设的堆叠角度，让照片看起来像自然散落的一叠
  const rotations = [-4, 2, -1, 3, -2]
  const offsetsX = [-8, 6, -3, 9, -5]
  const offsetsY = [-4, 5, -2, 6, -3]

  return {
    rotate: rotations[index % rotations.length] + (index - total / 2) * 1.5,
    translateX: offsetsX[index % offsetsX.length],
    translateY: offsetsY[index % offsetsY.length],
    scale: 1 - index * 0.04,
    zIndex: total - index,
  }
}

function StackPhoto({
  src,
  alt,
  config,
  isPolaroid = false,
}: {
  src: string
  alt: string
  config: StackConfig
  isPolaroid?: boolean
}) {
  const displayUrl = getImageUrl(src)

  if (!displayUrl) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-200 shadow-lg dark:bg-gray-700"
        style={{
          transform: `translate(${config.translateX}px, ${config.translateY}px) rotate(${config.rotate}deg) scale(${config.scale})`,
          zIndex: config.zIndex,
        }}
      >
        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  const baseClasses = isPolaroid
    ? 'absolute inset-0 rounded bg-white p-1.5 shadow-xl dark:bg-gray-800'
    : 'absolute inset-0 rounded-lg shadow-lg'

  if (shouldUseNativeImg(displayUrl)) {
    return (
      <div
        className={baseClasses}
        style={{
          transform: `translate(${config.translateX}px, ${config.translateY}px) rotate(${config.rotate}deg) scale(${config.scale})`,
          zIndex: config.zIndex,
          transition: 'transform 0.3s ease',
        }}
      >
        <img
          src={displayUrl}
          alt={alt}
          className={`h-full w-full object-cover ${isPolaroid ? 'rounded-sm' : 'rounded-lg'}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  return (
    <div
      className={baseClasses}
      style={{
        transform: `translate(${config.translateX}px, ${config.translateY}px) rotate(${config.rotate}deg) scale(${config.scale})`,
        zIndex: config.zIndex,
        transition: 'transform 0.3s ease',
      }}
    >
      <Image
        src={displayUrl}
        alt={alt}
        fill
        className={`object-cover ${isPolaroid ? 'rounded-sm' : 'rounded-lg'}`}
        sizes="200px"
      />
    </div>
  )
}

export default function PhotoStack({ photos, title, maxStack = 3, className = '' }: PhotoStackProps) {
  const stackPhotos = photos.slice(0, maxStack)

  if (stackPhotos.length === 0) {
    return (
      <div className={`relative flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 ${className}`}>
        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  // 只有1张照片时，添加一个"假"的底层照片作为装饰，营造堆叠感
  const displayPhotos = stackPhotos.length === 1
    ? [stackPhotos[0], stackPhotos[0]]
    : stackPhotos

  return (
    <div className={`group/stack relative ${className}`}>
      {/* 照片堆叠 */}
      <div className="relative h-full w-full">
        {displayPhotos.map((photo, index) => {
          const config = getStackConfig(index, displayPhotos.length)
          return (
            <StackPhoto
              key={`stack-${photo}-${index}`}
              src={photo}
              alt={`${title} - ${index + 1}`}
              config={config}
              isPolaroid={displayPhotos.length > 1}
            />
          )
        })}
      </div>

      {/* 悬停时展开效果 */}
      {displayPhotos.length > 1 && (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/stack:opacity-100">
          {displayPhotos.map((photo, index) => {
            const spreadX = (index - (displayPhotos.length - 1) / 2) * 35
            const spreadY = Math.abs(index - (displayPhotos.length - 1) / 2) * -8
            return (
              <div
                key={`spread-${photo}-${index}`}
                className="absolute inset-0 rounded bg-white p-1.5 shadow-xl transition-transform duration-300 dark:bg-gray-800"
                style={{
                  transform: `translate(${spreadX}px, ${spreadY}px) rotate(0deg) scale(0.92)`,
                  zIndex: displayPhotos.length - index,
                }}
              >
                {shouldUseNativeImg(getImageUrl(photo) || '') ? (
                  <img
                    src={getImageUrl(photo) || ''}
                    alt={`${title} - ${index + 1}`}
                    className="h-full w-full rounded-sm object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Image
                    src={getImageUrl(photo) || ''}
                    alt={`${title} - ${index + 1}`}
                    fill
                    className="rounded-sm object-cover"
                    sizes="200px"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
