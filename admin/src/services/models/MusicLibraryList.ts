/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicLibrary } from './MusicLibrary';
/**
 * 音乐库列表响应模型
 */
export type MusicLibraryList = {
    items: Array<MusicLibrary>;
    total: number;
    page: number;
    size: number;
    pages: number;
};

