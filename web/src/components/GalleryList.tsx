'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Chip } from '@/components/ui/Chip'
import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'
import PhotoStack from '@/components/PhotoStack'

export interface GalleryEntry {
  id: string
  title: string
  description: string
  coverImage: string
  samplePhotos?: string[]
  photoCount: number
  source?: string
  date: string
  tags: string[]
  locale: string
  viewCount?: number
  createdAt?: string
  updatedAt?: string
}

interface GalleryListProps {
  entries: GalleryEntry[]
}

function GalleryCoverThumb({
  coverImage,
  title,
  noCoverLabel,
}: {
  coverImage: string
  title: string
  noCoverLabel: string
}) {
  const displayUrl = getImageUrl(coverImage)
  if (displayUrl) {
    if (shouldUseNativeImg(displayUrl)) {
      return (
        <img
          src={displayUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )
    }
    return (
      <Image
        src={displayUrl}
        alt={title}
        fill
        className="object-cover"
        sizes="48px"
      />
    )
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="sr-only">{noCoverLabel}</span>
    </div>
  )
}

function GalleryEntryMetaChips({
  entry,
  t,
}: {
  entry: GalleryEntry
  t: ReturnType<typeof useTranslations<'gallery'>>
}) {
  return (
    <>
      <div className="chip-scroll -mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible">
        <Chip>
          {entry.photoCount} {t('photos')}
        </Chip>
        {entry.viewCount !== undefined && (
          <Chip>
            {entry.viewCount} {t('views')}
          </Chip>
        )}
        {entry.source && <Chip>{entry.source}</Chip>}
        <Chip>{entry.date}</Chip>
      </div>
      {entry.tags.length > 0 && (
        <div className="chip-scroll -mx-0.5 mt-1 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:mt-0 sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
          {entry.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      )}
    </>
  )
}

export default function GalleryList({ entries }: GalleryListProps) {
  const t = useTranslations('gallery')

  if (entries.length === 0) {
    return (
      <div
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-6 sm:p-8 md:p-12 text-center backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p className="text-gray-500 dark:text-gray-400">{t('noAlbums')}</p>
      </div>
    )
  }

  return (
    <div
      className="mobile-app-section max-md:space-y-3 max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur md:border"
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="max-md:mobile-feed-panel max-md:mobile-feed-list space-y-6 max-md:space-y-0 md:space-y-6">
        {entries.map((entry, index) => (
          <Link
            key={entry.id}
            href={`/${entry.locale}/my/gallery/${entry.id}`}
            className="group relative block max-md:mobile-feed-item md:overflow-hidden md:rounded-2xl md:border md:transition-all md:duration-300 md:hover:-translate-y-1 md:hover:shadow-xl"
            style={{
              background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 48%, var(--theme-card-bg)), var(--theme-card-bg) 68%)',
              borderColor: 'var(--theme-primary-200)',
            }}
          >
            {/* 顶部彩色线条 */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
              style={{ background: `linear-gradient(to right, var(--theme-primary-400), var(--theme-secondary), transparent)` }}
              aria-hidden
            />
            {/* 背景光晕 */}
            <div
              className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-[0.14] blur-3xl transition-transform duration-500 group-hover:scale-125"
              style={{ backgroundColor: 'var(--theme-primary-400)' }}
              aria-hidden
            />
            {/* 序号水印 */}
            <span
              className="pointer-events-none absolute -bottom-7 -right-1 select-none font-black leading-none tracking-tighter opacity-[0.08] text-[8rem]"
              style={{ color: 'var(--theme-primary-500)' }}
              aria-hidden
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* Mobile — compact feed row */}
            <div className="relative flex gap-2.5 p-2.5 md:hidden">
              <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <GalleryCoverThumb
                  coverImage={entry.coverImage}
                  title={entry.title}
                  noCoverLabel={t('noCover')}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {entry.title}
                </h2>
                {entry.description ? (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-600 dark:text-gray-400">
                    {entry.description}
                  </p>
                ) : null}
                <div className="mt-1">
                  <GalleryEntryMetaChips entry={entry} t={t} />
                </div>
              </div>
            </div>

            {/* Desktop — horizontal card */}
            <div className="relative hidden gap-4 p-4 sm:gap-6 sm:p-6 md:grid md:grid-cols-[200px,1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <PhotoStack
                  photos={entry.samplePhotos || [entry.coverImage]}
                  title={entry.title}
                  className="h-full w-full"
                />
                {/* 照片数量角标 */}
                <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {entry.photoCount} {t('photos')}
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="mb-2 font-serif text-xl font-semibold text-gray-900 transition-colors group-hover:text-pink-600 dark:text-gray-100 dark:group-hover:text-pink-400 sm:text-2xl">
                    {entry.title}
                    <span className="ml-2 inline text-base font-normal text-pink-400 opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </h2>
                  <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {entry.description}
                  </p>
                </div>
                <GalleryEntryMetaChips entry={entry} t={t} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
