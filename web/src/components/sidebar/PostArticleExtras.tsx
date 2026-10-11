import { getTranslations } from 'next-intl/server'
import ResourceLinks from '@/components/ResourceLinks'
import { SidebarCard } from '@/components/Sidebar'
import PostMetaSidebar from './PostMetaSidebar'
interface PostArticleExtrasProps {
  locale: string
  category?: string
  subcategory?: string
  tags?: string[]
  wordCount?: number
  readingTime?: number
}

export default async function PostArticleExtras({
  locale,
  category,
  subcategory,
  tags,
  wordCount,
  readingTime,
}: PostArticleExtrasProps) {
  const sidebarT = await getTranslations('sidebar')

  return (
    <>
      <PostMetaSidebar
        locale={locale}
        category={category}
        subcategory={subcategory}
        tags={tags}
        wordCount={wordCount}
        readingTime={readingTime}
      />
      <SidebarCard title={sidebarT('resourceLinks')}>
<ResourceLinks locale={locale} limit={10} />
      </SidebarCard>
    </>
  )
}
