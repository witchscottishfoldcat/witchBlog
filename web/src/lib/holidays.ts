/**
 * 节日数据
 * 格式：MM-DD: { zh: '中文名称', en: 'English Name', icon?: 'emoji' }
 */

export interface Holiday {
  zh: string
  en: string
  icon?: string
}

export const holidays: Record<string, Holiday> = {
  // 1月
  '01-01': { zh: '元旦', en: 'New Year\'s Day', icon: '🎉' },
  
  // 2月
  '02-10': { zh: '春节', en: 'Spring Festival', icon: '🧧' },
  '02-14': { zh: '情人节', en: 'Valentine\'s Day', icon: '💝' },
  '02-24': { zh: '元宵节', en: 'Lantern Festival', icon: '🏮' },
  
  // 3月
  '03-08': { zh: '妇女节', en: 'Women\'s Day', icon: '🌸' },
  '03-12': { zh: '植树节', en: 'Arbor Day', icon: '🌳' },
  
  // 4月
  '04-01': { zh: '愚人节', en: 'April Fool\'s Day', icon: '🎭' },
  '04-05': { zh: '清明节', en: 'Qingming Festival', icon: '🕯️' },
  
  // 5月
  '05-01': { zh: '劳动节', en: 'Labor Day', icon: '👷' },
  '05-04': { zh: '青年节', en: 'Youth Day', icon: '🎓' },
  '05-12': { zh: '护士节', en: 'Nurses Day', icon: '👩‍⚕️' },
  
  // 6月
  '06-01': { zh: '儿童节', en: 'Children\'s Day', icon: '🎈' },
  '06-10': { zh: '端午节', en: 'Dragon Boat Festival', icon: '🐲' },
  '06-18': { zh: '父亲节', en: 'Father\'s Day', icon: '👨' },
  
  // 7月
  '07-01': { zh: '建党节', en: 'Party Founding Day', icon: '🇨🇳' },
  
  // 8月
  '08-01': { zh: '建军节', en: 'Army Day', icon: '🎖️' },
  
  // 9月
  '09-10': { zh: '教师节', en: 'Teachers\' Day', icon: '👩‍🏫' },
  '09-15': { zh: '中秋节', en: 'Mid-Autumn Festival', icon: '🌕' },
  '09-18': { zh: '九一八', en: 'September 18', icon: '🕯️' },
  
  // 10月
  '10-01': { zh: '国庆节', en: 'National Day', icon: '🇨🇳' },
  '10-31': { zh: '万圣节', en: 'Halloween', icon: '🎃' },
  
  // 11月
  '11-11': { zh: '光棍节', en: 'Singles Day', icon: '🛒' },
  '11-24': { zh: '感恩节', en: 'Thanksgiving', icon: '🦃' },
  
  // 12月
  '12-24': { zh: '平安夜', en: 'Christmas Eve', icon: '🎄' },
  '12-25': { zh: '圣诞节', en: 'Christmas', icon: '🎅' },
  '12-31': { zh: '跨年夜', en: 'New Year\'s Eve', icon: '🎊' },
}

/**
 * 获取指定日期的节日信息
 */
export function getHoliday(date: Date): Holiday | null {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const key = `${month}-${day}`
  return holidays[key] || null
}

/**
 * 获取指定日期的节日名称（根据语言）
 */
export function getHolidayName(date: Date, locale: string = 'zh'): string | null {
  const holiday = getHoliday(date)
  if (!holiday) return null
  return locale === 'zh' ? holiday.zh : holiday.en
}

/**
 * 检查日期是否是节日
 */
export function isHoliday(date: Date): boolean {
  return getHoliday(date) !== null
}

