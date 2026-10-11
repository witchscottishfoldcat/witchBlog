/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 详细统计响应模型
 */
export type DetailedStatsResponse = {
    /**
     * 统计周期
     */
    period: string;
    /**
     * 开始日期
     */
    start_date: string;
    /**
     * 结束日期
     */
    end_date: string;
    /**
     * 每日请求数据
     */
    requests_by_day: Array<any>;
    /**
     * 每日访问者数据
     */
    visitors_by_day: Array<any>;
    /**
     * 热门页面
     */
    popular_pages: Array<any>;
    /**
     * 来源网站
     */
    referrers?: Array<any>;
};

