/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicTrack } from './MusicTrack';
/**
 * 音乐曲目列表响应模型
 */
export type MusicTrackList = {
    items: Array<MusicTrack>;
    total: number;
    page: number;
    size: number;
    pages: number;
};

