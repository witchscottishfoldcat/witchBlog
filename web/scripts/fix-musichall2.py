from pathlib import Path
import re

with open(Path(__file__).resolve().parents[1] / 'src' / 'components' / 'MusicHall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Modify playlist cards - change the button className to use glassmorphism style
# Find and replace the playlist card button styling
old_playlist_btn = '''                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setSelectedPlaylist(isSelected ? null : pl)}
                      className={`group overflow-hidden rounded-xl border text-left transition-all duration-200 sm:rounded-2xl ${isSelected
                        ? 'border-[var(--theme-primary-400)] dark:border-[var(--theme-primary-500)] bg-[var(--theme-primary-50)]/80 dark:bg-[var(--theme-primary-900)]/20 ring-2 ring-[var(--theme-primary-300)]/50 dark:ring-[var(--theme-primary-600)]/30 shadow-lg'
                        : 'border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 hover:shadow-lg hover:border-[var(--theme-primary-300)]/50 dark:hover:border-[var(--theme-primary-600)]/30'
                        }`}
                      title={pl.description ?? pl.title}
                    >
                      <div
                        className="relative h-14 bg-gray-200/50 dark:bg-gray-800/50 sm:h-24"
                        style={
                          pl.cover_image_url
                            ? {
                              backgroundImage: `url(${pl.cover_image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                            : undefined
                        }
                      >'''

new_playlist_btn = '''                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setSelectedPlaylist(isSelected ? null : pl)}
                      className="group overflow-hidden rounded-xl border text-left transition-all duration-200 sm:rounded-2xl"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 60%, var(--theme-card-bg)), var(--theme-card-bg) 70%)'
                          : 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 48%, var(--theme-card-bg)), var(--theme-card-bg) 68%)',
                        borderColor: isSelected ? 'var(--theme-primary-400)' : 'var(--theme-primary-200)',
                        boxShadow: isSelected ? '0 8px 30px rgba(0,0,0,0.12)' : undefined,
                      }}
                      title={pl.description ?? pl.title}
                    >
                      <div
                        className="relative h-14 sm:h-24"
                        style={
                          pl.cover_image_url
                            ? {
                              backgroundImage: `url(${pl.cover_image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                            : {
                              background: 'linear-gradient(135deg, var(--theme-primary-300), var(--theme-secondary-400))',
                            }
                        }
                      >'''

if old_playlist_btn in content:
    content = content.replace(old_playlist_btn, new_playlist_btn)
    print('Playlist button replaced successfully')
else:
    print('Playlist button NOT found')

# 3. Add watermark to playlist card
old_playlist_text = '''                      <div className="p-1.5 sm:p-3">
                        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-gray-900 dark:text-gray-100 sm:line-clamp-1 sm:text-sm">
                          {pl.title}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] text-gray-600 dark:text-gray-400 sm:mt-1 sm:text-[11px]">
                          {pl.track_count} {locale === 'zh' ? '首' : 'tracks'}
                        </p>
                      </div>'''

new_playlist_text = '''                      <div className="relative p-1.5 sm:p-3">
                        {/* 序号水印 */}
                        <span
                          className="pointer-events-none absolute -bottom-1 right-0 select-none font-black leading-none tracking-tighter opacity-[0.06] text-[2.5rem]"
                          style={{ color: 'var(--theme-primary-500)' }}
                          aria-hidden
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-gray-900 dark:text-gray-100 sm:line-clamp-1 sm:text-sm">
                          {pl.title}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] text-gray-600 dark:text-gray-400 sm:mt-1 sm:text-[11px]">
                          {pl.track_count} {locale === 'zh' ? '首' : 'tracks'}
                        </p>
                      </div>'''

if old_playlist_text in content:
    content = content.replace(old_playlist_text, new_playlist_text)
    print('Playlist text replaced successfully')
else:
    print('Playlist text NOT found')

# 4. Modify empty playlist state
old_empty_playlist = '''              <div className="rounded-2xl p-4 bg-white/60 dark:bg-gray-900/50 text-sm text-gray-500 dark:text-gray-400">
                {locale === 'zh' ? '暂无歌单' : 'No playlists'}
              </div>'''

new_empty_playlist = '''              <div
                className="rounded-2xl p-4 text-sm text-gray-500 dark:text-gray-400"
                style={{
                  backgroundColor: 'var(--theme-card-bg-80)',
                  borderColor: 'var(--theme-card-border)',
                }}
              >
                {locale === 'zh' ? '暂无歌单' : 'No playlists'}
              </div>'''

if old_empty_playlist in content:
    content = content.replace(old_empty_playlist, new_empty_playlist)
    print('Empty playlist replaced successfully')
else:
    print('Empty playlist NOT found')

with open(Path(__file__).resolve().parents[1] / 'src' / 'components' / 'MusicHall.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
