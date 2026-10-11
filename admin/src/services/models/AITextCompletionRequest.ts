/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIProvider } from './AIProvider';
/**
 * AI文本补全请求模型
 */
export type AITextCompletionRequest = {
    /**
     * AI提供商
     */
    provider?: (AIProvider | null);
    /**
     * 模型名称
     */
    model?: (string | null);
    /**
     * 提示词
     */
    prompt: string;
    /**
     * 温度参数
     */
    temperature?: (number | null);
    /**
     * 最大生成token数
     */
    max_tokens?: (number | null);
};

