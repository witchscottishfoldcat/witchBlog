'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { AlbumPhoto } from '@/lib/api'
import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'

interface AlbumPhotoGridProps {
  photos: AlbumPhoto[]
}

export default function AlbumPhotoGrid({ photos }: AlbumPhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null)
  const t = useTranslations('gallery')

  if (photos.length === 0) {
    return (
      <div 
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-6 sm:p-8 md:p-12 text-center backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      >
        <p className="text-gray-500 dark:text-gray-400">
          {t('noPhotos')}
        </p>
      </div>
    )
  }

  // 按 sort_order 排序
  const sortedPhotos = [...photos].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {sortedPhotos.map((photo) => {
          const rawThumb = photo.thumbnail_url || photo.image_url || ''
          const displayUrl = getImageUrl(rawThumb)

          return (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105 dark:bg-gray-700 sm:rounded-xl"
              onClick={() => setSelectedPhoto(photo)}
            >
              {displayUrl ? (
                shouldUseNativeImg(displayUrl) ? (
                  <img
                    src={displayUrl}
                    alt={photo.title || photo.original_filename || 'Photo'}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Image
                    src={displayUrl}
                    alt={photo.title || photo.original_filename || 'Photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg
                    className="h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              
              <div className="absolute inset-0 hidden items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100 sm:flex">
                <span className="px-1 text-center text-xs font-medium text-white sm:text-sm">
                  {photo.title || photo.original_filename}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <div className="relative">
              {(() => {
                const fullUrl = getImageUrl(selectedPhoto.image_url || selectedPhoto.thumbnail_url)
                if (!fullUrl) {
                  return (
                    <div className="flex h-96 w-96 items-center justify-center text-white">
                      <p>{t('loadImageFailed')}</p>
                    </div>
                  )
                }
                return (
                  <img
                    src={fullUrl}
                    alt={selectedPhoto.title || selectedPhoto.original_filename || 'Photo'}
                    className="max-h-[90vh] max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )
              })()}
              
              {/* Photo Info */}
              {(selectedPhoto.title || selectedPhoto.description) && (
                <div className="mt-4 rounded-lg bg-white/10 p-4 text-white backdrop-blur">
                  {selectedPhoto.title && (
                    <h3 className="mb-2 text-lg font-semibold">{selectedPhoto.title}</h3>
                  )}
                  {selectedPhoto.description && (
                    <p className="text-sm opacity-90">{selectedPhoto.description}</p>
                  )}
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedPhoto.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/20 px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

