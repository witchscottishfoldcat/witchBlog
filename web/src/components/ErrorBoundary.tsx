'use client'

import React from 'react'
import { logger } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React 错误边界组件
 * 用于捕获子组件树中的 JavaScript 错误，记录这些错误，并显示降级 UI
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到日志服务
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误 UI
      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
            borderColor: 'var(--theme-card-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-red-500 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              出现了一些问题
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-0.5 btn-theme-gradient"
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:translate-y-0.5"
                style={{
                  backgroundColor: 'var(--theme-card-bg-80)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-text)',
                }}
              >
                刷新页面
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                  错误详情（开发模式）
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs dark:bg-gray-800">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 错误边界 HOC（高阶组件）
 * 用于包装组件，自动添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

