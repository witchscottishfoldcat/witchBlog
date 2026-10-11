/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimelineResponse } from './TimelineResponse';
/**
 * 时间线列表响应模型
 */
export type TimelineListResponse = {
    timelines: Array<TimelineResponse>;
    total: number;
    skip: number;
    limit: number;
};

