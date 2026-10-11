/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIProvider } from './AIProvider';
import type { AIProviderInfo } from './AIProviderInfo';
/**
 * AI提供商列表响应模型
 */
export type AIProvidersResponse = {
    /**
     * 提供商列表
     */
    providers?: Array<AIProviderInfo>;
    /**
     * 默认提供商
     */
    default_provider: AIProvider;
};

