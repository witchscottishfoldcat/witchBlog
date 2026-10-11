/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建音乐曲目
 */
export type MusicTrackCreate = {
    /**
     * 所属歌单ID
     */
    library_id?: (number | null);
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
     * 网易云歌曲ID
     */
    netease_id: string;
    /**
     * 网易云链接
     */
    netease_url: string;
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
     * 分类: pop, rock, jazz, classical, electronic, hip_hop, country, blues, folk, r_and_b, other
     */
    category?: string;
    /**
     * 标签，多个标签用逗号分隔
     */
    tags?: (string | null);
    /**
     * 状态: unplayed(未听), listening(在听), completed(已听完), disliked(不喜欢)
     */
    status?: string;
    /**
     * 播放次数
     */
    play_count?: number;
    /**
     * 个人评分(1-10分)
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

