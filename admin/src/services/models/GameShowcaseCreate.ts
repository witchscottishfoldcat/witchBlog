/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建游戏
 */
export type GameShowcaseCreate = {
    /**
     * 游戏名称
     */
    title: string;
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
     * 平台: steam, epic, ps, switch, pc, mobile, other
     */
    platform?: string;
    /**
     * 分类: rpg, fps, strategy, simulation, indie, adventure, other
     */
    category?: string;
    /**
     * 标签，逗号分隔
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
     * 状态: want_play(想玩), playing(在玩), completed(已通关), shelved(搁置), dropped(弃坑)
     */
    status?: string;
    /**
     * 游玩时长（分钟）
     */
    play_time?: number;
    /**
     * 个人评分(0-10分)
     */
    rating?: (number | null);
    /**
     * 个人短评
     */
    review?: (string | null);
    /**
     * 是否收藏
     */
    is_favorite?: boolean;
    /**
     * 是否启用
     */
    is_active?: boolean;
    /**
     * 是否 R18 成人内容（公开 API 默认过滤）
     */
    is_r18?: boolean;
    /**
     * 排序权重
     */
    sort_order?: number;
    /**
     * 发行日期
     */
    release_date?: (string | null);
};

