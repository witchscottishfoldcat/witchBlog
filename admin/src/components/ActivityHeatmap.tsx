import { useMemo } from 'react';
import './ActivityHeatmap.css';

interface ActivityHeatmapProps {
  items: Array<{ created_at?: string; date?: string }>;
  title?: string;
}

export default function ActivityHeatmap({ items, title = '年度创作热力图' }: ActivityHeatmapProps) {
  const { weeks, totalCount, activeDays } = useMemo(() => {
    // 统计各日期出现频次 (YYYY-MM-DD)
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const dateStr = item.created_at || item.date;
      if (dateStr) {
        const d = dateStr.slice(0, 10);
        counts[d] = (counts[d] || 0) + 1;
      }
    });

    // 生成最近 52 周 (364 天) 的日期网格
    const today = new Date();
    const resultWeeks: Array<Array<{ date: string; count: number; dayOfWeek: number }>> = [];
    let currentWeek: Array<{ date: string; count: number; dayOfWeek: number }> = [];

    // 从 364 天前开始按天向前推
    for (let i = 363; i >= 0; i--) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() - i);
      const isoDate = dateObj.toISOString().slice(0, 10);
      const count = counts[isoDate] || 0;
      const dayOfWeek = dateObj.getDay();

      currentWeek.push({ date: isoDate, count, dayOfWeek });

      if (dayOfWeek === 6 || i === 0) {
        resultWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    const uniqueActive = Object.keys(counts).filter((d) => counts[d] > 0).length;
    const total = items.length;

    return { weeks: resultWeeks, totalCount: total, activeDays: uniqueActive };
  }, [items]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'level-0';
    if (count === 1) return 'level-1';
    if (count === 2) return 'level-2';
    return 'level-3';
  };

  return (
    <div className="activity-heatmap-card wc-card">
      <div className="heatmap-header">
        <div className="heatmap-title-group">
          <span className="wc-accent-bar" />
          <h3 className="heatmap-title">{title}</h3>
        </div>
        <div className="heatmap-stats-group">
          <span className="heatmap-stat-pill">年度发布 <strong>{totalCount}</strong> 次</span>
          <span className="heatmap-stat-pill">活跃天数 <strong>{activeDays}</strong> 天</span>
        </div>
      </div>

      <div className="heatmap-grid-wrap">
        <div className="heatmap-months-row">
          <span>1月</span>
          <span>3月</span>
          <span>5月</span>
          <span>7月</span>
          <span>9月</span>
          <span>11月</span>
        </div>

        <div className="heatmap-weeks-grid">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="heatmap-week-col">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`heatmap-square ${getIntensityClass(day.count)}`}
                  title={`${day.date}: ${day.count} 次创作`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="heatmap-legend">
          <span className="legend-label">Less</span>
          <div className="heatmap-square level-0" />
          <div className="heatmap-square level-1" />
          <div className="heatmap-square level-2" />
          <div className="heatmap-square level-3" />
          <span className="legend-label">More</span>
        </div>
      </div>
    </div>
  );
}
