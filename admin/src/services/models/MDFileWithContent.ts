/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 带内容的MD文件模型
 */
export type MDFileWithContent = {
    /**
     * 文件标题
     */
    title: string;
    /**
     * 文件描述
     */
    description?: (string | null);
    /**
     * 标签，以逗号分隔
     */
    tags?: (string | null);
    /**
     * 是否公开
     */
    is_public?: (boolean | null);
    /**
     * 发布日期
     */
    published?: (string | null);
    /**
     * 文章一级分类
     */
    category?: (string | null);
    /**
     * 文章二级分类
     */
    subcategory?: (string | null);
    /**
     * 是否置顶
     */
    pinned?: (boolean | null);
    /**
     * 是否加密
     */
    encrypted?: (boolean | null);
    /**
     * 作者
     */
    author?: (string | null);
    id: number;
    original_filename: string;
    object_name: string;
    bucket_name: string;
    file_size: (number | null);
    file_url: (string | null);
    proxy_url: (string | null);
    etag: (string | null);
    word_count: number;
    owner_id: number;
    created_at: string;
    updated_at: string;
    /**
     * 解析的完整元数据
     */
    parsed_metadata?: (Record<string, any> | null);
    content: string;
};

