from pathlib import Path
import re

with open(Path(__file__).resolve().parents[1] / 'src' / 'components' / 'MusicHall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 5. Modify selected playlist detail panel
old_selected_pl = '''            {selectedPlaylist && (
              <div className="mobile-app-section max-md:mobile-page-card mt-2 animate-in overflow-hidden rounded-xl border border-[var(--theme-primary-300)]/50 bg-white/80 p-2.5 fade-in slide-in-from-top-2 duration-200 dark:border-[var(--theme-primary-600)]/30 dark:bg-gray-900/70 sm:mt-4 sm:rounded-2xl sm:p-4">
                <div className="sticky top-16 z-20 -mx-2.5 mb-2 flex items-start gap-2 border-b border-black/5 bg-white/95 px-2.5 pb-2 backdrop-blur-md dark:border-white/10 dark:bg-gray-900/95 sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:gap-4">'''

new_selected_pl = '''            {selectedPlaylist && (
              <div
                className="mobile-app-section max-md:mobile-page-card mt-2 animate-in overflow-hidden rounded-xl border p-2.5 fade-in slide-in-from-top-2 duration-200 sm:mt-4 sm:rounded-2xl sm:p-4"
                style={{
                  backgroundColor: 'var(--theme-card-bg-90)',
                  borderColor: 'var(--theme-card-border)',
                }}
              >
                <div
                  className="sticky top-16 z-20 -mx-2.5 mb-2 flex items-start gap-2 border-b px-2.5 pb-2 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:gap-4"
                  style={{ borderColor: 'var(--theme-card-border)' }}
                >'''

if old_selected_pl in content:
    content = content.replace(old_selected_pl, new_selected_pl)
    print('Selected playlist panel replaced successfully')
else:
    print('Selected playlist panel NOT found')

# 6. Modify playlist tracks list container
old_tracks_container = '''                    <div className="max-md:mobile-feed-panel max-md:mobile-feed-list overflow-hidden rounded-xl border border-black/5 bg-white/60 dark:border-white/10 dark:bg-gray-900/50 sm:rounded-2xl">
                      <div className="divide-y divide-black/5 dark:divide-white/10 max-md:divide-y-0">'''

new_tracks_container = '''                    <div
                      className="max-md:mobile-feed-panel max-md:mobile-feed-list overflow-hidden rounded-xl border sm:rounded-2xl"
                      style={{
                        backgroundColor: 'var(--theme-card-bg-80)',
                        borderColor: 'var(--theme-card-border)',
                      }}
                    >
                      <div className="divide-y max-md:divide-y-0" style={{ borderColor: 'var(--theme-card-border)' }}>'''

if old_tracks_container in content:
    content = content.replace(old_tracks_container, new_tracks_container)
    print('Tracks container replaced successfully')
else:
    print('Tracks container NOT found')

# 7. Modify recent tracks list container
old_recent_container = '''                  <div className="max-md:mobile-feed-panel max-md:mobile-feed-list overflow-hidden rounded-xl border border-black/5 bg-white/70 dark:border-white/10 dark:bg-gray-900/60 sm:rounded-3xl">
                    <div className="divide-y divide-black/5 dark:divide-white/10 max-md:divide-y-0">'''

new_recent_container = '''                  <div
                    className="max-md:mobile-feed-panel max-md:mobile-feed-list overflow-hidden rounded-xl border sm:rounded-3xl"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-90)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    <div className="divide-y max-md:divide-y-0" style={{ borderColor: 'var(--theme-card-border)' }}>'''

if old_recent_container in content:
    content = content.replace(old_recent_container, new_recent_container)
    print('Recent container replaced successfully')
else:
    print('Recent container NOT found')

# 8. Modify empty recent state
old_empty_recent = '''                  <div className="rounded-2xl p-4 bg-white/60 dark:bg-gray-900/50 text-sm text-gray-500 dark:text-gray-400">
                    {locale === 'zh' ? '暂无最近播放记录' : 'No recent plays'}
                  </div>'''

new_empty_recent = '''                  <div
                    className="rounded-2xl p-4 text-sm text-gray-500 dark:text-gray-400"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-80)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    {locale === 'zh' ? '暂无最近播放记录' : 'No recent plays'}
                  </div>'''

if old_empty_recent in content:
    content = content.replace(old_empty_recent, new_empty_recent)
    print('Empty recent replaced successfully')
else:
    print('Empty recent NOT found')

# 9. Modify collapsed recent track button
old_collapsed_recent = '''                <button
                  type="button"
                  onClick={() => setRecentOpen(true)}
                  className="mobile-feed-item flex w-full items-center gap-2.5 rounded-xl bg-[var(--theme-primary-50)] p-2.5 text-left transition-colors dark:bg-white/5 sm:gap-3 sm:rounded-2xl sm:p-4"
                  aria-label={locale === 'zh' ? '展开最近播放' : 'Expand recent plays'}'''

new_collapsed_recent = '''                <button
                  type="button"
                  onClick={() => setRecentOpen(true)}
                  className="mobile-feed-item flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors sm:gap-3 sm:rounded-2xl sm:p-4"
                  style={{
                    backgroundColor: 'var(--theme-card-bg-80)',
                    borderColor: 'var(--theme-card-border)',
                  }}
                  aria-label={locale === 'zh' ? '展开最近播放' : 'Expand recent plays'}'''

if old_collapsed_recent in content:
    content = content.replace(old_collapsed_recent, new_collapsed_recent)
    print('Collapsed recent replaced successfully')
else:
    print('Collapsed recent NOT found')

with open(Path(__file__).resolve().parents[1] / 'src' / 'components' / 'MusicHall.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
