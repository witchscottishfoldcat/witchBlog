'use client'

import { useEffect, useRef, useState } from 'react'
import type { SeasonVariant } from '@/lib/solar-term'

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  speedX: number
  speedY: number
  size: number
  opacity: number
  rotationSpeed: number
  amplitude: number
  frequency: number
  colorIndex: number
}

interface SakuraFallsProps {
  enabled?: boolean
  petalCount?: number
  variant?: SeasonVariant
}

const SEASON_COLORS: Record<SeasonVariant, string[]> = {
  spring: ['#ffb7c5', '#ffc0cb', '#ffd4e0', '#ffaec9', '#ff9ec0', '#ff85b3'],
  summer: ['#7dd87d', '#90e090', '#a8e6a8', '#6bc96b', '#5dd95d', '#b8f0b8'],
  autumn: ['#c45c26', '#d47848', '#e09870', '#8b4513', '#a0522d', '#cd853f'],
  winter: ['#ffffff', '#f0f8ff', '#e6f4fa', '#f5faff', '#e0f0ff', '#fafcff'],
}

export default function SakuraFalls({
  enabled = true,
  petalCount = 30,
  variant = 'winter',
}: SakuraFallsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])
  const [mounted, setMounted] = useState(false)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!enabled || !mounted || !canvasRef.current || isInitializedRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    isInitializedRef.current = true
    const colors = SEASON_COLORS[variant]

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const baseParticle = (i: number): Partial<Particle> => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height - height,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      amplitude: Math.random() * 30 + 10,
      frequency: Math.random() * 0.02 + 0.01,
      colorIndex: i % colors.length,
    })

    if (variant === 'spring') {
      particlesRef.current = Array.from({ length: petalCount }, (_, i) => ({
        ...baseParticle(i),
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: Math.random() * 1.2 + 0.8,
        size: Math.random() * 10 + 8,
        opacity: Math.random() * 0.3 + 0.5,
      })) as Particle[]
    } else if (variant === 'summer') {
      particlesRef.current = Array.from({ length: petalCount }, (_, i) => ({
        ...baseParticle(i),
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: Math.random() * 0.8 + 0.4,
        size: Math.random() * 6 + 4,
        opacity: Math.random() * 0.4 + 0.5,
      })) as Particle[]
    } else if (variant === 'autumn') {
      particlesRef.current = Array.from({ length: petalCount }, (_, i) => ({
        ...baseParticle(i),
        speedX: (Math.random() - 0.5) * 1.2,
        speedY: Math.random() * 1.8 + 1,
        size: Math.random() * 12 + 10,
        opacity: Math.random() * 0.4 + 0.5,
      })) as Particle[]
    } else {
      particlesRef.current = Array.from({ length: petalCount }, (_, i) => ({
        ...baseParticle(i),
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 1.5 + 1,
        size: Math.random() * 8 + 4,
        opacity: Math.random() * 0.4 + 0.6,
      })) as Particle[]
    }

    // 樱花：五瓣带缺口，渐变+细描边+中心小圆
    const drawSpringPetal = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      const r = p.size / 2
      const color = colors[p.colorIndex]
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2)
      grad.addColorStop(0, 'rgba(255,255,255,0.35)')
      grad.addColorStop(0.6, color)
      grad.addColorStop(1, color)
      ctx.fillStyle = grad
      ctx.strokeStyle = color
      ctx.lineWidth = 0.6
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r * 0.7
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,230,240,0.9)'
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // 夏叶：椭圆带叶尖，中心浅绿渐变，细叶脉
    const drawSummerLeaf = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      const w = p.size * 0.9
      const h = p.size * 1.5
      const color = colors[p.colorIndex]
      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0)
      grad.addColorStop(0, 'rgba(255,255,255,0.25)')
      grad.addColorStop(0.5, color)
      grad.addColorStop(1, 'rgba(255,255,255,0.2)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 0.5
      ctx.globalAlpha = p.opacity * 0.7
      ctx.beginPath()
      ctx.moveTo(0, -h / 2 + 2)
      ctx.lineTo(0, h / 2 - 2)
      ctx.stroke()
      ctx.restore()
    }

    // 秋叶：宽椭圆 + 橙黄红渐变，主脉与侧脉
    const drawAutumnLeaf = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      const w = p.size * 1.1
      const h = p.size * 1.25
      const color = colors[p.colorIndex]
      const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
      grad.addColorStop(0, color)
      grad.addColorStop(0.45, 'rgba(255,210,160,0.95)')
      grad.addColorStop(1, color)
      ctx.fillStyle = grad
      ctx.strokeStyle = 'rgba(101,67,33,0.45)'
      ctx.lineWidth = 0.7
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.strokeStyle = 'rgba(80,50,25,0.55)'
      ctx.lineWidth = 0.55
      ctx.beginPath()
      ctx.moveTo(0, -h / 2 + 1)
      ctx.lineTo(0, h / 2 - 1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-w / 5, -h / 4)
      ctx.lineTo(-w / 2.2, -h / 5)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(w / 5, -h / 4)
      ctx.lineTo(w / 2.2, -h / 5)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-w / 6, h / 6)
      ctx.lineTo(-w / 2.5, h / 3)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(w / 6, h / 6)
      ctx.lineTo(w / 2.5, h / 3)
      ctx.stroke()
      ctx.restore()
    }

    // 雪花：六角晶枝 + 背后柔光层 + 圆润端点
    const drawSnowflake = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      const color = colors[p.colorIndex]
      const radius = p.size / 2
      const glowR = radius * 1.8
      ctx.globalAlpha = p.opacity * 0.25
      const gradGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR)
      gradGlow.addColorStop(0, color)
      gradGlow.addColorStop(0.4, color)
      gradGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = gradGlow
      ctx.beginPath()
      ctx.arc(0, 0, glowR, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = p.opacity
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 1.1
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(cos * radius, sin * radius)
        ctx.stroke()
        const branchLength = radius * 0.48
        const branchPos = radius * 0.72
        ctx.beginPath()
        ctx.moveTo(cos * branchPos, sin * branchPos)
        ctx.lineTo(
          cos * branchPos + Math.cos(angle + Math.PI / 3) * branchLength,
          sin * branchPos + Math.sin(angle + Math.PI / 3) * branchLength
        )
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cos * branchPos, sin * branchPos)
        ctx.lineTo(
          cos * branchPos + Math.cos(angle - Math.PI / 3) * branchLength,
          sin * branchPos + Math.sin(angle - Math.PI / 3) * branchLength
        )
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const drawParticle = (p: Particle) => {
      if (variant === 'spring') drawSpringPetal(p)
      else if (variant === 'summer') drawSummerLeaf(p)
      else if (variant === 'autumn') drawAutumnLeaf(p)
      else drawSnowflake(p)
    }

    const animate = () => {
      animationFrameRef.current = undefined
      if (!ctx || document.hidden) return
      if (document.documentElement.dataset.heroEntranceActive === 'true') {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }
      ctx.clearRect(0, 0, width, height)

      particlesRef.current.forEach((p) => {
        p.x += p.speedX + Math.sin(p.y * p.frequency) * p.amplitude * 0.01
        p.y += p.speedY
        p.rotation += p.rotationSpeed

        if (p.y > height + 50) {
          p.y = -50
          p.x = Math.random() * width
        }
        if (p.x < -50) p.x = width + 50
        else if (p.x > width + 50) p.x = -50

        drawParticle(p)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && !animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      isInitializedRef.current = false
    }
  }, [enabled, mounted, petalCount, variant])

  if (!enabled || !mounted) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        zIndex: 11,
        opacity: 1,
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  )
}
