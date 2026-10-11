/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIModelInfo } from './AIModelInfo';
import type { AIProvider } from './AIProvider';
/**
 * AI提供商信息模型
 */
export type AIProviderInfo = {
    /**
     * AI提供商
     */
    provider: AIProvider;
    /**
     * 提供商名称
     */
    name: string;
    /**
     * 支持的模型列表
     */
    models?: Array<AIModelInfo>;
    /**
     * 是否可用
     */
    is_available?: boolean;
    /**
     * 是否配置了API密钥
     */
    has_api_key?: boolean;
};

