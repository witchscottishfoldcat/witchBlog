/**
 * 主题初始化脚本
 * 在页面渲染前设置 CSS 变量，避免闪烁
 */
export function initTheme() {
  if (typeof window === 'undefined') return

  // 从 localStorage 读取保存的值
  const savedHue = localStorage.getItem('theme-hue')
  const savedTheme = localStorage.getItem('theme')
  
  // 默认值：使用 214（蓝色系）作为初始主题色
  const defaultHue = 214
  const hue = savedHue ? parseInt(savedHue, 10) : defaultHue
  
  // 检测系统主题偏好
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = savedTheme || (prefersDark ? 'dark' : 'light')
  
  // 设置 --hue 变量
  document.documentElement.style.setProperty('--hue', hue.toString())
  
  // 设置主题类
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  
  // 更新 --page-bg 变量
  updatePageBg(hue, theme === 'dark')
}

/**
 * 更新页面背景色和主背景渐变
 */
export function updatePageBg(hue: number, isDark: boolean) {
  const root = document.documentElement
  
  if (isDark) {
    // 深色模式：oklch(0.16 0.014 var(--hue))
    root.style.setProperty('--page-bg', `oklch(0.16 0.014 ${hue})`)
    // 主背景渐变
    root.style.setProperty('--theme-bg-start', `oklch(0.12 0.012 ${hue})`)
    root.style.setProperty('--theme-bg-middle', `oklch(0.14 0.010 ${hue})`)
    root.style.setProperty('--theme-bg-end', `oklch(0.14 0.010 ${hue})`)
  } else {
    // 浅色模式：oklch(0.95 0.01 var(--hue))
    root.style.setProperty('--page-bg', `oklch(0.95 0.01 ${hue})`)
    // 主背景渐变
    root.style.setProperty('--theme-bg-start', `oklch(0.98 0.008 ${hue})`)
    root.style.setProperty('--theme-bg-middle', `oklch(0.99 0.006 ${hue})`)
    root.style.setProperty('--theme-bg-end', `oklch(0.99 0.006 ${hue})`)
  }
}

