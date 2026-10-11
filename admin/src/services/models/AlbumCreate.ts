/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建相册请求模型
 */
export type AlbumCreate = {
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
};

