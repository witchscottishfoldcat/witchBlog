'use client'

import { useEffect, useRef, useState } from 'react'

const TYPE_SPEED_MS = 120 // 打字速度（每字符）
const DELETE_SPEED_MS = 60 // 删除速度（每字符，通常快于打字）
const HOLD_MS = 2000 // 打完整段后停留时长，然后开始倒退删除

interface TypewriterTextProps {
  text: string
  className?: string
}

/**
 * 打字机循环效果：逐字打出 → 停留 → 逐字删除 → 重新打出（无限循环）。
 * - text 变化（如切换语言）时从新文本重新开始
 * - prefers-reduced-motion 时直接显示全文，不渲染光标
 */
export default function TypewriterText({ text, className }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [instant, setInstant] = useState(false) // reduced-motion：直接显示全文
  const timerRef = useRef<number | null>(null)
  const holdRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !text) return
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (holdRef.current) window.clearTimeout(holdRef.current)
    setDisplayed('')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInstant(true)
      setDisplayed(text)
      return
    }

    setInstant(false)
    let i = 0
    let deleting = false

    const tick = () => {
      if (!deleting) {
        i += 1
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          // 打完整段：停一下，然后倒退删除
          if (timerRef.current) window.clearInterval(timerRef.current)
          holdRef.current = window.setTimeout(() => {
            deleting = true
            timerRef.current = window.setInterval(tick, DELETE_SPEED_MS)
          }, HOLD_MS)
        }
      } else {
        i -= 1
        setDisplayed(text.slice(0, i))
        if (i <= 0) {
          // 删空：立即重新打字
          deleting = false
          if (timerRef.current) window.clearInterval(timerRef.current)
          timerRef.current = window.setInterval(tick, TYPE_SPEED_MS)
        }
      }
    }

    timerRef.current = window.setInterval(tick, TYPE_SPEED_MS)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (holdRef.current) window.clearTimeout(holdRef.current)
    }
  }, [text])

  return (
    <span className={className}>
      {displayed}
      {!instant && <span className="typewriter-caret" aria-hidden="true" />}
    </span>
  )
}
