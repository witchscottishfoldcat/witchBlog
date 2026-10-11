/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 图片上传URL响应模型
 */
export type app__schemas__album__ImageUploadUrlResponse = {
    /**
     * 图片上传URL
     */
    upload_url: string;
    /**
     * 文件在MinIO中的键名
     */
    file_key: string;
    /**
     * MinIO桶名
     */
    minio_bucket: string;
    /**
     * 链接过期时间
     */
    expire_at: string;
};

