/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 应用性能指标
 */
export type ApplicationPerformanceMetrics = {
    /**
     * 总请求数
     */
    total_requests: number;
    /**
     * 今日请求数
     */
    today_requests: number;
    /**
     * 平均响应时间(ms)
     */
    average_response_time: number;
    /**
     * 错误率(%)
     */
    error_rate: number;
    /**
     * 活跃连接数
     */
    active_connections: number;
    /**
     * 应用运行时间(秒)
     */
    uptime: number;
    /**
     * 应用启动时间
     */
    start_time: string;
};

