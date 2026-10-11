/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PhotoInfo } from './PhotoInfo';
/**
 * 相册响应模型
 */
export type AlbumResponse = {
    /**
     * 相册标题
     */
    title: string;
    /**
     * 相册描述
     */
    description?: (string | null);
    /**
     * 标签列表
     */
    tags?: (Array<string> | null);
    /**
     * 是否公开
     */
    is_public?: boolean;
    id: number;
    user_id?: (number | null);
    cover_photo_id?: (number | null);
    view_count?: number;
    created_at: string;
    updated_at: string;
    /**
     * 相册照片列表
     */
    photos?: Array<PhotoInfo>;
    /**
     * 封面照片
     */
    cover_photo?: (PhotoInfo | null);
    /**
     * 照片数量
     */
    photo_count?: number;
};

