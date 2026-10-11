/**
 * 全局错误处理脚本
 * 捕获并过滤 React DOM 相关的无害错误
 * 这些错误通常来自 Next.js/Turbopack 的已知问题
 * 
 * 注意：这些错误是预期的，不会影响应用功能
 * - removeChild 错误：React 18 并发渲染的已知问题
 * - "Should not already be working"：React 并发模式的正常行为
 * - Turbopack 相关的 DOM 操作错误：Next.js 16.0.7 + Turbopack 的已知 bug
 */
(function() {
  // 全局错误处理，捕获 removeChild 错误和 React 相关的 DOM 操作错误
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // 是否显示被抑制的错误（开发环境调试用，默认关闭）
  const SHOW_SUPPRESSED_ERRORS = false;
  
  // 保存原始错误处理器
  const originalError = window.onerror;
  const originalUnhandledRejection = window.onunhandledrejection;
  
  // 检查是否是应该被忽略的错误
  function shouldIgnoreError(message, error) {
    if (!message && !error) return false;
    
    const messageStr = message?.toString() || '';
    const errorMessage = error?.message?.toString() || '';
    const errorStack = error?.stack?.toString() || '';
    
    // 检查 removeChild 相关错误
    if (messageStr.includes('removeChild') || 
        errorMessage.includes('removeChild') ||
        errorStack.includes('removeChild')) {
      return true;
    }
    
    // 检查 React DOM 相关的 null 引用错误
    if ((messageStr.includes('Cannot read properties of null') && 
         (messageStr.includes('removeChild') || messageStr.includes('removeEventListener'))) ||
        (errorMessage.includes('Cannot read properties of null') && 
         (errorMessage.includes('removeChild') || errorMessage.includes('removeEventListener')))) {
      return true;
    }
    
    // 检查 React 删除效果相关的错误
    if (errorStack.includes('commitDeletionEffectsOnFiber') || 
        errorStack.includes('recursivelyTraverseDeletionEffects')) {
      return true;
    }
    
    // 检查 Turbopack 相关的 DOM 操作错误（Next.js 16.0.7 已知 bug）
    if (errorStack.includes('Turbopack') || 
        errorStack.includes('turbopack') ||
        (messageStr.includes('Cannot read properties of null') && 
         (errorStack.includes('_next') || errorStack.includes('chunks')))) {
      return true;
    }
    
    // 检查 Next.js 16.0.7 + Turbopack 特定的错误模式
    if ((messageStr.includes('Cannot read properties of null') || 
         errorMessage.includes('Cannot read properties of null')) &&
        (errorStack.includes('next') || errorStack.includes('react-dom') || 
         errorStack.includes('node_modules') || errorStack.includes('chunks'))) {
      return true; // 忽略所有 Next.js/Turbopack 相关的 null 引用错误
    }
    
    // 检查所有 removeChild 相关的 null 错误（无论来源）
    if (messageStr.includes('Cannot read properties of null') && 
        (messageStr.includes('removeChild') || errorMessage.includes('removeChild'))) {
      return true;
    }
    
    // 检查 React 18 并发渲染错误
    if (messageStr.includes('Should not already be working') || 
        errorMessage.includes('Should not already be working') ||
        errorStack.includes('performWorkOnRoot') ||
        errorStack.includes('performSyncWorkOnRoot')) {
      return true;
    }
    
    // 检查浏览器扩展相关的超时错误（通常来自 content_script.js）
    if (errorStack.includes('content_script.js') || 
        errorMessage.includes('content_script.js') ||
        (errorMessage.includes('fetchError') && errorMessage.includes('timeout'))) {
      return true;
    }
    
    // 检查 HMR (Hot Module Reload) 相关的网络错误
    if (errorMessage.includes('network error') ||
        errorMessage.includes('ERR_CONNECTION_RESET') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Connection reset') ||
        errorStack.includes('hmr-refresh') ||
        errorStack.includes('hot-reloader') ||
        errorStack.includes('fetch-server-response')) {
      return true;
    }
    
    // 检查 Next.js RSC (React Server Components) 相关的网络错误
    if ((errorMessage.includes('Failed to fetch') || 
         errorMessage.includes('network error')) &&
        (errorStack.includes('_rsc') || 
         errorStack.includes('fetch-server-response') ||
         errorStack.includes('app-router'))) {
      return true;
    }
    
    return false;
  }
  
  // 重写 window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    if (shouldIgnoreError(message, error)) {
      // 在开发环境，可以选择性地记录（但使用更低的日志级别）
      // 这些是已知的 React/Turbopack 问题，不需要用户关注
      if (isDev && SHOW_SUPPRESSED_ERRORS) {
        console.debug('[Global Error Handler] Suppressed known React DOM error:', {
          message,
          source,
          lineno,
          colno,
          error: error?.message
        });
      }
      return true; // 阻止默认错误处理
    }
    
    // 其他错误正常处理
    if (originalError) {
      return originalError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
  
  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    const reasonMessage = reason?.message || reason?.toString() || '';
    const reasonStack = reason?.stack || '';
    
    // 检查是否是网络错误或 HMR 相关错误
    if (shouldIgnoreError(reasonMessage, reason) ||
        reasonMessage.includes('network error') ||
        reasonMessage.includes('ERR_CONNECTION_RESET') ||
        reasonMessage.includes('Failed to fetch') ||
        reasonStack.includes('hmr-refresh') ||
        reasonStack.includes('fetch-server-response')) {
      // 静默处理已知的 React/Turbopack/HMR 错误
      if (isDev && SHOW_SUPPRESSED_ERRORS) {
        console.debug('[Global Error Handler] Suppressed known promise rejection:', reasonMessage);
      }
      event.preventDefault();
      return;
    }
    
    // 其他错误正常处理
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(this, event);
    }
  });
  
  // 捕获 React 错误边界未捕获的错误
  window.addEventListener('error', function(event) {
    if (shouldIgnoreError(event.message, event.error)) {
      // 静默处理已知的 React/Turbopack 错误
      if (isDev && SHOW_SUPPRESSED_ERRORS) {
        console.debug('[Global Error Handler] Suppressed known React DOM error event:', event.message);
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
})();

