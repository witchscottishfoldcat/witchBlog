/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 日记图片信息模型
 */
export type DiaryImageInfo = {
    id: number;
    minio_bucket: string;
    minio_object_name: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    width?: (number | null);
    height?: (number | null);
    /**
     * 图片访问URL
     */
    image_url: string;
    created_at: string;
};

