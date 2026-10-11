/** 从标题文本生成 URL 锚点 slug（SSR/CSR 一致，支持中文） */
export function slugifyHeading(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug
}

/** 从 HAST 节点读取 rehype-slug 写入的 id */
export function getHeadingIdFromNode(node: { properties?: { id?: unknown } } | undefined): string | undefined {
  const raw = node?.properties?.id
  if (typeof raw === 'string' && raw.length > 0) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].length > 0) return raw[0]
  return undefined
}
