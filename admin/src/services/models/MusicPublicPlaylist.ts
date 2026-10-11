/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 前台歌单展示模型（精简字段）
 */
export type MusicPublicPlaylist = {
    id: number;
    /**
     * 歌单标题
     */
    title: string;
    /**
     * 歌单描述
     */
    description?: (string | null);
    /**
     * 封面图片链接
     */
    cover_image_url?: (string | null);
    /**
     * 标签
     */
    tags?: (string | null);
    /**
     * 歌曲数量
     */
    track_count?: number;
    /**
     * 浏览次数
     */
    view_count?: number;
    created_at: string;
};

