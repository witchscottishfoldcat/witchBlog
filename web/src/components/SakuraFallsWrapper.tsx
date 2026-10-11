'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { SAKURA_FALLS_CHANGED_EVENT } from './SakuraToggle'
import { getCurrentSeason } from '@/lib/solar-term'

const SakuraFalls = dynamic(() => import('@/components/SakuraFalls'), {
  ssr: false,
  loading: () => null,
})

interface SakuraFallsWrapperProps {
  petalCount?: number
}

export default function SakuraFallsWrapper({
  petalCount = 25,
}: SakuraFallsWrapperProps) {
  const [enabled, setEnabled] = useState(false)
  const [season, setSeason] = useState<ReturnType<typeof getCurrentSeason>>('winter')

  useEffect(() => {
    const saved = localStorage.getItem('sakura-falls-enabled')
    if (saved !== null) {
      setEnabled(saved === 'true')
    } else {
      setEnabled(false)
    }
    setSeason(getCurrentSeason())
  }, [])

  useEffect(() => {
    const syncFromStorage = () => {
      const saved = localStorage.getItem('sakura-falls-enabled')
      setEnabled(saved === 'true')
    }
    window.addEventListener(SAKURA_FALLS_CHANGED_EVENT, syncFromStorage)
    return () => window.removeEventListener(SAKURA_FALLS_CHANGED_EVENT, syncFromStorage)
  }, [])

  return <SakuraFalls enabled={enabled} petalCount={petalCount} variant={season} />
}

