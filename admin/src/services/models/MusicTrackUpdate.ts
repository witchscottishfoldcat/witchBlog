/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新音乐曲目
 */
export type MusicTrackUpdate = {
    /**
     * 所属歌单ID
     */
    library_id?: (number | null);
    /**
     * 歌曲标题
     */
    title?: (string | null);
    /**
     * 艺术家
     */
    artist?: (string | null);
    /**
     * 专辑名
     */
    album?: (string | null);
    /**
     * 网易云歌曲ID
     */
    netease_id?: (string | null);
    /**
     * 网易云链接
     */
    netease_url?: (string | null);
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
     * 简介/描述
     */
    description?: (string | null);
    /**
     * 歌词
     */
    lyrics?: (string | null);
    /**
     * 分类
     */
    category?: (string | null);
    /**
     * 标签，多个标签用逗号分隔
     */
    tags?: (string | null);
    /**
     * 状态
     */
    status?: (string | null);
    /**
     * 播放次数
     */
    play_count?: (number | null);
    /**
     * 个人评分(1-10分)
     */
    rating?: (number | null);
    /**
     * 是否收藏
     */
    is_favorite?: (boolean | null);
    /**
     * 是否启用
     */
    is_active?: (boolean | null);
    /**
     * 排序权重
     */
    sort_order?: (number | null);
};

