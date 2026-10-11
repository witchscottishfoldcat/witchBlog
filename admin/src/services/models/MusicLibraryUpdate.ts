/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新音乐库
 */
export type MusicLibraryUpdate = {
    /**
     * 歌单标题
     */
    title?: (string | null);
    /**
     * 歌单描述
     */
    description?: (string | null);
    /**
     * 网易云歌单ID
     */
    netease_playlist_id?: (string | null);
    /**
     * 网易云链接
     */
    netease_url?: (string | null);
    /**
     * 封面图片链接
     */
    cover_image_url?: (string | null);
    /**
     * 标签，多个标签用逗号分隔
     */
    tags?: (string | null);
    /**
     * 是否公开
     */
    is_public?: (boolean | null);
    /**
     * 歌曲数量
     */
    track_count?: (number | null);
    /**
     * 是否启用
     */
    is_active?: (boolean | null);
    /**
     * 排序权重
     */
    sort_order?: (number | null);
};

