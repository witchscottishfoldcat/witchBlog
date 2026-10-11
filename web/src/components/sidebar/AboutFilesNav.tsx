import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getAboutFiles } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { sidebarLinkClass } from './styles'

interface AboutFilesNavProps {
  locale: string
  currentId?: string
}

export default async function AboutFilesNav({ locale, currentId }: AboutFilesNavProps) {
  const t = await getTranslations('sidebar')
  const files = await getAboutFiles()
  const documents = files.filter(
    (file) =>
      file?.url &&
      !['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some((ext) =>
        file.filename.toLowerCase().endsWith(ext)
      )
  )

  if (documents.length === 0) return null

  return (
    <SidebarCard title={t('aboutFiles')}>
      <div className="space-y-1">
        {documents.map((file) => {
          const isActive = currentId && String(file.id) === currentId
          return (
            <Link
              key={file.id}
              href={`/${locale}/about/${file.id}`}
              className={`${sidebarLinkClass} ${isActive ? 'font-medium text-[var(--theme-primary-600)]' : ''}`}
            >
              <span className="line-clamp-2 min-w-0 flex-1">{file.frontmatterTitle || file.title || file.filename}</span>
            </Link>
          )
        })}
      </div>
    </SidebarCard>
  )
}
