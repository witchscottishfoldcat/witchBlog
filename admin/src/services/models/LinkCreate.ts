/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建链接模型
 */
export type LinkCreate = {
    name: string;
    url: string;
    description?: (string | null);
    image_url?: (string | null);
    image_type?: (string | null);
    tags?: (string | null);
    category?: string;
    is_active?: boolean;
    sort_order?: number;
};

