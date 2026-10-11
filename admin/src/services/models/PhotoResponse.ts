/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 照片响应模型
 */
export type PhotoResponse = {
    /**
     * 照片标题
     */
    title?: (string | null);
    /**
     * 照片描述
     */
    description?: (string | null);
    /**
     * 标签列表
     */
    tags?: (Array<string> | null);
    /**
     * 是否设为封面
     */
    is_cover?: boolean;
    /**
     * 排序权重
     */
    sort_order?: number;
    id: number;
    album_id: number;
    minio_bucket: string;
    minio_object_name: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    width?: (number | null);
    height?: (number | null);
    thumbnail_minio_object_name?: (string | null);
    created_at: string;
    updated_at: string;
    /**
     * 图片访问URL
     */
    image_url: string;
    /**
     * 缩略图访问URL
     */
    thumbnail_url?: (string | null);
};

