/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 站点统计响应模型
 */
export type SiteStatsResponse = {
    /**
     * 站点运行天数
     */
    uptime_days: number;
    /**
     * 站点运行小时数
     */
    uptime_hours: number;
    /**
     * 站点启动时间
     */
    start_time: string;
    /**
     * 总请求次数
     */
    total_requests: number;
    /**
     * 今日请求次数
     */
    today_requests: number;
    /**
     * 总访问者数量
     */
    total_visitors: number;
    /**
     * 今日访问者数量
     */
    today_visitors: number;
    /**
     * 平均每日请求数
     */
    average_requests_per_day: number;
    /**
     * 热门页面
     */
    top_pages?: Array<any>;
    /**
     * 相册数量
     */
    album_count: number;
    /**
     * 照片数量
     */
    photo_count: number;
    /**
     * 日记数量
     */
    diary_count: number;
    /**
     * 内存使用量(MB)
     */
    memory_usage_mb: number;
    /**
     * 数据库连接数
     */
    db_connections: number;
};

