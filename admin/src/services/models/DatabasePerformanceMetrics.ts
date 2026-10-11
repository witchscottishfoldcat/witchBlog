/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 数据库性能指标
 */
export type DatabasePerformanceMetrics = {
    /**
     * 连接池大小
     */
    pool_size: number;
    /**
     * 已取出连接数
     */
    checked_out: number;
    /**
     * 已归还连接数
     */
    checked_in: number;
    /**
     * 无效连接数
     */
    invalid: number;
    /**
     * 总连接数
     */
    total_connections: number;
    /**
     * 连接错误数
     */
    connection_errors: number;
    /**
     * 数据库状态
     */
    status: string;
};

