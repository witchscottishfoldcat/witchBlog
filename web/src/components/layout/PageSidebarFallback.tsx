export function LeftSidebarFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  )
}

export function RightSidebarFallback() {
  return (
    <div className="space-y-6">
      <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
      <div className="h-32 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
      <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
    </div>
  )
}
