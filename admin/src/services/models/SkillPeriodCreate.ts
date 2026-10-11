/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建技能学习时间段请求模型
 */
export type SkillPeriodCreate = {
    /**
     * 开始时间
     */
    start_date: string;
    /**
     * 结束时间，为空表示至今
     */
    end_date?: (string | null);
    /**
     * 备注
     */
    notes?: (string | null);
};

