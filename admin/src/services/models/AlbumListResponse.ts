/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlbumResponse } from './AlbumResponse';
/**
 * 相册列表响应模型
 */
export type AlbumListResponse = {
    albums: Array<AlbumResponse>;
    total: number;
    page: number;
    per_page: number;
};

