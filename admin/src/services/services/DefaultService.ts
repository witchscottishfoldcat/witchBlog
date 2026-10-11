/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Root
     * 根路径
     * @returns any Successful Response
     * @throws ApiError
     */
    public static rootGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
        });
    }
    /**
     * Health Check
     * 健康检查
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthCheckHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Proxy Image
     * 全局图片代理端点 - 解决前端跨域获取图片的问题
     *
     * 使用方式:
     * 前端: <img src="http://localhost:5178/api/proxy/image?url=https://example.com/image.jpg" />
     * @param url
     * @returns any Successful Response
     * @throws ApiError
     */
    public static proxyImageApiProxyImageGet(
        url: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/proxy-image',
            query: {
                'url': url,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
