/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIProvider } from './AIProvider';
/**
 * AI文本补全响应模型
 */
export type AITextCompletionResponse = {
    /**
     * 使用的AI提供商
     */
    provider: AIProvider;
    /**
     * 使用的模型
     */
    model: string;
    /**
     * 生成的文本
     */
    text: string;
    /**
     * token使用情况
     */
    usage?: (Record<string, any> | null);
    /**
     * 结束原因
     */
    finish_reason?: (string | null);
};

