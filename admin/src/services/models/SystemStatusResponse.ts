/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 系统状态响应
 */
export type SystemStatusResponse = {
    /**
     * 系统状态: healthy, degraded, unhealthy
     */
    status: string;
    /**
     * 检查时间
     */
    timestamp: string;
    /**
     * 运行时间(秒)
     */
    uptime: number;
    /**
     * 版本号
     */
    version: string;
    /**
     * 运行环境
     */
    environment: string;
    /**
     * 各组件状态
     */
    components: Record<string, string>;
    /**
     * 健康检查详情
     */
    health_checks: Record<string, any>;
};

