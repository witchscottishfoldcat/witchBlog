/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新MD文件模型
 */
export type MDFileUpdate = {
    /**
     * 文件标题
     */
    title?: (string | null);
    /**
     * 文件描述
     */
    description?: (string | null);
    /**
     * MD文件内容
     */
    content?: (string | null);
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
};

