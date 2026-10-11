/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 从网易云导入歌单请求
 */
export type ImportFromNeteaseRequest = {
    /**
     * 网易云歌单ID
     */
    netease_playlist_id: string;
    /**
     * 自定义歌单标题，如果不填则使用网易云原标题
     */
    title?: (string | null);
    /**
     * 自定义歌单描述
     */
    description?: (string | null);
    /**
     * 标签，多个标签用逗号分隔
     */
    tags?: (string | null);
    /**
     * 是否公开
     */
    is_public?: boolean;
};

