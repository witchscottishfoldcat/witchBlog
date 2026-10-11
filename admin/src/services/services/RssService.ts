/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RssService {
    /**
     * Get Rss Feed
     * 获取全局RSS feed
     *
     * 返回包含最新公开文章的RSS 2.0格式XML内容。
     *
     * - 包含最新的公开MD文件（is_public=True）
     * - 默认显示10篇文章，最多支持100篇
     * - 使用站点配置作为feed元数据
     * - 符合RSS 2.0标准格式
     * - 支持缓存（默认10分钟），可通过refresh参数强制刷新
     *
     * Returns:
     * Response: application/xml格式的RSS内容
     * @param limit RSS feed中包含的文章数量
     * @param refresh 是否强制刷新缓存
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getRssFeedRssFeedGet(
        limit?: (number | null),
        refresh?: (boolean | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/rss/feed',
            query: {
                'limit': limit,
                'refresh': refresh,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clear Rss Cache
     * 清除RSS缓存（需要认证）
     *
     * - 清除RSS feed缓存，下次访问时会重新生成
     * - 可以清除所有缓存或指定limit的缓存
     * - 只有认证用户才能调用
     *
     * Returns:
     * 操作结果
     * @param limit 清除指定limit的缓存
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clearRssCacheRssCacheDelete(
        limit?: (number | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/rss/cache',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Cache Info
     * 获取RSS缓存信息（需要认证）
     *
     * - 查看当前缓存状态
     * - 包括缓存数量、缓存键、过期时间等信息
     * - 只有认证用户才能调用
     *
     * Returns:
     * 缓存信息
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getCacheInfoRssCacheInfoGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/rss/cache/info',
        });
    }
}
