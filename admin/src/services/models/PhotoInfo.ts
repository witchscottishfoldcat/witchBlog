/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 照片信息模型
 */
export type PhotoInfo = {
    id: number;
    minio_bucket: string;
    minio_object_name: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    width?: (number | null);
    height?: (number | null);
    title?: (string | null);
    description?: (string | null);
    tags?: (Array<string> | null);
    thumbnail_minio_object_name?: (string | null);
    is_cover?: boolean;
    sort_order?: number;
    /**
     * 图片访问URL
     */
    image_url: string;
    /**
     * 缩略图访问URL
     */
    thumbnail_url?: (string | null);
    created_at: string;
};

