import type { MetadataRoute } from 'next'
import { getArchives, getPublicMdFiles } from '@/lib/api'
import { locales } from '@/i18n'
import { logger } from '@/lib/logger'
import { getSiteBaseUrl } from '@/lib/site-url'

export const revalidate = 300

function safeDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteBaseUrl()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    entries.push(
      {
        url: `${siteUrl}/${locale}/posts`,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${siteUrl}/${locale}/archive`,
        changeFrequency: 'daily',
        priority: 0.8,
      },
    )
  }

  try {
    const [mdFilesResponse, archives] = await Promise.all([
      getPublicMdFiles({ skip: 0, limit: 1000 }),
      getArchives({ skip: 0, limit: 1000, is_public: true }),
    ])

    const publicPosts = [
      ...mdFilesResponse.files
        .filter((file) => file.is_public && !file.encrypted)
        .map((file) => ({
          slug: file.id.toString(),
          updatedAt: file.updated_at || file.published || file.created_at,
        })),
      ...archives
        .filter((archive) => archive.is_public && !archive.encrypted)
        .map((archive) => ({
          slug: archive.id.toString(),
          updatedAt: archive.updated_at || archive.published || archive.archive_date,
        })),
    ]

    const uniquePosts = new Map(publicPosts.map((post) => [post.slug, post]))

    for (const post of uniquePosts.values()) {
      const languages = Object.fromEntries(
        locales.map((locale) => [locale, `${siteUrl}/${locale}/posts/${post.slug}`])
      )

      for (const locale of locales) {
        entries.push({
          url: `${siteUrl}/${locale}/posts/${post.slug}`,
          lastModified: safeDate(post.updatedAt),
          changeFrequency: 'weekly',
          priority: locale === 'zh' ? 0.8 : 0.7,
          alternates: { languages },
        })
      }
    }
  } catch (error) {
    logger.error('[sitemap] Failed to load public posts:', error)
  }

  return entries
}
