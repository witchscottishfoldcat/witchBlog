'use client'

/**
 * 看板娘 Live2D 看板娘组件（Cubism 4 / .model3.json）
 *
 * === 1. 核心依赖（缺一不可）===
 * - PixiJS (pixi.js)：画布渲染
 * - pixi-live2d-display (cubism4)：模型加载与驱动
 * - Cubism 5 运行时：live2dcubismcore.min.js（本地 /scripts 加载，见下方第 3 节）
 *   不使用旧版 live2d.min.js / lappdelegate.js（仅适用于 Cubism 2）
 *
 * === 2. 模型资源与路径 ===
 * - 入口：MODEL_URL 指向 .model3.json，库会按其中相对路径加载 moc3、贴图、物理等
 * - 资源目录约定：所有文件需在 同一目录 下，例如：
 *     public/live2d/sherry/
 *       ├── Sherry - Model.model3.json   ← 入口
 *       ├── Sherry - Model.moc3
 *       ├── Sherry - Model.physics3.json
 *       └── Sherry - Model.4096/
 *           ├── texture_00.png
 *           └── texture_01.png
 * - 若模型放其他路径，只需改 MODEL_URL 为对应 .model3.json 的 URL（相对 public）
 *
 * === 3. Cubism 核心本地部署 ===
 * 只加载仓库内的 /scripts/live2dcubismcore.min.js：
 * CSP 的 script-src 仅放行同源脚本，官方 CDN 会被拦截，走 CDN 必然失败。
 * 模型是 moc3 v5，必须配 Cubism 5 Core（Cubism 4 Core 解析会抛 "Unknown error"）。
 */

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Icon } from '@iconify/react'
import type { Container } from 'pixi.js'
import type { Cubism4InternalModel, Live2DModel } from 'pixi-live2d-display/cubism4'

/** 模型入口：.model3.json 的 URL（相对 public，与 moc3/贴图同目录） */
const MODEL_URL = '/live2d/sherry/Sherry%20-%20Model.model3.json'
/** Cubism 5 运行时：随仓库提交的本地副本，版本必须支持模型的 moc3 v5 */
const CUBISM_CORE_LOCAL = '/scripts/live2dcubismcore.min.js'
/** 窗口内可见的身体比例（上半身，其余由 overflow 在底部裁掉） */
const UPPER_BODY_RATIO = 0.52
/** 略小于 1，避免头顶贴边被裁 */
const FIT_INSET = 0.92

