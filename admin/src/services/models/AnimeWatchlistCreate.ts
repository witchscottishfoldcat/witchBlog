/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建追番追剧
 */
export type AnimeWatchlistCreate = {
    /**
     * 动漫/剧集标题
     */
    title: string;
    /**
     * 观看链接地址
     */
    url: string;
    /**
     * 封面图片链接
     */
    cover_image_url?: (string | null);
    /**
     * 简介/描述
     */
    description?: (string | null);
    /**
     * 分类: anime(动漫), drama(剧集), other(其他)
     */
    category?: string;
    /**
     * 标签，多个标签用逗号分隔
     */
    tags?: (string | null);
    /**
     * 状态: want_watch(想看), watching(在看), completed(已看完), dropped(已弃)
     */
    status?: string;
    /**
     * 观看进度百分比(0-100)
     */
    progress?: number;
    /**
     * 当前看到第几集
     */
    current_episode?: (number | null);
    /**
     * 总集数
     */
    total_episodes?: (number | null);
    /**
     * 个人评分(0-10分，0表示未评分)
     */
    rating?: (number | null);
    /**
     * 是否收藏
     */
    is_favorite?: boolean;
    /**
     * 是否启用
     */
    is_active?: boolean;
    /**
     * 排序权重
     */
    sort_order?: number;
};

