/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicPublicTrack } from './MusicPublicTrack';
/**
 * 前台歌曲列表响应
 */
export type MusicPublicTrackList = {
    items: Array<MusicPublicTrack>;
    total: number;
    page: number;
    size: number;
    pages: number;
};

