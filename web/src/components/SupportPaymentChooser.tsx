'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Icon } from '@iconify/react'

type PaymentMethod = {
  key: string
  name: string
  image: string
  icon: string
  accent: string
}

type SupportPaymentChooserProps = {
  methods: PaymentMethod[]
  variant: 'cards' | 'compact'
  scanLabel: string
  recommendedLabel: string
  viewQrLabel: string
  closeLabel: string
  qrAlt: string
  noteTitle: string
  note: string
}

export default function SupportPaymentChooser({
  methods,
  variant,
  scanLabel,
  recommendedLabel,
  viewQrLabel,
  closeLabel,
  qrAlt,
  noteTitle,
  note,
}: SupportPaymentChooserProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const selectedMethod = methods.find((method) => method.key === selectedKey)

  useEffect(() => {
    if (!selectedMethod) return

    const previousOverflow = document.body.style.overflow
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedKey(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      activeElement?.focus()
    }
  }, [selectedMethod])

  const modal = selectedMethod
    ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            aria-label={closeLabel}
            onClick={() => setSelectedKey(null)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`support-${selectedMethod.key}-title`}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:max-w-md sm:rounded-[28px] sm:p-6"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700 sm:hidden" />

            <header className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  color: selectedMethod.accent,
                  backgroundColor: `color-mix(in srgb, ${selectedMethod.accent} 12%, white)`,
                }}
              >
                <Icon icon={selectedMethod.icon} className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`support-${selectedMethod.key}-title`} className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedMethod.name}
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{scanLabel}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedKey(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-400)] dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label={closeLabel}
              >
                <Icon icon="mdi:close" className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <div className="mx-auto mt-5 w-full max-w-[330px] rounded-2xl border bg-white p-4 shadow-inner" style={{ borderColor: 'var(--theme-card-border)' }}>
              <Image
                src={selectedMethod.image}
                alt={`${selectedMethod.name}${qrAlt}`}
                width={870}
                height={870}
                sizes="(max-width: 640px) 82vw, 330px"
                className="h-auto w-full rounded-xl object-contain"
                priority
              />
            </div>

            <div
              className="mt-5 flex gap-3 rounded-2xl border p-3.5"
              style={{ backgroundColor: 'var(--theme-card-bg-80)', borderColor: 'var(--theme-card-border)' }}
            >
              <Icon icon="mdi:message-text-outline" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary-600)]" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{noteTitle}</p>
                <p className="mt-1 text-[11px] leading-5 text-gray-500 dark:text-gray-400">{note}</p>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )
    : null

  if (variant === 'compact') {
    return (
      <>
        <div className="space-y-2" aria-label={viewQrLabel}>
          {methods.map((method) => (
            <button
              key={method.key}
              type="button"
              onClick={() => setSelectedKey(method.key)}
              className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              style={{ borderColor: 'var(--theme-card-border)' }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  color: method.accent,
                  backgroundColor: `color-mix(in srgb, ${method.accent} 12%, var(--theme-card-bg))`,
                }}
              >
                <Icon icon={method.icon} className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-xs text-gray-800 dark:text-gray-200">{method.name}</strong>
                <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">{viewQrLabel}</span>
              </span>
              <Icon icon="mdi:chevron-right" className="h-4 w-4 text-gray-400" aria-hidden />
            </button>
          ))}
        </div>
        {modal}
      </>
    )
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {methods.map((method, index) => (
          <button
            key={method.key}
            type="button"
            onClick={() => setSelectedKey(method.key)}
            className="group rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[var(--theme-primary-300)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-400)] sm:rounded-3xl sm:p-5"
            style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  color: method.accent,
                  backgroundColor: `color-mix(in srgb, ${method.accent} 12%, var(--theme-card-bg))`,
                }}
              >
                <Icon icon={method.icon} className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="text-base text-gray-900 dark:text-gray-100">{method.name}</strong>
                  {index === 0 && (
                    <span className="rounded-full bg-[var(--theme-primary-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--theme-primary-700)]">
                      {recommendedLabel}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{scanLabel}</span>
              </span>
            </div>

            <span className="mt-6 flex items-center justify-between border-t pt-4 text-sm font-semibold text-[var(--theme-primary-600)]" style={{ borderColor: 'var(--theme-card-border)' }}>
              {viewQrLabel}
              <Icon icon="mdi:arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </button>
        ))}
      </div>
      {modal}
    </>
  )
}
