/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新日记请求模型
 */
export type DiaryUpdate = {
    /**
     * 日记标题
     */
    title?: (string | null);
    /**
     * 日记内容
     */
    content?: (string | null);
    /**
     * 天气标签
     */
    weather?: (string | null);
    /**
     * 心情标签
     */
    mood?: (string | null);
    /**
     * 标签列表
     */
    tags?: (Array<string> | null);
    /**
     * 是否公开
     */
    is_public?: (boolean | null);
};

