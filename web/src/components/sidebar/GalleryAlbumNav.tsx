import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getAlbums, convertAlbumToGalleryEntry } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface GalleryAlbumNavProps {
  locale: string
  currentAlbumId?: string | number
}

export default async function GalleryAlbumNav({ locale, currentAlbumId }: GalleryAlbumNavProps) {
  const t = await getTranslations('sidebar')
  const response = await getAlbums({ skip: 0, limit: 12, public_only: true, sort_by: 'created_at' })
  const albums = response.albums.map((album) => convertAlbumToGalleryEntry(album, locale))

  if (albums.length === 0) return null

  return (
    <SidebarCard title={t('albumList')}>
      <div className="space-y-1">
        {albums.map((album) => {
          const isActive = currentAlbumId != null && String(album.id) === String(currentAlbumId)
          return (
            <Link
              key={album.id}
              href={`/${locale}/my/gallery/${album.id}`}
              className={`${sidebarLinkClass} ${isActive ? 'font-medium text-[var(--theme-primary-600)]' : ''}`}
            >
              <span className="line-clamp-2 min-w-0 flex-1">{album.title}</span>
              <span className="ml-2 shrink-0 text-xs text-gray-400">{album.photoCount}</span>
            </Link>
          )
        })}
        <Link
          href={NAV_ROUTES.myGallery(locale)}
          className="mt-2 block text-center text-xs font-medium text-[var(--theme-primary-600)] hover:underline"
        >
          {t('viewAllAlbums')}
        </Link>
      </div>
    </SidebarCard>
  )
}
