import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

export interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  context?: Record<string, string>;
}

export interface PerformanceData {
  timestamp: string;
  system: {
    cpu_percent: number;
    cpu_count: number;
    memory_total: number;
    memory_used: number;
    memory_percent: number;
    disk_total: number;
    disk_used: number;
    disk_percent: number;
    network_sent?: number;
    network_recv?: number;
    boot_time?: string;
    uptime?: number;
  };
  application: {
    total_requests?: number;
    today_requests?: number;
    average_response_time?: number;
    error_rate?: number;
    active_connections?: number;
    uptime?: number;
    start_time?: string;
  };
  database: {
    pool_size?: number;
    checked_out?: number;
    checked_in?: number;
    invalid?: number;
    total_connections?: number;
    connection_errors?: number;
    status?: string;
  };
  business?: {
    total_users?: number;
    active_users?: number;
    total_diaries?: number;
    total_albums?: number;
    total_photos?: number;
    total_visitors?: number;
    today_visitors?: number;
  };
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version?: string;
  environment?: string;
  components?: Record<string, string>;
  health_checks?: Record<string, unknown>;
}

export interface LogStats {
  total_lines?: number;
  error_count?: number;
  warning_count?: number;
  info_count?: number;
  debug_count?: number;
  file_size?: number;
}

export interface LogFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export const adminApi = {
  getPerformance: (useCache = true) =>
    axios
      .get<PerformanceData>(`${baseUrl}/api/v1/admin/performance`, {
        params: { use_cache: useCache },
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getSystemStatus: () =>
    axios
      .get<SystemStatus>(`${baseUrl}/api/v1/admin/system-status`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getLogStats: () =>
    axios
      .get<{ success: boolean; data: LogStats }>(`${baseUrl}/api/v1/admin/logs/stats`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getLogFiles: () =>
    axios
      .get<{ success: boolean; data: LogFile[]; count: number }>(`${baseUrl}/api/v1/admin/logs/files`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getDashboard: () =>
    axios
      .get<{ success: boolean; data: Record<string, unknown> }>(`${baseUrl}/api/v1/admin/dashboard`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getHealthCheck: () =>
    axios
      .get<{ status: string; checks: Record<string, boolean>; timestamp: string }>(
        `${baseUrl}/api/v1/admin/health-check`,
        { headers: getHeaders() }
      )
      .then((r) => r.data),

  getLogStreamUrl: (params?: { level?: string; module?: string; lines?: number; follow?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set('level', params.level);
    if (params?.module) q.set('module', params.module);
    if (params?.lines) q.set('lines', String(params.lines));
    if (params?.follow !== undefined) q.set('follow', String(params.follow));
    return `${baseUrl}/api/v1/admin/logs/stream?${q.toString()}`;
  },
};
