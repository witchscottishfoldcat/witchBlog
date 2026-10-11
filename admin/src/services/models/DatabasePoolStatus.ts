/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 数据库连接池状态
 */
export type DatabasePoolStatus = {
    /**
     * 连接池大小
     */
    pool_size: number;
    /**
     * 最大溢出连接数
     */
    max_overflow: number;
    /**
     * 已归还连接数
     */
    checked_in: number;
    /**
     * 已取出连接数
     */
    checked_out: number;
    /**
     * 溢出连接数
     */
    overflow: number;
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
     * 当前物理连接数
     */
    current_connections: number;
    /**
     * 连接池状态
     */
    status: string;
};

