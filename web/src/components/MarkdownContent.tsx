'use client'

import React, { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSlug from 'rehype-slug'
import type { Components } from 'react-markdown'
import { logger } from '@/lib/logger'
import { getHeadingIdFromNode, slugifyHeading } from '@/lib/heading-slug'

// 标题左侧主题色竖条（与文章页 H1 一致）
const headingBar =
  "before:mt-[0.3em] before:h-[0.85em] before:w-[2px] before:shrink-0 before:rounded-full before:bg-[var(--theme-primary-500)] before:content-['']"

interface MarkdownContentProps {
  /**
   * 历史上的 html prop 曾经由 dangerouslySetInnerHTML 直插渲染，
   * 属于存储型 XSS 通道，已移除——内容一律走 ReactMarkdown 安全渲染。
   */
  content?: string
  /** 手机端阅读器排版（更小字号、更紧行距） */
  mobileReader?: boolean
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: React.ReactNode } }).props
    return extractText(props?.children)
  }
  return ''
}

function createHeadingComponent(
  Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  level: number,
  className: string,
  nextFallbackIndex: () => number,
) {
  function HeadingComponent({
    node,
    children,
  }: {
    node?: { properties?: { id?: unknown } }
    children?: React.ReactNode
  }) {
    const text = extractText(children)
    const id =
      getHeadingIdFromNode(node) ||
      slugifyHeading(text) ||
      `heading-${level}-${nextFallbackIndex()}`

    return (
      <Tag id={id} className={className}>
        {children || ''}
      </Tag>
    )
  }

  HeadingComponent.displayName = `Markdown${Tag}`
  return HeadingComponent
}

function createMarkdownComponents(nextFallbackIndex: () => number): Partial<Components> {
  return {
    h1: createHeadingComponent(
      'h1',
      1,
      `scroll-mt-16 flex items-start gap-3 border-b-2 border-[var(--theme-card-border)] pb-2 text-xl font-bold text-gray-900 dark:text-white max-md:mt-4 max-md:mb-3 first:mt-0 sm:scroll-mt-24 sm:pb-3 sm:text-2xl md:mt-8 md:mb-6 md:text-4xl ${headingBar}`,
      nextFallbackIndex,
    ),
    h2: createHeadingComponent(
      'h2',
      2,
      `scroll-mt-16 flex items-start gap-2.5 border-b border-[var(--theme-card-border)] pb-1.5 text-lg font-bold text-gray-900 dark:text-white max-md:mt-3 max-md:mb-2 first:mt-0 sm:scroll-mt-24 sm:pb-2 sm:text-xl md:mt-6 md:mb-4 md:text-3xl ${headingBar}`,
      nextFallbackIndex,
    ),
    h3: createHeadingComponent(
      'h3',
      3,
      `scroll-mt-16 flex items-start gap-2 text-base font-semibold text-gray-900 max-md:mb-2 max-md:mt-3 first:mt-0 dark:text-white sm:scroll-mt-24 sm:mb-3 sm:mt-5 sm:text-xl before:mt-[0.5em] before:h-[0.42em] before:w-[0.42em] before:shrink-0 before:rounded-full before:bg-[var(--theme-primary-400)] before:content-['']`,
      nextFallbackIndex,
    ),
    h4: createHeadingComponent(
      'h4',
      4,
      'text-xl font-semibold mb-2 mt-4 text-gray-800 dark:text-gray-200 scroll-mt-24',
      nextFallbackIndex,
    ),
    h5: createHeadingComponent(
      'h5',
      5,
      'text-lg font-semibold mb-2 mt-3 text-gray-800 dark:text-gray-200 scroll-mt-24',
      nextFallbackIndex,
    ),
    h6: createHeadingComponent(
      'h6',
      6,
      'text-base font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-300 scroll-mt-24',
      nextFallbackIndex,
    ),

    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-md:mb-2 sm:mb-4 sm:text-base sm:leading-7">
        {children || ''}
      </p>
    ),

    a: ({ href, children }) => (
      <a
        href={href || '#'}
        className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 underline underline-offset-2 transition-colors"
        target={href && href.startsWith('http') ? '_blank' : undefined}
        rel={href && href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100">{children || ''}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-800 dark:text-gray-200">{children || ''}</em>
    ),

    code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
      const isInline = !className
      return isInline ? (
        <code
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-pink-600 dark:bg-gray-800 dark:text-pink-400 sm:px-1.5 sm:text-sm"
          {...props}
        >
          {children || ''}
        </code>
      ) : (
        <code className={className || ''} {...props}>
          {children || ''}
        </code>
      )
    },

    pre: ({ children }) => (
      <pre className="mb-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-[11px] leading-snug dark:border-gray-700 dark:bg-gray-950 max-md:mb-2 sm:mb-6 sm:p-4 sm:text-sm">
        {children || ''}
      </pre>
    ),

    blockquote: ({ children }) => (
      <blockquote className="my-2 rounded-r border-l-4 border-pink-500 bg-gray-50 py-1.5 pl-3 text-xs italic text-gray-600 dark:border-pink-400 dark:bg-gray-900/50 dark:text-gray-400 sm:my-4 sm:py-2 sm:pl-4 sm:text-sm">
        {children || ''}
      </blockquote>
    ),

    ul: ({ children }) => (
      <ul className="mb-3 ml-3 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300 max-md:mb-2 sm:mb-4 sm:ml-4 sm:space-y-2">
        {children || ''}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-3 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300 max-md:mb-2 sm:mb-4 sm:ml-4 sm:space-y-2">
        {children || ''}
      </ol>
    ),
    li: ({ children }) => (
      <li className="my-0.5 leading-relaxed sm:my-1.5 sm:leading-7">{children || ''}</li>
    ),

    hr: () => <hr className="my-8 border-0 border-t-2 border-gray-200 dark:border-gray-700" />,

    table: ({ children }) => (
      <div className="my-3 overflow-x-auto max-md:my-2 sm:my-6">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
          {children || ''}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800">{children || ''}</thead>,
    tbody: ({ children }) => <tbody>{children || ''}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-gray-200 dark:border-gray-700">{children || ''}</tr>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
        {children || ''}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">
        {children || ''}
      </td>
    ),

    img: ({ src, alt }) => (
      <img
        src={src || ''}
        alt={alt || ''}
        className="rounded-lg my-6 max-w-full h-auto shadow-lg"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
    ),
  }
}

export default function MarkdownContent({ content, mobileReader = false }: MarkdownContentProps) {
  const readerClass = mobileReader ? 'mobile-reader' : ''
  const fallbackIndexRef = useRef(0)
  fallbackIndexRef.current = 0

  const components = useMemo(
    () => createMarkdownComponents(() => ++fallbackIndexRef.current),
    [],
  )

  if (content) {
    try {
      return (
        <div className={`markdown-content ${readerClass}`.trim()}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeSlug]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    } catch (error) {
      logger.error('Error rendering markdown:', error)
      return (
        <div className="text-red-500 dark:text-red-400">
          <p>渲染 Markdown 时出错，请检查内容格式。</p>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">{String(error)}</pre>
        </div>
      )
    }
  }

  return <p className="text-gray-500 dark:text-gray-400">暂无内容</p>
}
