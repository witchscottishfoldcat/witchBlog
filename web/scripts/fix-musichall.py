from pathlib import Path
import re

with open(Path(__file__).resolve().parents[1] / 'src' / 'components' / 'MusicHall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Modify Banner area
old_banner_start = '      {/* 顶部 Banner（桌面） */}'
old_banner_end = '      </div>'

# Find the banner block
banner_start_idx = content.find(old_banner_start)
if banner_start_idx != -1:
    # Find the matching closing div
    # The banner is from line 293 to 342, let's find the exact block
    banner_block = content[banner_start_idx:content.find('      <div className="grid grid-cols-1 gap-3', banner_start_idx)]
    
    new_banner = '''      {/* 顶部 Banner（桌面）— 毛玻璃风格统一 */}
      <div
        className="relative z-30 hidden overflow-hidden rounded-3xl border backdrop-blur md:block"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 顶部彩色线条 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
          style={{ background: 'linear-gradient(to right, var(--theme-primary-400), var(--theme-secondary), transparent)' }}
          aria-hidden
        />
        {/* 背景光晕 */}
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-[0.14] blur-3xl"
          style={{ backgroundColor: 'var(--theme-primary-400)' }}
          aria-hidden
        />
        <div className="relative p-3 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
            <div className="min-w-0 md:flex-1">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{
                  backgroundColor: 'var(--theme-card-bg-80)',
                  borderColor: 'var(--theme-card-border)',
                }}
              >
                <Icon icon="mdi:music-circle" className="h-4 w-4" style={{ color: 'var(--theme-primary-600)' }} />
                <span className="text-xs text-gray-700 dark:text-gray-200">{titleText}</span>
              </div>
              <h1 className="mobile-app-title mt-2 text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:mt-3 sm:text-2xl md:text-4xl">
                {titleText}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 md:text-base">
                {subTitleText}
              </p>
              {stats ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span
                    className="rounded-lg border px-2 py-1"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-80)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    {stats.total_playlists} {locale === 'zh' ? '个歌单' : 'playlists'}
                  </span>
                  <span
                    className="rounded-lg border px-2 py-1"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-80)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    {stats.total_tracks} {locale === 'zh' ? '首歌曲' : 'tracks'}
                  </span>
                  <span
                    className="rounded-lg border px-2 py-1"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-80)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    {stats.total_play_count} {locale === 'zh' ? '次播放' : 'plays'}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="w-full md:w-[360px] md:flex-shrink-0">
              <div className="relative">
                <Icon
                  icon="mdi:magnify"
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                />
                <input
                  className="h-11 w-full rounded-2xl border pl-10 pr-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 dark:text-gray-100"
                  style={{
                    backgroundColor: 'var(--theme-card-bg-80)',
                    borderColor: 'var(--theme-card-border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  placeholder={locale === 'zh' ? '搜索（UI 预留）' : 'Search (UI only)'}
                  disabled
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 md:text-right">
                {locale === 'zh' ? '提示：点击右侧播放器可直接在页面播放（网易云 iframe）' : 'Tip: play via NetEase iframe on the right.'}
              </p>
            </div>
          </div>
        </div>
      </div>

'''
    content = content.replace(banner_block, new_banner)
    print('Banner replaced successfully')
else:
    print('Banner NOT found')

with open(Path(__file__).resolve().parents[1] / 'src' / 'components' / 'MusicHall.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
