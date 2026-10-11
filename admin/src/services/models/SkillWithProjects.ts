/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelatedProject } from './RelatedProject';
import type { SkillPeriod } from './SkillPeriod';
/**
 * 包含相关项目的技能详情
 */
export type SkillWithProjects = {
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
    related_projects?: Array<RelatedProject>;
    project_count?: number;
};

