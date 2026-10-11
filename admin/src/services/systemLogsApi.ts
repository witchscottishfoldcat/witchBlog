import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

/* 后端运行日志（/api/v1/system-logs/tail，仅超管）
 * 进程内环形缓冲（INFO 及以上），seq 游标增量拉取，类似 tail -f。 */
export interface BackendLogEntry {
  seq: number;
  time: string;
  level: string;
  logger: string;
  message: string;
  traceback?: string | null;
}

export interface BackendLogTail {
  entries: BackendLogEntry[];
  last_seq: number;
}

export const systemLogsApi = {
  getTail: (afterSeq: number, limit = 200) =>
    axios
      .get<BackendLogTail>(`${baseUrl}/api/v1/system-logs/tail`, {
        headers: getHeaders(),
        params: { after_seq: afterSeq, limit },
      })
      .then((r) => r.data),
};
