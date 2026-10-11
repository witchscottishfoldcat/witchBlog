/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新游戏
 */
export type GameShowcaseUpdate = {
    /**
     * 游戏名称
     */
    title?: (string | null);
    /**
     * 游戏简介
     */
    description?: (string | null);
    /**
     * 封面图片链接
     */
    cover_image_url?: (string | null);
    /**
     * Steam AppID
     */
    steam_appid?: (string | null);
    /**
     * Steam 商店链接
     */
    steam_url?: (string | null);
    /**
     * 平台
     */
    platform?: (string | null);
    /**
     * 分类
     */
    category?: (string | null);
    /**
     * 标签
     */
    tags?: (string | null);
    /**
     * 开发商
     */
    developer?: (string | null);
    /**
     * 发行商
     */
    publisher?: (string | null);
    /**
     * 状态
     */
    status?: (string | null);
    /**
     * 游玩时长（分钟）
     */
    play_time?: (number | null);
    /**
     * 个人评分
     */
    rating?: (number | null);
    /**
     * 个人短评
     */
    review?: (string | null);
    /**
     * 是否收藏
     */
    is_favorite?: (boolean | null);
    /**
     * 是否启用
     */
    is_active?: (boolean | null);
    /**
     * 是否 R18 成人内容
     */
    is_r18?: (boolean | null);
    /**
     * 排序权重
     */
    sort_order?: (number | null);
    /**
     * 发行日期
     */
    release_date?: (string | null);
};

