import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
  'Content-Type': 'application/json',
});

export interface GameShowcase {
  id: number;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  steam_appid?: string | null;
  steam_url?: string | null;
  platform?: string;
  category?: string;
  tags?: string | null;
  developer?: string | null;
  publisher?: string | null;
  status?: string;
  play_time?: number;
  rating?: number | null;
  review?: string | null;
  is_favorite?: boolean;
  is_active?: boolean;
  is_r18?: boolean;
  sort_order?: number;
  release_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GameListResponse {
  items: GameShowcase[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GameStats {
  total_games?: number;
  total_play_time?: number;
  total_play_time_hours?: number;
  favorite_count?: number;
  average_rating?: number | null;
  status_stats?: { status: string; count: number }[];
  platform_stats?: { platform: string; count: number }[];
  category_stats?: { category: string; count: number }[];
}

export interface ImportFromSteamRequest {
  steam_id: string;
  import_all?: boolean;
  default_status?: string;
}

export interface ImportFromSteamResponse {
  total_found?: number;
  imported?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  message?: string;
}

export const gameShowcaseApi = {
  getList: (params?: {
    page?: number;
    size?: number;
    platform?: string;
    category?: string;
    status?: string;
    tags?: string;
    is_favorite?: boolean;
    is_active?: boolean;
    is_r18?: boolean;
    sort_by?: string;
    skip?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.size != null) searchParams.set('size', String(params.size));
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tags) searchParams.set('tags', params.tags);
    if (params?.is_favorite != null) searchParams.set('is_favorite', String(params.is_favorite));
    if (params?.is_active != null) searchParams.set('is_active', String(params.is_active));
    if (params?.is_r18 != null) searchParams.set('is_r18', String(params.is_r18));
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.skip != null) searchParams.set('skip', String(params.skip));
    if (params?.limit != null) searchParams.set('limit', String(params.limit));
    const q = searchParams.toString();
    return axios
      .get<GameListResponse>(`${baseUrl}/api/v1/game-showcase/list?${q}`, {
        headers: getHeaders(),
      })
      .then((r) => r.data);
  },

  getOne: (id: number) =>
    axios
      .get<GameShowcase>(`${baseUrl}/api/v1/game-showcase/${id}`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  create: (data: Partial<GameShowcase>) =>
    axios
      .post<GameShowcase>(`${baseUrl}/api/v1/game-showcase/`, data, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  update: (id: number, data: Partial<GameShowcase>) =>
    axios
      .put<GameShowcase>(`${baseUrl}/api/v1/game-showcase/${id}`, data, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  delete: (id: number) =>
    axios
      .delete<{ message?: string }>(`${baseUrl}/api/v1/game-showcase/${id}`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getStats: () =>
    axios
      .get<GameStats>(`${baseUrl}/api/v1/game-showcase/stats`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  importFromSteam: (data: ImportFromSteamRequest, timeoutMs = 300000) =>
    axios
      .post<ImportFromSteamResponse>(`${baseUrl}/api/v1/game-showcase/import-from-steam`, data, {
        headers: getHeaders(),
        timeout: timeoutMs,
      })
      .then((r) => r.data),

  syncFromSteam: (steamId: string) =>
    axios
      .post<ImportFromSteamResponse>(
        `${baseUrl}/api/v1/game-showcase/sync-from-steam?steam_id=${encodeURIComponent(steamId)}`,
        null,
        { headers: getHeaders(), timeout: 120000 }
      )
      .then((r) => r.data),
};
