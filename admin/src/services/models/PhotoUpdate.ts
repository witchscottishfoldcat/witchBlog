/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新照片请求模型
 */
export type PhotoUpdate = {
    /**
     * 照片标题
     */
    title?: (string | null);
    /**
     * 照片描述
     */
    description?: (string | null);
    /**
     * 标签列表
     */
    tags?: (Array<string> | null);
    /**
     * 是否设为封面
     */
    is_cover?: (boolean | null);
    /**
     * 排序权重
     */
    sort_order?: (number | null);
};

