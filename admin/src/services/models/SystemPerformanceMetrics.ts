/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 系统性能指标
 */
export type SystemPerformanceMetrics = {
    /**
     * CPU使用率(%)
     */
    cpu_percent: number;
    /**
     * CPU核心数
     */
    cpu_count: number;
    /**
     * 总内存(MB)
     */
    memory_total: number;
    /**
     * 已用内存(MB)
     */
    memory_used: number;
    /**
     * 内存使用率(%)
     */
    memory_percent: number;
    /**
     * 总磁盘空间(MB)
     */
    disk_total: number;
    /**
     * 已用磁盘空间(MB)
     */
    disk_used: number;
    /**
     * 磁盘使用率(%)
     */
    disk_percent: number;
    /**
     * 网络发送字节数
     */
    network_sent: number;
    /**
     * 网络接收字节数
     */
    network_recv: number;
    /**
     * 系统启动时间
     */
    boot_time: string;
    /**
     * 系统运行时间(秒)
     */
    uptime: number;
};

