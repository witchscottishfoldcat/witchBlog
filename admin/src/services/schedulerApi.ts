import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

export interface TaskStatus {
  name: string;
  description: string;
  trigger_type: string;
  schedule: string;
  is_enabled: boolean;
  is_running: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_duration: number | null;
  run_count: number;
}

export interface TaskListResponse {
  tasks: TaskStatus[];
  total: number;
  enabled_count: number;
  disabled_count: number;
}

export interface RunTaskResponse {
  success: boolean;
  message?: string;
  error?: string;
  job_id?: string;
  started_at?: string;
}

export const schedulerApi = {
  getTasks: () =>
    axios
      .get<TaskListResponse>(`${baseUrl}/api/v1/scheduler/tasks`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getTask: (taskName: string) =>
    axios
      .get<TaskStatus>(`${baseUrl}/api/v1/scheduler/tasks/${encodeURIComponent(taskName)}`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  enable: (taskName: string) =>
    axios
      .post<{ message: string; is_enabled: boolean }>(
        `${baseUrl}/api/v1/scheduler/tasks/${encodeURIComponent(taskName)}/enable`,
        null,
        { headers: getHeaders() }
      )
      .then((r) => r.data),

  disable: (taskName: string) =>
    axios
      .post<{ message: string; is_enabled: boolean }>(
        `${baseUrl}/api/v1/scheduler/tasks/${encodeURIComponent(taskName)}/disable`,
        null,
        { headers: getHeaders() }
      )
      .then((r) => r.data),

  run: (taskName: string) =>
    axios
      .post<RunTaskResponse>(
        `${baseUrl}/api/v1/scheduler/tasks/${encodeURIComponent(taskName)}/run`,
        null,
        { headers: getHeaders() }
      )
      .then((r) => r.data),
};
