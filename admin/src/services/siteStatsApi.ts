import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

/* 站点统计（后端 /api/v1/site-stats）
 * 注意：访问日志仅保留 30 天，detailed 周期不要超过 30days。 */
export interface SiteStatsOverview {
  uptime_days: number;
  uptime_hours: number;
  total_requests: number;
  today_requests: number;
  total_visitors: number;
  today_visitors: number;
  average_requests_per_day?: number;
  top_pages?: unknown[];
  [key: string]: unknown;
}

export interface DayRequests {
  date: string;
  requests: number;
}

export interface DayVisits {
  date: string;
  visits: number;
}

export interface SiteStatsDetailed {
  requests_by_day: DayRequests[];
  visitors_by_day: DayVisits[];
  popular_pages?: unknown[];
  referrers?: unknown[];
  [key: string]: unknown;
}

export type StatsPeriod = '7days' | '30days';

/* 访客统计（后端 /api/v1/site-stats/visitors，仅超管）
 * IP 归属地由后端离线纯真库解析；服务器自身与内部调用流量已排除。 */
export interface VisitorTopIp {
  ip: string;
  requests: number;
  first_seen: string;
  last_seen: string;
  location: string;
}

export interface VisitorLocationItem {
  location: string;
  unique_visitors: number;
  requests: number;
}

export interface VisitorProvinceItem {
  province: string;
  unique_visitors: number;
  requests: number;
}

export interface VisitorCountryItem {
  country: string;
  unique_visitors: number;
  requests: number;
}

/* 实时日志（后端 /api/v1/site-stats/live-logs，仅超管）
 * 游标拉取：首次 after_id=0 拿最新一页；之后传上次返回的 last_id 增量获取。 */
export interface LiveLogItem {
  id: number;
  ip: string;
  location: string;
  method: string;
  path: string;
  referrer: string | null;
  time: string;
}

export interface LiveLogsResponse {
  logs: LiveLogItem[];
  last_id: number;
}

export interface VisitorStats {
  days: number;
  start_date: string;
  end_date: string;
  total_requests: number;
  unique_visitors: number;
  top_ips: VisitorTopIp[];
  locations: VisitorLocationItem[];
  province_distribution: VisitorProvinceItem[];
  country_distribution: VisitorCountryItem[];
  /* ---- 深度分析（后端 2026-09 扩展） ---- */
  trend: VisitorTrendItem[];
  hourly: VisitorHourlyItem[];
  top_pages: VisitorTopPageItem[];
  page_sections: VisitorPageSectionItem[];
  referrers: VisitorReferrerItem[];
  traffic_breakdown?: VisitorTrafficBreakdown | null;
  previous_period?: VisitorPreviousPeriod | null;
}

export interface VisitorTrendItem {
  date: string;
  requests: number;
  unique_visitors: number;
}

export interface VisitorHourlyItem {
  hour: number;
  requests: number;
  unique_visitors: number;
}

export interface VisitorTopPageItem {
  path: string;
  requests: number;
  unique_visitors: number;
}

export interface VisitorPageSectionItem {
  section: string;
  requests: number;
  unique_visitors: number;
}

export interface VisitorReferrerItem {
  domain: string;
  referrer_type: 'direct' | 'search' | 'external';
  requests: number;
  unique_visitors: number;
}

export interface VisitorTrafficBreakdown {
  human_requests: number;
  bot_requests: number;
  human_visitors: number;
  bot_visitors: number;
}

export interface VisitorPreviousPeriod {
  total_requests: number;
  unique_visitors: number;
}

export type VisitorStatsDays = 7 | 30;

export const siteStatsApi = {
  getOverview: () =>
    axios
      .get<SiteStatsOverview>(`${baseUrl}/api/v1/site-stats/`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getDetailed: (period: StatsPeriod) =>
    axios
      .get<SiteStatsDetailed>(`${baseUrl}/api/v1/site-stats/detailed`, {
        headers: getHeaders(),
        params: { period },
      })
      .then((r) => r.data),

  getVisitors: (days: VisitorStatsDays) =>
    axios
      .get<VisitorStats>(`${baseUrl}/api/v1/site-stats/visitors`, {
        headers: getHeaders(),
        params: { days },
      })
      .then((r) => r.data),

  getLiveLogs: (afterId: number, limit = 50) =>
    axios
      .get<LiveLogsResponse>(`${baseUrl}/api/v1/site-stats/live-logs`, {
        headers: getHeaders(),
        params: { after_id: afterId, limit },
      })
      .then((r) => r.data),
};
