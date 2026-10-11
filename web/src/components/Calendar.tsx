'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { getHoliday, getHolidayName, isHoliday } from '@/lib/holidays'
import { logger } from '@/lib/logger'

interface CalendarProps {
  locale?: string
  markedDates?: Date[] // 可以标记的日期（例如有内容的日期）
}

export default function Calendar({ locale = 'zh', markedDates = [] }: CalendarProps) {
  const t = useTranslations('sidebar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const dateLocale = locale === 'zh' ? zhCN : enUS
  
  // 处理日期点击
  const handleDateClick = (date: Date) => {
    // 可以在这里添加点击日期的逻辑，例如跳转到该日期的内容
    const formattedDate = format(date, locale === 'zh' ? 'yyyy-MM-dd' : 'yyyy-MM-dd')
    logger.log('Selected date:', formattedDate)
    // 如果需要跳转，可以在这里使用 router.push
    // 例如：router.push(`/${locale}/archive?date=${formattedDate}`)
  }
  
  // 获取当前月份的所有日期
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // 周一开始
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const today = new Date()
  
  // 检查日期是否被标记
  const isMarked = (date: Date) => {
    return markedDates.some(markedDate => isSameDay(date, markedDate))
  }
  
  // 检查日期是否是今天
  const isToday = (date: Date) => {
    return isSameDay(date, today)
  }
  
  // 检查日期是否是当前月份
  const isCurrentMonth = (date: Date) => {
    return isSameMonth(date, currentDate)
  }
  
  // 切换月份
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  // 星期标题
  const weekDays = locale === 'zh' 
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  return (
    <div className="calendar-wrapper min-w-0">
      {/* 月份导航 */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-1">
        <button
          onClick={goToPreviousMonth}
          className="btn-regular touch-target shrink-0 rounded-lg p-2 sm:p-2 transition-all hover:scale-110 active:scale-95"
          aria-label={t('previousMonth')}
        >
          <svg className="h-5 w-5 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2 px-0.5">
          <h3 className="truncate text-sm sm:text-lg font-bold text-gray-800 dark:text-gray-200">
            {format(currentDate, locale === 'zh' ? 'yyyy年MM月' : 'MMMM yyyy', { locale: dateLocale })}
          </h3>
          <button
            onClick={goToToday}
            className="btn-regular shrink-0 rounded-lg px-2 py-1 sm:px-3 text-[10px] sm:text-xs font-medium transition-all hover:scale-105 active:scale-95"
            title={t('goToToday')}
          >
            {t('today')}
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="btn-regular touch-target shrink-0 rounded-lg p-2 transition-all hover:scale-110 active:scale-95"
          aria-label={t('nextMonth')}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* 星期标题 */}
      <div className="mb-1.5 sm:mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 py-1 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day, index) => {
          const isMarkedDate = isMarked(day)
          const isTodayDate = isToday(day)
          const isCurrentMonthDate = isCurrentMonth(day)
          const holiday = getHoliday(day)
          const isHolidayDate = isHoliday(day)
          const holidayName = getHolidayName(day, locale)
          
          // 构建 title（包含节日信息）
          let titleText = format(day, locale === 'zh' ? 'yyyy年MM月dd日' : 'MMMM dd, yyyy', { locale: dateLocale })
          if (holidayName) {
            titleText += ` - ${holidayName}`
          }
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                relative flex min-h-[36px] sm:min-h-0 sm:aspect-square items-center justify-center rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 touch-target
                ${isCurrentMonthDate ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}
                ${isTodayDate 
                  ? 'text-white shadow-lg font-bold' 
                  : isHolidayDate
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                  : isMarkedDate
                  ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              style={isTodayDate ? {
                background: 'linear-gradient(to bottom right, var(--theme-primary-400), var(--theme-secondary))'
              } : undefined}
              title={titleText}
            >
              {format(day, 'd')}
              {isHolidayDate && !isTodayDate && (
                <span className="absolute top-0 right-0.5 text-[9px] sm:text-[8px] leading-none">{holiday?.icon}</span>
              )}
              {isMarkedDate && !isTodayDate && !isHolidayDate && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500 dark:bg-pink-400" />
              )}
            </button>
          )
        })}
      </div>
      
    </div>
  )
}

