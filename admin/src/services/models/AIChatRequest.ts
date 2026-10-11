/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIMessage } from './AIMessage';
import type { AIProvider } from './AIProvider';
/**
 * AI聊天请求模型
 */
export type AIChatRequest = {
    /**
     * AI提供商，不填则使用默认
     */
    provider?: (AIProvider | null);
    /**
     * 模型名称，不填则使用默认模型
     */
    model?: (string | null);
    /**
     * 消息列表
     */
    messages: Array<AIMessage>;
    /**
     * 温度参数
     */
    temperature?: (number | null);
    /**
     * 最大生成token数
     */
    max_tokens?: (number | null);
    /**
     * 是否使用流式输出
     */
    stream?: (boolean | null);
};

