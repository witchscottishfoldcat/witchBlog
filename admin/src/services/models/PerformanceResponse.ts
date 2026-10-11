/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationPerformanceMetrics } from './ApplicationPerformanceMetrics';
import type { BusinessMetrics } from './BusinessMetrics';
import type { DatabasePerformanceMetrics } from './DatabasePerformanceMetrics';
import type { SystemPerformanceMetrics } from './SystemPerformanceMetrics';
/**
 * 性能监控响应
 */
export type PerformanceResponse = {
    /**
     * 时间戳
     */
    timestamp: string;
    system: SystemPerformanceMetrics;
    application: ApplicationPerformanceMetrics;
    database: DatabasePerformanceMetrics;
    business: BusinessMetrics;
};

