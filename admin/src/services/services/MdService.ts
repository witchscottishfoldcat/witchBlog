/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_md_file_api_v1_md_files_upload_post } from '../models/Body_upload_md_file_api_v1_md_files_upload_post';
import type { MDFile } from '../models/MDFile';
import type { MDFileArchive } from '../models/MDFileArchive';
import type { MDFileArchiveContent } from '../models/MDFileArchiveContent';
import type { MDFileCreate } from '../models/MDFileCreate';
import type { MDFileList } from '../models/MDFileList';
import type { MDFileUpdate } from '../models/MDFileUpdate';
import type { MDFileWithContent } from '../models/MDFileWithContent';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MdService {
    /**
     * Create Md File
     * 创建MD文件（通过JSON输入内容）
     * @param requestBody
     * @returns MDFile Successful Response
     * @throws ApiError
     */
    public static createMdFileApiV1MdFilesPost(
        requestBody: MDFileCreate,
    ): CancelablePromise<MDFile> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-files/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Md Files
     * 获取MD文件列表（超级管理员可见全部；普通用户仅公开文件）
     * @param skip 跳过的记录数
     * @param limit 返回的记录数
     * @param search 搜索关键词
     * @param isPublic 是否公开
     * @returns MDFileList Successful Response
     * @throws ApiError
     */
    public static listMdFilesApiV1MdFilesGet(
        skip?: number,
        limit: number = 100,
        search?: (string | null),
        isPublic?: (boolean | null),
    ): CancelablePromise<MDFileList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-files/',
            query: {
                'skip': skip,
                'limit': limit,
                'search': search,
                'is_public': isPublic,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Md File
     * 上传MD文件（通过文件上传）
     * @param formData
     * @returns MDFile Successful Response
     * @throws ApiError
     */
    public static uploadMdFileApiV1MdFilesUploadPost(
        formData: Body_upload_md_file_api_v1_md_files_upload_post,
    ): CancelablePromise<MDFile> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-files/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Public Md Files
     * 获取公开MD文件列表
     * @param skip 跳过的记录数
     * @param limit 返回的记录数
     * @param search 搜索关键词
     * @returns MDFileList Successful Response
     * @throws ApiError
     */
    public static listPublicMdFilesApiV1MdFilesPublicGet(
        skip?: number,
        limit: number = 100,
        search?: (string | null),
    ): CancelablePromise<MDFileList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-files/public',
            query: {
                'skip': skip,
                'limit': limit,
                'search': search,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Md File
     * 获取MD文件信息（私有文件仅 owner / 超级管理员）
     * @param fileId
     * @returns MDFile Successful Response
     * @throws ApiError
     */
    public static getMdFileApiV1MdFilesFileIdGet(
        fileId: number,
    ): CancelablePromise<MDFile> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-files/{file_id}',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Md File
     * 更新MD文件
     * @param fileId
     * @param requestBody
     * @returns MDFile Successful Response
     * @throws ApiError
     */
    public static updateMdFileApiV1MdFilesFileIdPut(
        fileId: number,
        requestBody: MDFileUpdate,
    ): CancelablePromise<MDFile> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/md-files/{file_id}',
            path: {
                'file_id': fileId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Md File
     * 删除MD文件
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteMdFileApiV1MdFilesFileIdDelete(
        fileId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/md-files/{file_id}',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Md File Content
     * 获取MD文件内容（私有文件仅 owner / 超级管理员）
     * @param fileId
     * @returns MDFileWithContent Successful Response
     * @throws ApiError
     */
    public static getMdFileContentApiV1MdFilesFileIdContentGet(
        fileId: number,
    ): CancelablePromise<MDFileWithContent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-files/{file_id}/content',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Toggle File Public Status
     * 切换MD文件的公开状态
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static toggleFilePublicStatusApiV1MdFilesFileIdTogglePublicPost(
        fileId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-files/{file_id}/toggle-public',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download Md File
     * 下载MD文件
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static downloadMdFileApiV1MdFilesFileIdDownloadGet(
        fileId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-files/{file_id}/download',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Archive Md File
     * 归档MD文件
     * @param fileId
     * @param archiveReason
     * @returns any Successful Response
     * @throws ApiError
     */
    public static archiveMdFileApiV1MdFilesFileIdArchivePost(
        fileId: number,
        archiveReason: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-files/{file_id}/archive',
            path: {
                'file_id': fileId,
            },
            query: {
                'archive_reason': archiveReason,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Archive File
     * 归档MD文件
     * @param fileId
     * @param archiveReason
     * @returns MDFileArchive Successful Response
     * @throws ApiError
     */
    public static archiveFileApiV1MdFileArchiveFilesFileIdArchivePost(
        fileId: number,
        archiveReason: string,
    ): CancelablePromise<MDFileArchive> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-file-archive/files/{file_id}/archive',
            path: {
                'file_id': fileId,
            },
            query: {
                'archive_reason': archiveReason,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Archives
     * 获取用户的归档文件列表（匿名/普通用户仅可见公开归档）
     * @param skip
     * @param limit
     * @param isPublic
     * @param search
     * @returns MDFileArchive Successful Response
     * @throws ApiError
     */
    public static readArchivesApiV1MdFileArchiveArchivesGet(
        skip?: number,
        limit: number = 100,
        isPublic?: (boolean | null),
        search?: (string | null),
    ): CancelablePromise<Array<MDFileArchive>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-file-archive/archives',
            query: {
                'skip': skip,
                'limit': limit,
                'is_public': isPublic,
                'search': search,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Archive
     * 获取单个归档文件（私有归档仅 owner / 超级管理员）
     * @param archiveId
     * @returns MDFileArchive Successful Response
     * @throws ApiError
     */
    public static readArchiveApiV1MdFileArchiveArchivesArchiveIdGet(
        archiveId: number,
    ): CancelablePromise<MDFileArchive> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-file-archive/archives/{archive_id}',
            path: {
                'archive_id': archiveId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Archive
     * 删除归档文件
     * @param archiveId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteArchiveApiV1MdFileArchiveArchivesArchiveIdDelete(
        archiveId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/md-file-archive/archives/{archive_id}',
            path: {
                'archive_id': archiveId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Archive Content
     * 获取归档文件内容（私有归档仅 owner / 超级管理员）
     * @param archiveId
     * @returns MDFileArchiveContent Successful Response
     * @throws ApiError
     */
    public static readArchiveContentApiV1MdFileArchiveArchivesArchiveIdContentGet(
        archiveId: number,
    ): CancelablePromise<MDFileArchiveContent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-file-archive/archives/{archive_id}/content',
            path: {
                'archive_id': archiveId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Count Archives
     * 统计归档文件数量（匿名/普通用户仅统计公开归档）
     * @returns any Successful Response
     * @throws ApiError
     */
    public static countArchivesApiV1MdFileArchiveArchivesCountGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-file-archive/archives-count',
        });
    }
    /**
     * Refresh All Md Cache
     * 一键刷新所有MD文件缓存：
     * 1. 从数据库获取所有MD文件的OSS路径
     * 2. 从OSS下载文件内容并缓存到本地
     * 3. 更新proxy_url字段
     *
     * 返回：
     * - 处理结果统计
     * @returns any Successful Response
     * @throws ApiError
     */
    public static refreshAllMdCacheApiV1MdCacheSimpleRefreshAllPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-cache-simple/refresh-all',
        });
    }
    /**
     * Clear All Md Cache
     * 清空所有MD文件缓存和proxy_url字段：
     * 1. 直接删除所有缓存文件
     * 2. 清空数据库中的proxy_url字段
     *
     * 返回：
     * - 处理结果统计
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clearAllMdCacheApiV1MdCacheSimpleClearAllPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-cache-simple/clear-all',
        });
    }
    /**
     * Force Refresh All Md Cache
     * 强制重新下载所有MD文件（解决编码问题）：
     * 1. 从数据库获取所有MD文件的OSS路径
     * 2. 清除现有缓存
     * 3. 从OSS重新下载文件内容并缓存到本地
     * 4. 更新proxy_url字段
     *
     * 返回：
     * - 处理结果统计
     * @returns any Successful Response
     * @throws ApiError
     */
    public static forceRefreshAllMdCacheApiV1MdCacheSimpleForceRefreshAllPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-cache-simple/force-refresh-all',
        });
    }
    /**
     * Refresh Md Cache
     * 刷新指定MD文件缓存 - 从OSS/MinIO重新拉取文件内容并写入缓存
     *
     * 参数：
     * - file_ids: 要刷新缓存的MD文件ID列表，如果为空则刷新所有文件
     *
     * 返回：
     * - 刷新结果统计
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static refreshMdCacheApiV1MdCacheSimpleRefreshCachePost(
        requestBody?: Array<number>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-cache-simple/refresh-cache',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clear Md Cache
     * 清空所有MD文件缓存
     *
     * 返回：
     * - 清空结果统计
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clearMdCacheApiV1MdCacheSimpleClearCachePost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/md-cache-simple/clear-cache',
        });
    }
    /**
     * List Md Files
     * 列出所有MD文件信息（含私有文件的存储路径，仅超级管理员）
     *
     * 返回：
     * - MD文件列表
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listMdFilesApiV1MdCacheSimpleListFilesGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/md-cache-simple/list-files',
        });
    }
}
