import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

export interface AICompletionResponse {
  provider: string;
  model: string;
  text: string;
}

export interface GeneratedMeta {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string;
  filename: string;
}

export const aiApi = {
  /** 文本补全(默认走 DeepSeek) */
  complete: (prompt: string, maxTokens = 200) =>
    axios
      .post<AICompletionResponse>(
        `${baseUrl}/api/v1/ai/completion`,
        {
          provider: 'deepseek',
          prompt,
          temperature: 0.3,
          max_tokens: maxTokens,
        },
        { headers: getHeaders() }
      )
      .then((r) => r.data),

  /** 根据文章标题与正文一键生成元数据:标题/描述/一级分类/二级分类/标签/文件名 */
  generateMeta: async (title: string, content: string): Promise<GeneratedMeta> => {
    const excerpt = content.replace(/\s+/g, ' ').slice(0, 2000);
    const prompt =
      `请为下面这篇博客文章生成元数据。\n` +
      `严格按以下格式输出六行,每行一个字段,不要输出任何其他内容、不要序号、不要引号:\n` +
      `标题: <不超过20个字的标题>\n` +
      `描述: <一到两句话的文章摘要>\n` +
      `一级分类: <宽泛分类,例如 技术、学习、项目、生活>\n` +
      `二级分类: <一级分类下的具体主题,例如 人工智能、教程、项目记录>\n` +
      `标签: <3到6个标签,用英文逗号分隔>\n` +
      `文件名: <英文小写 slug,单词用连字符连接,不要扩展名,例如 kimi-plan-guide>\n` +
      `文章标题:${title.trim() || '(待生成)'}\n正文节选:${excerpt}`;

    const res = await aiApi.complete(prompt, 300);
    return parseMetaText(res.text);
  },
};

/** 解析 AI 返回的「字段: 值」行文本 */
function parseMetaText(text: string): GeneratedMeta {
  const meta: GeneratedMeta = { title: '', description: '', category: '', subcategory: '', tags: '', filename: '' };
  const strip = (s: string) => s.replace(/["'“”‘’]/g, '').trim();

  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:[-*]\s*)?(标题|描述|分类|一级分类|二级分类|标签|文件名)\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const value = strip(m[2]);
    switch (m[1]) {
      case '标题':
        meta.title = value;
        break;
      case '描述':
        meta.description = value;
        break;
      case '分类':
      case '一级分类':
        meta.category = value;
        break;
      case '二级分类':
        meta.subcategory = value;
        break;
      case '标签':
        meta.tags = value
          .replace(/[，、]/g, ',')
          .split(',')
          .map((t) => t.replace(/^\s*\d+[.、)]?\s*/, '').trim())
          .filter(Boolean)
          .join(', ');
        break;
      case '文件名':
        meta.filename = sanitizeSlug(value);
        break;
      default:
        break;
    }
  }
  return meta;
}

/** 清洗为合法 slug:小写字母/数字/连字符,不含扩展名 */
function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\.(md|markdown)$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}
