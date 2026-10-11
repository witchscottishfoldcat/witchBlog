const TAG_SEPARATOR_RE = /[,，、;；]+|["'“”‘’]\s*["'“”‘’]/
const TAG_EDGE_QUOTES_RE = /^["'“”‘’]+|["'“”‘’]+$/g

function normalizeTagString(value: string): string[] {
  const withoutBrackets = value.trim().replace(/^\[/, '').replace(/\]$/, '')

  return withoutBrackets
    .split(TAG_SEPARATOR_RE)
    .map((tag) => tag.trim().replace(TAG_EDGE_QUOTES_RE, '').trim())
    .filter(Boolean)
}

/** 将 API / contentlayer 及历史 frontmatter 中的 tags 统一为字符串数组 */
export function normalizeTags(tags: string[] | string | undefined | null): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) {
    return tags.flatMap((tag) => normalizeTagString(String(tag)))
  }
  if (typeof tags === 'string') {
    return normalizeTagString(tags)
  }
  return []
}

const TITLE_NORMALIZE_RE = /[#*`~!?:：、，。,.\s"'“”‘’()（）\[\]]/g

/** 归一化标题文本，用于宽松比对（忽略标点、空白、markdown 符号、大小写） */
function normalizeTitleText(value: string): string {
  return value.replace(TITLE_NORMALIZE_RE, '').toLowerCase()
}

/**
 * 去掉正文开头与文章标题重复的一级标题。
 * 很多 md 文件开头会写 `# 标题`，而页面头部卡片已经展示过标题，避免重复。
 */
export function stripDuplicateTitleHeading(markdown: string, title: string): string {
  if (!markdown || !title) return markdown
  const target = normalizeTitleText(title)
  if (!target) return markdown

  const match = markdown.match(/^\s{0,3}#\s+(.+?)\s*#*\s*(?:\r?\n|$)/)
  if (!match) return markdown
  if (normalizeTitleText(match[1]) !== target) return markdown

  // 移除该标题行以及紧随其后的空行 / 分隔线
  return markdown
    .slice(match[0].length)
    .replace(/^(?:[ \t]*\r?\n)*(?:[ \t]*(?:---+|\*\*\*+|___+)[ \t]*\r?\n)?(?:[ \t]*\r?\n)*/, '')
}
