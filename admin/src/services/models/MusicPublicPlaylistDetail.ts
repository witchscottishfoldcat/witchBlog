/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicPublicTrack } from './MusicPublicTrack';
/**
 * 前台歌单详情（含歌曲列表）
 */
export type MusicPublicPlaylistDetail = {
    id: number;
    /**
     * 歌单标题
     */
    title: string;
    /**
     * 歌单描述
     */
    description?: (string | null);
    /**
     * 封面图片链接
     */
    cover_image_url?: (string | null);
    /**
     * 标签
     */
    tags?: (string | null);
    /**
     * 歌曲数量
     */
    track_count?: number;
    /**
     * 浏览次数
     */
    view_count?: number;
    created_at: string;
    /**
     * 歌曲列表
     */
    tracks?: Array<MusicPublicTrack>;
    /**
     * 歌曲总数
     */
    total_tracks?: number;
    /**
     * 总时长（秒）
     */
    total_duration?: number;
};

