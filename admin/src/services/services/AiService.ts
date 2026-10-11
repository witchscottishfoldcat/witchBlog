/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIChatRequest } from '../models/AIChatRequest';
import type { AIChatResponse } from '../models/AIChatResponse';
import type { AIProvider } from '../models/AIProvider';
import type { AIProvidersResponse } from '../models/AIProvidersResponse';
import type { AITextCompletionRequest } from '../models/AITextCompletionRequest';
import type { AITextCompletionResponse } from '../models/AITextCompletionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiService {
    /**
     * Get Providers
     * 获取所有AI提供商信息
     * @returns AIProvidersResponse Successful Response
     * @throws ApiError
     */
    public static getProvidersApiV1AiProvidersGet(): CancelablePromise<AIProvidersResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ai/providers',
        });
    }
    /**
     * Chat
     * AI聊天对话
     * @param requestBody
     * @returns AIChatResponse Successful Response
     * @throws ApiError
     */
    public static chatApiV1AiChatPost(
        requestBody: AIChatRequest,
    ): CancelablePromise<AIChatResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ai/chat',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Chat Stream
     * AI流式聊天对话
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static chatStreamApiV1AiChatStreamPost(
        requestBody: AIChatRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ai/chat/stream',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Text Completion
     * AI文本补全
     * @param requestBody
     * @returns AITextCompletionResponse Successful Response
     * @throws ApiError
     */
    public static textCompletionApiV1AiCompletionPost(
        requestBody: AITextCompletionRequest,
    ): CancelablePromise<AITextCompletionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ai/completion',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Models
     * 获取指定提供商的模型列表
     * @param provider
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getModelsApiV1AiModelsProviderGet(
        provider: AIProvider,
    ): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ai/models/{provider}',
            path: {
                'provider': provider,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
