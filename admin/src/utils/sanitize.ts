import DOMPurify from 'dompurify';

/**
 * HTML 净化工具
 *
 * 所有把后端数据 / 剪贴板 / 拖拽内容写入 innerHTML 的位置都必须先经过这里的
 * 白名单净化，否则一旦入库数据被污染（API 被攻破、token 泄露、后端校验缺失），
 * 恶意脚本将在管理员浏览器中执行（存储型 XSS），并可冒用当前登录会话执行管理操作。
 */

// 日记富文本编辑器白名单：仅基础文本结构标签 + 图片
const EDITOR_ALLOWED_TAGS = [
  'div', 'p', 'br', 'span',
  'b', 'strong', 'i', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a',
  'img',
];

// 图片拖拽/上传逻辑依赖 src/alt/style/draggable/contenteditable
const EDITOR_ALLOWED_ATTR = [
  'src', 'alt', 'href', 'title',
  'style', 'draggable', 'contenteditable',
];

/**
 * 净化编辑器 HTML（日记内容加载、粘贴、拖拽）
 * 事件属性（onerror 等）、script、内联事件一律剥离
 */
export function sanitizeEditorHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: EDITOR_ALLOWED_TAGS,
    ALLOWED_ATTR: EDITOR_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * 净化音乐外链播放器 HTML：只保留 iframe 嵌入，
 * 且 src 必须是 http(s) 绝对地址（阻止 javascript: 等协议）
 */
export function sanitizeIframeEmbed(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['iframe'],
    ALLOWED_ATTR: [
      'src', 'width', 'height', 'frameborder',
      'allow', 'allowfullscreen', 'scrolling', 'title', 'style',
    ],
    ALLOW_DATA_ATTR: false,
    // 严格 URI 正则只应作用于 src；DOMPurify 会拿所有非 URI 安全属性的值
    // 去匹配正则，需把尺寸/展示类属性标记为 URI 安全，否则会被误删
    ADD_URI_SAFE_ATTR: [
      'width', 'height', 'frameborder',
      'allow', 'allowfullscreen', 'scrolling', 'title', 'style',
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:)?\/\//i,
    // 非 iframe 标签连内容一起剥离（该字段只应是纯 iframe 嵌入代码）
    KEEP_CONTENT: false,
  });
}
