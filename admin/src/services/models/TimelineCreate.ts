/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建时间线请求模型
 */
export type TimelineCreate = {
    /**
     * 经历名称
     */
    title: string;
    /**
     * 副标题
     */
    subtitle?: (string | null);
    /**
     * 介绍
     */
    description?: (string | null);
    /**
     * 开始时间
     */
    start_date: string;
    /**
     * 结束时间，可以为空表示当前
     */
    end_date?: (string | null);
    /**
     * 地点
     */
    location?: (string | null);
    /**
     * 标签，如教育经历、工作经历等
     */
    tags?: (Array<string> | null);
    /**
     * 小标签，所学技能或成就等
     */
    skills?: (Array<string> | null);
    /**
     * 是否公开
     */
    is_public?: boolean;
};

