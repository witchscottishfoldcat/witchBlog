/**
 * 安全的 DOM 操作工具
 * 提供 SSR 安全和错误处理的 DOM 操作方法
 */

/**
 * 检查是否在浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 安全地获取 DOM 元素
 * @param selector CSS 选择器或元素 ID
 * @returns DOM 元素或 null
 */
export function safeGetElement(selector: string): HTMLElement | null {
  if (!isBrowser()) return null
  
  try {
    if (selector.startsWith('#')) {
      return document.getElementById(selector.slice(1))
    }
    if (selector.startsWith('.')) {
      return document.querySelector(selector) as HTMLElement | null
    }
    return document.querySelector(selector) as HTMLElement | null
  } catch {
    return null
  }
}

/**
 * 安全地移除子元素
 * @param parent 父元素
 * @param child 子元素
 * @returns 是否成功移除
 */
export function safeRemoveChild(
  parent: HTMLElement | null,
  child: Node | null
): boolean {
  if (!isBrowser()) return false
  if (!parent || !child) return false
  
  try {
    // 检查父元素是否包含子元素
    if (parent.contains(child)) {
      parent.removeChild(child)
      return true
    }
    return false
  } catch {
    // 静默处理错误（元素可能已被移除）
    return false
  }
}

/**
 * 安全地添加子元素
 * @param parent 父元素
 * @param child 子元素
 * @returns 是否成功添加
 */
export function safeAppendChild(
  parent: HTMLElement | null,
  child: Node | null
): boolean {
  if (!isBrowser()) return false
  if (!parent || !child) return false
  
  try {
    parent.appendChild(child)
    return true
  } catch {
    return false
  }
}

/**
 * 安全地移除事件监听器
 * @param element 目标元素
 * @param event 事件类型
 * @param handler 事件处理函数
 * @returns 是否成功移除
 */
export function safeRemoveEventListener(
  element: EventTarget | null,
  event: string,
  handler: EventListener
): boolean {
  if (!isBrowser()) return false
  if (!element || !element.removeEventListener) return false
  
  try {
    element.removeEventListener(event, handler)
    return true
  } catch {
    return false
  }
}

/**
 * 安全地添加事件监听器
 * @param element 目标元素
 * @param event 事件类型
 * @param handler 事件处理函数
 * @param options 选项
 * @returns 是否成功添加
 */
export function safeAddEventListener(
  element: EventTarget | null,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): boolean {
  if (!isBrowser()) return false
  if (!element || !element.addEventListener) return false
  
  try {
    element.addEventListener(event, handler, options)
    return true
  } catch {
    return false
  }
}

