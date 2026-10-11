import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

/* 赞助鸣谢（后端 /api/v1/sponsors）
 * GET / 公开（仅展示中的记录）；其余接口仅超级管理员。 */
export interface Sponsor {
  id: number;
  name: string;
  message: string | null;
  amount: number | null;
  source: string;
  is_anonymous: boolean;
  is_active: boolean;
  sort_order: number;
  sponsored_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SponsorCreate {
  name: string;
  message?: string | null;
  amount?: number | null;
  source?: string;
  is_anonymous?: boolean;
  is_active?: boolean;
  sort_order?: number;
  sponsored_at?: string | null;
}

export type SponsorUpdate = Partial<SponsorCreate>;

export interface SponsorListResponse {
  items: Sponsor[];
  total: number;
}

export const sponsorsApi = {
  list: (params?: { is_active?: boolean; source?: string }) =>
    axios
      .get<SponsorListResponse>(`${baseUrl}/api/v1/sponsors/all`, {
        headers: getHeaders(),
        params,
      })
      .then((r) => r.data),

  get: (id: number) =>
    axios
      .get<Sponsor>(`${baseUrl}/api/v1/sponsors/${id}`, { headers: getHeaders() })
      .then((r) => r.data),

  create: (data: SponsorCreate) =>
    axios
      .post<Sponsor>(`${baseUrl}/api/v1/sponsors/`, data, { headers: getHeaders() })
      .then((r) => r.data),

  update: (id: number, data: SponsorUpdate) =>
    axios
      .put<Sponsor>(`${baseUrl}/api/v1/sponsors/${id}`, data, { headers: getHeaders() })
      .then((r) => r.data),

  remove: (id: number) =>
    axios
      .delete(`${baseUrl}/api/v1/sponsors/${id}`, { headers: getHeaders() })
      .then((r) => r.data),
};
