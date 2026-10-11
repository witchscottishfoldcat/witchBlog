/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PhotoResponse } from './PhotoResponse';
/**
 * 照片列表响应模型
 */
export type PhotoListResponse = {
    photos: Array<PhotoResponse>;
    total: number;
    page: number;
    per_page: number;
};