export default function Live2DViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [coreReady, setCoreReady] = useState(false)
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAppeared, setHasAppeared] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const appRef = useRef<{
    destroy: (opt?: boolean, options?: { children?: boolean }) => void
    renderer: {
      resize: (w: number, h: number) => void
    }
    screen: { width: number; height: number }
  } | null>(null)
  const modelRef = useRef<Live2DModel | null>(null)
  const holderRef = useRef<Container | null>(null)
  const layoutInProgressRef = useRef(false)
  const layoutFrameRef = useRef<number | null>(null)
  const settleFrameRef = useRef<number | null>(null)

  const measureBounds = { x: 0, y: 0, width: 0, height: 0 }

  /** 合并所有 Drawable 顶点范围（layout 框常会裁掉头发/裙摆） */
  const getVisualBounds = (model: Live2DModel) => {
    const im = model.internalModel as Cubism4InternalModel
    im.update(16, performance.now())
    model.update(16)

    let left = Infinity
    let right = -Infinity
    let top = Infinity
    let bottom = -Infinity
    const count = im.coreModel.getDrawableCount()

    for (let i = 0; i < count; i++) {
      im.getDrawableBounds(i, measureBounds)
      if (measureBounds.width <= 0 || measureBounds.height <= 0) continue
      left = Math.min(left, measureBounds.x)
      right = Math.max(right, measureBounds.x + measureBounds.width)
      top = Math.min(top, measureBounds.y)
      bottom = Math.max(bottom, measureBounds.y + measureBounds.height)
    }

    const boxW = im.width > 0 ? im.width : im.originalWidth
    const boxH = im.height > 0 ? im.height : im.originalHeight

    if (Number.isFinite(left)) {
      const x = Math.min(left, 0)
      const y = Math.min(top, 0)
      return {
        x,
        y,
        width: Math.max(right, boxW) - x,
        height: Math.max(bottom, boxH) - y,
      }
    }

    return { x: 0, y: 0, width: boxW, height: boxH }
  }

  /** 将 Pixi screen 与 DOM 容器对齐（逻辑像素，与 model.x/y 同一坐标系） */
  const syncStageSize = (container: HTMLDivElement) => {
    const app = appRef.current
    if (!app) return { w: 1, h: 1 }

    const w = Math.max(container.clientWidth, 1)
    const h = Math.max(container.clientHeight, 1)
    if (app.screen.width !== w || app.screen.height !== h) {
      app.renderer.resize(w, h)
    }
    return { w: app.screen.width, h: app.screen.height }
  }

  /**
   * 贴底只露上半身：裁剪线在角色约 52% 身高处对齐窗口底边，下半身藏在 overflow 外。
   */
  const layoutModel = (container: HTMLDivElement) => {
    const model = modelRef.current
    const holder = holderRef.current
    if (!model || !holder || !appRef.current || layoutInProgressRef.current) return

    layoutInProgressRef.current = true
    try {
      const { w, h } = syncStageSize(container)
      if (w < 24 || h < 24) return

      const padX = 8
      const padTop = 6
      const bounds = getVisualBounds(model)
      if (bounds.width <= 0 || bounds.height <= 0) return

      const visibleHeight = bounds.height * UPPER_BODY_RATIO
      const scale =
        Math.min((w - padX * 2) / bounds.width, (h - padTop) / visibleHeight) *
        FIT_INSET

      model.anchor.set(0, 0)
      model.scale.set(1, 1)
      model.x = -(bounds.x + bounds.width / 2)
      model.y = -(bounds.y + visibleHeight)

      holder.scale.set(scale)
      holder.position.set(w / 2, h)
    } finally {
      layoutInProgressRef.current = false
    }
  }

  const scheduleLayout = (container: HTMLDivElement) => {
    if (layoutFrameRef.current !== null) cancelAnimationFrame(layoutFrameRef.current)
    if (settleFrameRef.current !== null) cancelAnimationFrame(settleFrameRef.current)

    layoutFrameRef.current = requestAnimationFrame(() => {
      layoutFrameRef.current = null
      layoutModel(container)
      settleFrameRef.current = requestAnimationFrame(() => {
        settleFrameRef.current = null
        layoutModel(container)
      })
    })
  }

  /* eslint-disable react-hooks/exhaustive-deps -- Live2D init runs once when core becomes ready */
  useEffect(() => {
    if (!coreReady || !containerRef.current) return

    let mounted = true
    let resizeObserver: ResizeObserver | null = null
    let onResize: (() => void) | null = null

    const init = async () => {
      try {
        const PIXI = await import('pixi.js')
        // 生产环境 CSP 不放行 unsafe-eval，PixiJS 6 内部用 new Function 生成
        // uniform 同步代码会抛错；用官方 shim 替换该实现
        const { install: installUnsafeEvalShim } = await import('@pixi/unsafe-eval')
        installUnsafeEvalShim(PIXI)
        const { Live2DModel } = await import('pixi-live2d-display/cubism4')

        if (typeof window !== 'undefined') (window as unknown as { PIXI: unknown }).PIXI = PIXI

        const { Application } = PIXI
        const container = containerRef.current
        if (!container) return undefined
        const widget = container.parentElement
        const width = Math.max(widget?.clientWidth || container.clientWidth || 120, 96)
        const height = Math.max(widget?.clientHeight || container.clientHeight || 200, 96)

        const app = new Application({
          backgroundAlpha: 0,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          antialias: true,
          width,
          height,
        })
        app.renderer.resize(width, height)
        appRef.current = app as typeof appRef.current

        if (!mounted || !container) return undefined
        container.innerHTML = ''
        container.appendChild(app.view)
        const view = app.view as HTMLCanvasElement
        view.style.display = 'block'
        view.style.width = '100%'
        view.style.height = '100%'

        console.log('[Live2D] Loading model from:', MODEL_URL)

        // 验证贴图文件是否存在（预检查）
        const modelDir = MODEL_URL.substring(0, MODEL_URL.lastIndexOf('/'))
        const texturePaths = [
          `${modelDir}/Sherry%20-%20Model.2048/texture_00.png`,
          `${modelDir}/Sherry%20-%20Model.2048/texture_01.png`
        ]
        
        console.log('[Live2D] Checking texture files:', texturePaths)
        for (const texturePath of texturePaths) {
          try {
            const response = await fetch(texturePath, { method: 'HEAD' })
            if (!response.ok) {
              console.warn(`[Live2D] Texture file may not exist: ${texturePath}`)
            } else {
              console.log(`[Live2D] Texture file found: ${texturePath}`)
            }
          } catch (err) {
            console.warn(`[Live2D] Failed to check texture: ${texturePath}`, err)
          }
        }

        // 监听资源加载错误
        const handleResourceError = (error: Error) => {
          console.error('[Live2D] Resource loading error:', error)
          if (mounted) {
            setError(`贴图加载失败: ${error.message}`)
          }
        }

        // 尝试加载模型
        let model
        try {
          model = await Live2DModel.from(MODEL_URL, { 
            autoInteract: true,
          })
          
          // 等待一下确保纹理加载完成
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // 监听模型的纹理加载错误
          if (model.textures) {
            const textureKeys = Object.keys(model.textures)
            console.log('[Live2D] Loaded textures:', textureKeys)
            Object.values(model.textures).forEach((texture: unknown, index) => {
              const pixiTexture = texture as {
                baseTexture?: { on: (event: string, handler: (err: Error) => void) => void }
              }
              if (pixiTexture.baseTexture) {
                pixiTexture.baseTexture.on('error', (err: Error) => {
                  console.error(`[Live2D] Texture ${textureKeys[index]} error:`, err)
                  handleResourceError(err)
                })
                pixiTexture.baseTexture.on('loaded', () => {
                  console.log(`[Live2D] Texture ${textureKeys[index]} loaded successfully`)
                })
              }
            })
          } else {
            console.warn('[Live2D] No textures found on model')
          }
        } catch (loadError) {
          console.error('[Live2D] Model loading error:', loadError)
          throw loadError
        }
        
        if (!mounted || !container) return undefined

        console.log('[Live2D] Model loaded successfully')
        const visualBounds = getVisualBounds(model)
        console.log('[Live2D] Visual bounds:', visualBounds)
        console.log('[Live2D] Model textures:', model.textures ? Object.keys(model.textures).length : 0)

        const holder = new PIXI.Container()
        holder.addChild(model)
        app.stage.addChild(holder)
        holderRef.current = holder
        modelRef.current = model

        onResize = () => {
          const el = containerRef.current
          if (el && modelRef.current) scheduleLayout(el)
        }

        scheduleLayout(container)
        setTimeout(() => onResize?.(), 150)
        setTimeout(() => onResize?.(), 500)

        console.log('[Live2D] Model initialized:', {
          visualBounds,
          stageSize: syncStageSize(container),
          position: { x: model.x, y: model.y },
          scale: model.scale,
        })

        if (mounted) {
          // 模型就绪后，延迟触发出现动画，让用户能感知到入场效果
          setTimeout(() => setHasAppeared(true), 100)
        }

        // DOM 尺寸是唯一的布局来源。不要监听 renderer 自身的 resize，
        // 否则 renderer.resize() 会同步触发 onResize 并形成递归闭环。
        resizeObserver = new ResizeObserver(onResize)
        if (widget) resizeObserver.observe(widget)
        resizeObserver.observe(container)

        let dragging = false
        let startX = 0, startY = 0, startModelX = 0, startModelY = 0

        const getPointerPosition = (e: { global?: { x: number; y: number }; globalX?: number; globalY?: number; clientX?: number; clientY?: number }) => {
          const x = e.global?.x ?? (e as { globalX?: number }).globalX ?? e.clientX ?? 0
          const y = e.global?.y ?? (e as { globalY?: number }).globalY ?? e.clientY ?? 0
          return { x, y }
        }

        const onPointerDown = (e: unknown) => {
          const pos = getPointerPosition(e as Parameters<typeof getPointerPosition>[0])
          dragging = true
          startX = pos.x
          startY = pos.y
          startModelX = holder.x
          startModelY = holder.y
        }
        const onPointerMove = (e: unknown) => {
          if (!dragging) return
          const pos = getPointerPosition(e as Parameters<typeof getPointerPosition>[0])
          holder.x = startModelX + (pos.x - startX)
          holder.y = startModelY + (pos.y - startY)
        }
        const onPointerUp = () => { dragging = false }
        ;(model as unknown as { eventMode: string }).eventMode = 'static'
        model.on('pointerdown', onPointerDown)
        ;(app.stage as unknown as { eventMode: string }).eventMode = 'static'
        app.stage.hitArea = app.screen
        app.stage.on('pointermove', onPointerMove)
        app.stage.on('pointerup', onPointerUp)
        app.stage.on('pointerupoutside', onPointerUp)
      } catch (err) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load Live2D'
          setError(msg.includes('404') || msg.includes('fetch') ? '看板娘模型未就绪，请执行: npm run copy:live2d' : msg)
        }
      }
    }

    void init()

    return () => {
      mounted = false
      resizeObserver?.disconnect()
      if (layoutFrameRef.current !== null) cancelAnimationFrame(layoutFrameRef.current)
      if (settleFrameRef.current !== null) cancelAnimationFrame(settleFrameRef.current)
      layoutFrameRef.current = null
      settleFrameRef.current = null
      layoutInProgressRef.current = false
      const app = appRef.current
      modelRef.current = null
      holderRef.current = null
      if (app?.destroy) app.destroy(true, { children: true })
      appRef.current = null
    }
  }, [coreReady])

  return (
    <>
      <Script
        src={CUBISM_CORE_LOCAL}
        strategy="lazyOnload"
        onLoad={() => setCoreReady(true)}
        onError={() => setError('Cubism 运行时加载失败，看板娘无法显示')}
      />
      <div
        className={
          `live2d-anchor fixed right-0 bottom-0 z-[9998] flex flex-col-reverse sm:flex-row items-end gap-1 sm:gap-2 ` +
          `${visible ? 'pointer-events-auto' : 'pointer-events-none'} ` +
          `${hasAppeared ? (visible ? 'live2d-appear-animated' : 'live2d-hide-animated') : 'opacity-0'}`
        }
      >
        {/* 外层仅负责尺寸；内层 canvas 容器不放任何 React 子节点，避免 innerHTML/appendChild 与 React 冲突 */}
        <div
          className="live2d-widget group/live2d relative flex items-center justify-center overflow-hidden rounded-tl-lg bg-transparent w-[min(92px,26vw)] h-[min(108px,18vh)] min-w-[84px] min-h-[96px] max-w-[min(104px,28vw)] max-h-[min(120px,22vh)] sm:w-[min(200px,22vw)] sm:h-[min(240px,32vh)] sm:min-w-[180px] sm:min-h-[220px] sm:max-w-[min(240px,28vw)] sm:max-h-[min(280px,38vh)]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
          {/* 悬停时头顶显示小按钮 */}
          <button
            type="button"
            onClick={() => setVisible(false)}
            className={`pointer-events-auto absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-black/40 p-1.5 text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 sm:top-2 sm:p-2 dark:bg-white/30 dark:text-black/90 dark:hover:bg-white/50 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
            title="隐藏看板娘"
          >
            <Icon icon="mdi:eye-off-outline" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
      {!visible && (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="live2d-anchor fixed right-4 bottom-0 z-[9998] rounded-full bg-black/30 px-3 py-1.5 text-xs text-white/90 hover:bg-black/50 dark:bg-white/20 dark:text-black/90"
          title="显示看板娘"
        >
          看板娘
        </button>
      )}
      {error && (
        <div className="fixed bottom-2 right-2 z-[9999] max-w-[200px] rounded bg-red-500/90 px-2 py-1 text-xs text-white">
          {error}
        </div>
      )}
    </>
  )
}
