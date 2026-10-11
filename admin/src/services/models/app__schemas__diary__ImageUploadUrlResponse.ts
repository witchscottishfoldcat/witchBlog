/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 图片上传URL响应模型
 */
export type app__schemas__diary__ImageUploadUrlResponse = {
    /**
     * 预签名上传URL
     */
    upload_url: string;
    /**
     * MinIO对象名称
     */
    object_name: string;
    /**
     * URL过期时间（秒）
     */
    expires_in: number;
};

