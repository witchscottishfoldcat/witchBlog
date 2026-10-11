import { NextResponse } from 'next/server'
import { getPublicMdFiles, convertMdFileToPost, getPublicSiteConfig } from '@/lib/api'
import { logger } from '@/lib/logger'
import { getSiteBaseUrl } from '@/lib/site-url'

export const rssRevalidate = 60

function generateRSSXML(
  siteConfig: {
    site_name?: string
    site_description?: string
    site_url?: string
  },
  posts: Array<{
    slug: string
    title: string
    description?: string
    date: string
    author?: string
  }>,
  baseUrl: string,
  feedPath: string
): string {
  const siteName = siteConfig.site_name || 'WitchCatUI Blog'
  const siteDescription = siteConfig.site_description || "Witch's Folded Ear Blog"
  const siteUrl = siteConfig.site_url || baseUrl
  const feedUrl = `${baseUrl}${feedPath}`

  const lastBuildDate =
    posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString()

  const items = posts
    .map((post) => {
      const postUrl = `${siteUrl}/zh/posts/${post.slug}`
      const pubDate = new Date(post.date).toUTCString()
      const description = post.description || ''

      const escapeXML = (str: string) =>
        str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')

      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${escapeXML(description)}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${post.author ? `<author>${escapeXML(post.author)}</author>` : ''}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteName}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <generator>Next.js RSS Generator</generator>
${items}
  </channel>
</rss>`
}

export async function buildRssResponse(feedPath: string): Promise<NextResponse> {
  try {
    const baseUrl = getSiteBaseUrl()

    const [siteConfig, postsResponse] = await Promise.all([
      getPublicSiteConfig(),
      getPublicMdFiles({ skip: 0, limit: 20 }),
    ])

    const posts = postsResponse.files
      .filter((file) => {
        if (!file.is_public) return false
        if (file.encrypted === true) return false
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.updated_at).getTime()
        const dateB = new Date(b.created_at || b.updated_at).getTime()
        return dateB - dateA
      })
      .slice(0, 20)
      .map((file) => {
        const post = convertMdFileToPost(file, 'zh')
        return {
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date,
          author: post.author,
        }
      })

    const rssXML = generateRSSXML(siteConfig, posts, baseUrl, feedPath)

    return new NextResponse(rssXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    logger.error('Failed to generate RSS feed:', error)

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Failed to generate RSS feed</description>
  </channel>
</rss>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
        },
      }
    )
  }
}
