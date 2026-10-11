/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 任务状态响应
 */
export type TaskStatusResponse = {
    name: string;
    description: (string | null);
    trigger_type: string;
    schedule: string;
    is_enabled: boolean;
    is_running: boolean;
    last_run_at: (string | null);
    next_run_at: (string | null);
    last_status: (string | null);
    last_error: (string | null);
    last_duration: (number | null);
    run_count: number;
};

