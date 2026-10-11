/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 音乐库完整模型
 */
export type MusicLibrary = {
    /**
     * 歌单标题
     */
    title: string;
    /**
     * 歌单描述
     */
    description?: (string | null);
    /**
     * 网易云歌单ID
     */
    netease_playlist_id: string;
    /**
     * 网易云链接
     */
    netease_url: string;
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
    is_public?: boolean;
    /**
     * 歌曲数量
     */
    track_count?: number;
    /**
     * 是否启用
     */
    is_active?: boolean;
    /**
     * 排序权重
     */
    sort_order?: number;
    id: number;
    /**
     * MinIO封面图片对象名
     */
    minio_cover_object_name?: (string | null);
    /**
     * 浏览次数
     */
    view_count?: number;
    /**
     * 创建用户ID
     */
    user_id?: (number | null);
    created_at: string;
    updated_at: string;
};

