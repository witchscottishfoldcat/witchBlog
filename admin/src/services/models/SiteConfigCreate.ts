/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建站点配置
 */
export type SiteConfigCreate = {
    /**
     * 站点名称
     */
    site_name: string;
    /**
     * 站点签名
     */
    site_signature?: (string | null);
    /**
     * 站点公告
     */
    site_announcement?: (string | null);
    /**
     * 站点图标URL
     */
    site_icon?: (string | null);
    /**
     * 个人头像URL
     */
    profile_image?: (string | null);
    /**
     * 是否启用
     */
    is_active?: (boolean | null);
};

