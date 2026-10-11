'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { getImageUrl } from '@/lib/image-utils'
import { logger } from '@/lib/logger'
import type { AboutFile } from '@/lib/api'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface AboutFilesProps {
  files: AboutFile[]
  locale: string
}

// 判断是否是图片文件
function isImageFile(url: unknown): boolean {
  // 确保 url 是字符串类型
  if (typeof url !== 'string' || !url) {
    return false
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

// 统一图片 URL（OSS 相对化 / MinIO 代理）
function getProxyUrl(url: unknown): string {
  if (typeof url !== 'string' || !url) {
    return ''
  }
  return getImageUrl(url)
}


export default function AboutFiles({ files, locale }: AboutFilesProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const params = useParams()
  const currentLocale = (params?.locale as string) || locale
  const t = useTranslations('about')

  if (!files || files.length === 0) {
    return null
  }

  // 过滤有效文件
  const validFiles = files.filter(
    (file) => file && file.url && typeof file.url === 'string' && file.url.trim().length > 0
  )

  if (validFiles.length === 0) {
    return null
  }

  // 分离图片和文档
  const images = validFiles.filter((file) => isImageFile(file.url))
  const documents = validFiles.filter((file) => !isImageFile(file.url))

  return (
    <div className="space-y-8">
      {/* 图片展示 */}
      {images.length > 0 && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-pink-500 to-pink-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  📷 {t('images')}
            </h3>
            <span className="rounded-full bg-pink-50 px-3 py-1 text-xs text-pink-600 dark:bg-gray-800 dark:text-pink-300">
                  {images.length} {t('imagesCount')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((file) => {
              const proxyUrl = getProxyUrl(file.url)
              const isProxyUrl = proxyUrl.startsWith('/api/proxy-image')
              const hasError = imageErrors.has(file.id)

              return (
                <div
                  key={file.id}
                  className="group relative aspect-video overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  {!hasError ? (
                    isProxyUrl ? (
                      <img
                        src={proxyUrl}
                        alt={file.title || file.filename}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(file.id))
                          logger.error('Failed to load about image:', file.url)
                        }}
                      />
                    ) : (
                      <Image
                        src={proxyUrl}
                        alt={file.title || file.filename}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(file.id))
                          logger.error('Failed to load about image:', file.url)
                        }}
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <div className="text-center">
                        <Icon icon="mdi:image-off" className="mx-auto h-12 w-12 mb-2" />
                            <p className="text-xs">{t('loadFailed')}</p>
                      </div>
                    </div>
                  )}
                  {/* 标题遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-sm font-semibold text-white truncate">{file.title || file.filename}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 文档列表 */}
      {documents.length > 0 && (
        <div>
          {/* <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              📄 {t('documents')}
            </h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600 dark:bg-gray-800 dark:text-blue-300">
              {documents.length} {t('documentsCount')}
            </span>
          </div> */}
          <div className="space-y-3">
            {documents.map((file) => {
              // 根据文件扩展名选择图标
              const getFileIcon = (filename: string): string => {
                const lowerName = filename.toLowerCase()
                if (lowerName.endsWith('.pdf')) return 'mdi:file-pdf-box'
                if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return 'mdi:file-word-box'
                if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return 'mdi:file-excel-box'
                if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar')) return 'mdi:folder-zip'
                if (lowerName.endsWith('.txt')) return 'mdi:file-document-outline'
                if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) return 'mdi:language-markdown'
                return 'mdi:file-document'
              }

              return (
                <Link
                  key={file.id}
                  href={`/${currentLocale}/about/${file.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[var(--theme-primary-500)] hover:shadow-lg hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-primary-100)] to-[var(--theme-primary-200)] text-[var(--theme-primary-600)] shadow-sm transition-transform group-hover:scale-110">
                    <Icon icon={getFileIcon(file.filename)} className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-[var(--theme-primary-600)] transition-colors">
                      {file.frontmatterTitle || file.title || file.filename}
                    </p>
                  </div>
                  <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 transition-colors group-hover:bg-[var(--theme-primary-100)] dark:bg-gray-700 dark:group-hover:bg-gray-600">
                    <Icon icon="mdi:arrow-right" className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

