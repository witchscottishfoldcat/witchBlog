/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 技能学习时间段响应模型
 */
export type SkillPeriod = {
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
    id: number;
    skill_id: number;
    created_at: string;
    updated_at: string;
};

