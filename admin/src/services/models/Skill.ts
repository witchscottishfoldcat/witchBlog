/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SkillPeriod } from './SkillPeriod';
/**
 * 技能响应模型
 */
export type Skill = {
    /**
     * 技能名称
     */
    name: string;
    /**
     * 技能类别
     */
    category: string;
    /**
     * 技能描述
     */
    description?: (string | null);
    id: number;
    total_learning_days: number;
    current_level: string;
    created_at: string;
    updated_at: string;
    periods?: Array<SkillPeriod>;
};

