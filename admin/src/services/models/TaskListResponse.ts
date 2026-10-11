/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskStatusResponse } from './TaskStatusResponse';
/**
 * 任务列表响应
 */
export type TaskListResponse = {
    tasks: Array<TaskStatusResponse>;
    total: number;
    enabled_count: number;
    disabled_count: number;
};

