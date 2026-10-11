/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIProvider } from './AIProvider';
/**
 * AI模型信息模型
 */
export type AIModelInfo = {
    /**
     * AI提供商
     */
    provider: AIProvider;
    /**
     * 模型名称
     */
    model: string;
    /**
     * 显示名称
     */
    display_name: string;
    /**
     * 模型描述
     */
    description: string;
    /**
     * 是否支持视觉
     */
    supports_vision?: boolean;
    /**
     * 最大token数
     */
    max_tokens?: (number | null);
};

