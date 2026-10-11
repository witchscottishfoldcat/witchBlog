/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicTrackCategoryStats } from './MusicTrackCategoryStats';
import type { MusicTrackStatusStats } from './MusicTrackStatusStats';
/**
 * 音乐馆统计数据
 */
export type MusicPublicStats = {
    /**
     * 歌单总数
     */
    total_playlists?: number;
    /**
     * 歌曲总数
     */
    total_tracks?: number;
    /**
     * 总播放次数
     */
    total_play_count?: number;
    /**
     * 收藏歌曲数
     */
    favorite_count?: number;
    /**
     * 分类统计
     */
    category_stats?: Array<MusicTrackCategoryStats>;
    /**
     * 状态统计
     */
    status_stats?: Array<MusicTrackStatusStats>;
};

