'use client';

export default function MusicPlayer() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 min-w-[280px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 border-2 border-white dark:border-gray-800" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 border-2 border-white dark:border-gray-800" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 border-2 border-white dark:border-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              ルカルカ★ナイトフィーバー
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pastel*Palettes
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

