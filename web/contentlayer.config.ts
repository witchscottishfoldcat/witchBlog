import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/*.md`,
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    description: { type: 'string', required: false },
    author: { type: 'string', required: false, default: '匿名' },
    category: { type: 'string', required: false },
    subcategory: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false, default: [] },
    encrypted: { type: 'boolean', required: false, default: false },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, ''),
    },
  },
}))

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post],
  disableImportAliasWarning: true, // 新增：禁用警告
})
