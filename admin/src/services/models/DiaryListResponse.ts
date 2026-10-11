/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DiaryResponse } from './DiaryResponse';
/**
 * 日记列表响应模型
 */
export type DiaryListResponse = {
    diaries: Array<DiaryResponse>;
    total: number;
    page: number;
    per_page: number;
};

