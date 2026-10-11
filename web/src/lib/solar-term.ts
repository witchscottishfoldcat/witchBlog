/**
 * 二十四节气与季节
 * 供 SolarTermBar、飘落效果等按节气切换使用
 */

export const SOLAR_TERMS = [
  { name: '小寒', nameEn: 'Minor Cold', month: 1, day: 5 },
  { name: '大寒', nameEn: 'Major Cold', month: 1, day: 20 },
  { name: '立春', nameEn: 'Start of Spring', month: 2, day: 4 },
  { name: '雨水', nameEn: 'Rain Water', month: 2, day: 19 },
  { name: '惊蛰', nameEn: 'Awakening of Insects', month: 3, day: 5 },
  { name: '春分', nameEn: 'Spring Equinox', month: 3, day: 20 },
  { name: '清明', nameEn: 'Clear and Bright', month: 4, day: 5 },
  { name: '谷雨', nameEn: 'Grain Rain', month: 4, day: 19 },
  { name: '立夏', nameEn: 'Start of Summer', month: 5, day: 5 },
  { name: '小满', nameEn: 'Grain Buds', month: 5, day: 21 },
  { name: '芒种', nameEn: 'Grain in Ear', month: 6, day: 6 },
  { name: '夏至', nameEn: 'Summer Solstice', month: 6, day: 21 },
  { name: '小暑', nameEn: 'Minor Heat', month: 7, day: 7 },
  { name: '大暑', nameEn: 'Major Heat', month: 7, day: 22 },
  { name: '立秋', nameEn: 'Start of Autumn', month: 8, day: 8 },
  { name: '处暑', nameEn: 'End of Heat', month: 8, day: 23 },
  { name: '白露', nameEn: 'White Dew', month: 9, day: 8 },
  { name: '秋分', nameEn: 'Autumn Equinox', month: 9, day: 23 },
  { name: '寒露', nameEn: 'Cold Dew', month: 10, day: 8 },
  { name: '霜降', nameEn: "Frost's Descent", month: 10, day: 23 },
  { name: '立冬', nameEn: 'Start of Winter', month: 11, day: 7 },
  { name: '小雪', nameEn: 'Minor Snow', month: 11, day: 22 },
  { name: '大雪', nameEn: 'Major Snow', month: 12, day: 7 },
  { name: '冬至', nameEn: 'Winter Solstice', month: 12, day: 22 },
] as const

function getDayOfYear(month: number, day: number): number {
  const days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  return days[month - 1] + day
}

export function getCurrentSolarTerm(): (typeof SOLAR_TERMS)[number] {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const currentDoy = getDayOfYear(month, day)

  for (let i = SOLAR_TERMS.length - 1; i >= 0; i--) {
    const term = SOLAR_TERMS[i]
    const termDoy = getDayOfYear(term.month, term.day)
    if (currentDoy >= termDoy) return term
  }
  return SOLAR_TERMS[SOLAR_TERMS.length - 1]
}

export type SeasonVariant = 'spring' | 'summer' | 'autumn' | 'winter'

/**
 * 根据当前节气返回季节，用于切换飘落效果等
 * 春: 立春~谷雨, 夏: 立夏~大暑, 秋: 立秋~霜降, 冬: 立冬~大寒
 */
export function getSeasonFromSolarTerm(term: (typeof SOLAR_TERMS)[number]): SeasonVariant {
  const name = term.name
  if (['立春', '雨水', '惊蛰', '春分', '清明', '谷雨'].includes(name)) return 'spring'
  if (['立夏', '小满', '芒种', '夏至', '小暑', '大暑'].includes(name)) return 'summer'
  if (['立秋', '处暑', '白露', '秋分', '寒露', '霜降'].includes(name)) return 'autumn'
  return 'winter'
}

export function getCurrentSeason(): SeasonVariant {
  return getSeasonFromSolarTerm(getCurrentSolarTerm())
}
