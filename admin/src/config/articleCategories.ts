export interface ArticleCategoryOption {
  label: string;
  children: string[];
}

/** 常用分类建议。编辑器仍允许输入自定义分类，避免限制已有内容。 */
export const ARTICLE_CATEGORY_OPTIONS: ArticleCategoryOption[] = [
  { label: '技术', children: ['前端开发', '后端开发', '人工智能', '数据库', 'DevOps', '系统运维', '软件架构', '开发工具'] },
  { label: '学习', children: ['教程', '学习笔记', '经验总结', '面试'] },
  { label: '项目', children: ['项目记录', '开源项目', '产品设计'] },
  { label: '生活', children: ['随笔', '日常', '旅行', '摄影'] },
  { label: '其他', children: ['资讯', '资源分享', '未分类'] },
];

export function getSecondaryCategoryOptions(primaryCategory: string): string[] {
  return ARTICLE_CATEGORY_OPTIONS.find((item) => item.label === primaryCategory.trim())?.children ?? [];
}
