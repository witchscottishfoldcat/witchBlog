import { buildRssResponse } from '@/lib/rss-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  return buildRssResponse('/rss/feed')
}
