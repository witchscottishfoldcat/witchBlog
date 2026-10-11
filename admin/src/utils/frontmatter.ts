/*
 * Markdown frontmatter(YAML 头)解析与序列化。
 * 仅处理博客渲染用到的扁平键:title/published/description/tags/category/subcategory/pinned/encrypted,
 * 不依赖 yaml 库;解析对引号风格(直/弯引号)和 tags 写法(行内数组/短横线列表)容错。
 */

export interface FrontmatterMeta {
  title: string;
  published: string;
  description: string;
  tags: string[];
  category: string;
  subcategory: string;
  pinned: boolean;
  encrypted: boolean;
}

export const EMPTY_FRONTMATTER: FrontmatterMeta = {
  title: '',
  published: '',
  description: '',
  tags: [],
  category: '',
  subcategory: '',
  pinned: false,
  encrypted: false,
};

const FRONTMATTER_RE = /^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** 去掉值两侧的引号(含中文弯引号) */
function unquote(v: string): string {
  return v.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
}

/** 解析 tags 值:支持 ["a", "b"]、[a, b]、以及弯引号无逗号写法 */
function parseTagsValue(raw: string): string[] {
  const body = raw.trim().replace(/^\[/, '').replace(/\]$/, '');
  // 先按逗号切,再按引号边界补切(处理 “a”“b” 这种没有逗号的情况)
  return body
    .split(/[,，]/)
    .flatMap((part) => part.split(/["'“”‘’]\s*["'“”‘’]/))
    .map(unquote)
    .filter(Boolean);
}

/** 从 Markdown 内容中拆出 frontmatter;无头部时返回空 meta + 原文 */
export function parseFrontmatter(content: string): { meta: FrontmatterMeta; body: string } {
  const meta: FrontmatterMeta = { ...EMPTY_FRONTMATTER };
  const match = content.match(FRONTMATTER_RE);
  if (!match) return { meta, body: content };

  const lines = match[1].split(/\r?\n/);
  let currentKey = '';

  for (const line of lines) {
    // 短横线列表项(仅用于 tags)
    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey === 'tags') {
      const tag = unquote(listItem[1]);
      if (tag) meta.tags.push(tag);
      continue;
    }

    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;

    const key = kv[1].toLowerCase();
    const value = kv[2] ?? '';
    currentKey = key;

    switch (key) {
      case 'title':
        meta.title = unquote(value);
        break;
      case 'published':
      case 'date':
        meta.published = unquote(value);
        break;
      case 'description':
        meta.description = unquote(value);
        break;
      case 'tags':
        meta.tags = value.trim() ? parseTagsValue(value) : [];
        break;
      case 'category':
        meta.category = unquote(value);
        break;
      case 'subcategory':
      case 'sub_category':
      case 'secondary_category':
        meta.subcategory = unquote(value);
        break;
      case 'pinned':
        meta.pinned = /^true$/i.test(value.trim());
        break;
      case 'encrypted':
        meta.encrypted = /^true$/i.test(value.trim());
        break;
      default:
        break;
    }
  }

  return { meta, body: content.slice(match[0].length) };
}

/** 序列化 frontmatter 并拼接到正文前 */
export function serializeFrontmatter(meta: FrontmatterMeta, body: string): string {
  const esc = (s: string) => s.replace(/"/g, '\\"');
  const lines = ['---'];
  if (meta.title) lines.push(`title: ${meta.title}`);
  if (meta.published) lines.push(`published: ${meta.published}`);
  if (meta.description) lines.push(`description: ${meta.description}`);
  if (meta.tags.length > 0) {
    lines.push(`tags: [${meta.tags.map((t) => `"${esc(t)}"`).join(', ')}]`);
  }
  if (meta.category) lines.push(`category: "${esc(meta.category)}"`);
  if (meta.subcategory) lines.push(`subcategory: "${esc(meta.subcategory)}"`);
  lines.push(`pinned: ${meta.pinned}`);
  lines.push(`encrypted: ${meta.encrypted}`);
  lines.push('---', '');

  return lines.join('\n') + body.replace(/^\s+/, '');
}
