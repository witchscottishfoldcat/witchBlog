/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIMessage } from './AIMessage';
import type { AIProvider } from './AIProvider';
/**
 * AI聊天响应模型
 */
export type AIChatResponse = {
    /**
     * 使用的AI提供商
     */
    provider: AIProvider;
    /**
     * 使用的模型
     */
    model: string;
    /**
     * AI回复消息
     */
    message: AIMessage;
    /**
     * 推理内容（部分模型如GLM-4.6V-Flash提供）
     */
    reasoning_content?: (string | null);
    /**
     * token使用情况
     */
    usage?: (Record<string, any> | null);
    /**
     * 结束原因
     */
    finish_reason?: (string | null);
};

