import 'server-only'

import { cache } from 'react'
import { getResourceLinks } from './api'

/**
 * Deduplicate identical resource-link reads within one server render.
 * The underlying fetch still controls cross-request freshness.
 */
export const getActiveResourceLinks = cache((limit = 10) =>
  getResourceLinks({
    is_active: true,
    skip: 0,
    limit,
    sort_by: 'sort_order',
  })
)
