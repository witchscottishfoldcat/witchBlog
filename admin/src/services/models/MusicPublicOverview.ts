/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicPublicPlaylist } from './MusicPublicPlaylist';
import type { MusicPublicStats } from './MusicPublicStats';
import type { MusicPublicTrack } from './MusicPublicTrack';
/**
 * 音乐馆首页概览
 */
export type MusicPublicOverview = {
    /**
     * 统计数据
     */
    stats: MusicPublicStats;
    /**
     * 歌单列表
     */
    playlists?: Array<MusicPublicPlaylist>;
    /**
     * 最近添加的歌曲
     */
    recent_tracks?: Array<MusicPublicTrack>;
};

