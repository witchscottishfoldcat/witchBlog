/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 前台歌曲展示模型（精简字段）
 */
export type MusicPublicTrack = {
    id: number;
    /**
     * 歌曲标题
     */
    title: string;
    /**
     * 艺术家
     */
    artist: string;
    /**
     * 专辑名
     */
    album?: (string | null);
    /**
     * 封面图片链接
     */
    cover_image_url?: (string | null);
    /**
     * 时长（秒）
     */
    duration?: (number | null);
    /**
     * 发行年份
     */
    year?: (number | null);
    /**
     * 流派
     */
    genre?: (string | null);
    /**
     * 分类
     */
    category?: string;
    /**
     * 标签
     */
    tags?: (string | null);
    /**
     * 状态
     */
    status?: string;
    /**
     * 播放次数
     */
    play_count?: number;
    /**
     * 评分
     */
    rating?: (number | null);
    /**
     * 是否收藏
     */
    is_favorite?: boolean;
    /**
     * 网易云歌曲ID
     */
    netease_id: string;
};

