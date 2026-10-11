import axios from 'axios';
import { OpenAPI } from './core/OpenAPI';
import { getAuthToken } from '../config/api';

const baseUrl = OpenAPI.BASE || '';

const getHeaders = () => ({
  Authorization: `Bearer ${OpenAPI.TOKEN || getAuthToken()}`,
});

export interface MusicLibrary {
  id: number;
  title: string;
  description?: string;
  netease_playlist_id?: string;
  netease_url?: string;
  cover_image_url?: string;
  tags?: string;
  is_public?: boolean;
  track_count?: number;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MusicTrack {
  id: number;
  library_id: number;
  title: string;
  artist?: string;
  album?: string;
  netease_id?: string;
  netease_url?: string;
  cover_image_url?: string;
  duration?: number;
  year?: number;
  genre?: string;
  category?: string;
  tags?: string;
  status?: string;
  play_count?: number;
  rating?: number;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerResponse {
  iframe_code?: string;
}

export interface ImportFromNeteaseRequest {
  netease_playlist_id: string;
  title?: string;
  description?: string;
  tags?: string;
  is_public?: boolean;
}

export const musicApi = {
  getLibraries: () =>
    axios
      .get<MusicLibrary[]>(`${baseUrl}/api/v1/music-libraries/`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getLibrary: (id: number) =>
    axios
      .get<MusicLibrary & { tracks?: MusicTrack[] }>(`${baseUrl}/api/v1/music-libraries/${id}`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  importFromNetease: (data: ImportFromNeteaseRequest) =>
    axios
      .post<MusicLibrary>(`${baseUrl}/api/v1/music-libraries/import-from-netease`, data, {
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      })
      .then((r) => r.data),

  syncLibrary: (id: number) =>
    axios
      .post<MusicLibrary>(`${baseUrl}/api/v1/music-libraries/${id}/sync`, null, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  deleteLibrary: (id: number) =>
    axios
      .delete(`${baseUrl}/api/v1/music-libraries/${id}`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getTrackPlayer: (trackId: number) =>
    axios
      .get<PlayerResponse>(`${baseUrl}/api/v1/music-tracks/${trackId}/player`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  getTrackLyrics: (trackId: number) =>
    axios
      .get<{ lyrics?: string }>(`${baseUrl}/api/v1/music-tracks/${trackId}/lyrics`, {
        headers: getHeaders(),
      })
      .then((r) => r.data),

  recordPlay: (trackId: number) =>
    axios
      .post(`${baseUrl}/api/v1/music-tracks/${trackId}/play`, null, {
        headers: getHeaders(),
      })
      .then((r) => r.data),
};
