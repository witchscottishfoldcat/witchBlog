/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlbumCreate } from '../models/AlbumCreate';
import type { AlbumListResponse } from '../models/AlbumListResponse';
import type { AlbumResponse } from '../models/AlbumResponse';
import type { AlbumUpdate } from '../models/AlbumUpdate';
import type { AnimeWatchlist } from '../models/AnimeWatchlist';
import type { AnimeWatchlistCategoryStats } from '../models/AnimeWatchlistCategoryStats';
import type { AnimeWatchlistCreate } from '../models/AnimeWatchlistCreate';
import type { AnimeWatchlistList } from '../models/AnimeWatchlistList';
import type { AnimeWatchlistStatusStats } from '../models/AnimeWatchlistStatusStats';
import type { AnimeWatchlistTagStats } from '../models/AnimeWatchlistTagStats';
import type { AnimeWatchlistUpdate } from '../models/AnimeWatchlistUpdate';
import type { app__schemas__album__ImageUploadUrlResponse } from '../models/app__schemas__album__ImageUploadUrlResponse';
import type { app__schemas__diary__ImageUploadUrlResponse } from '../models/app__schemas__diary__ImageUploadUrlResponse';
import type { ApplicationPerformanceMetrics } from '../models/ApplicationPerformanceMetrics';
import type { Body_create_link_with_image_api_v1_links_create_with_image_post } from '../models/Body_create_link_with_image_api_v1_links_create_with_image_post';
import type { Body_login_for_access_token_api_v1_auth_login_post } from '../models/Body_login_for_access_token_api_v1_auth_login_post';
import type { Body_upload_about_file_api_v1_about_upload_post } from '../models/Body_upload_about_file_api_v1_about_upload_post';
import type { Body_upload_image_to_link_api_v1_links__link_id__upload_image_post } from '../models/Body_upload_image_to_link_api_v1_links__link_id__upload_image_post';
import type { Body_upload_link_image_api_v1_links_upload_image_post } from '../models/Body_upload_link_image_api_v1_links_upload_image_post';
import type { Body_upload_photo_api_v1_albums__album_id__photos_post } from '../models/Body_upload_photo_api_v1_albums__album_id__photos_post';
import type { Body_upload_profile_image_api_v1_site_config__config_id__upload_profile_post } from '../models/Body_upload_profile_image_api_v1_site_config__config_id__upload_profile_post';
import type { Body_upload_site_icon_api_v1_site_config__config_id__upload_icon_post } from '../models/Body_upload_site_icon_api_v1_site_config__config_id__upload_icon_post';
import type { BusinessMetrics } from '../models/BusinessMetrics';
import type { DatabasePerformanceMetrics } from '../models/DatabasePerformanceMetrics';
import type { DatabasePoolStatus } from '../models/DatabasePoolStatus';
import type { DetailedStatsResponse } from '../models/DetailedStatsResponse';
import type { DiaryCreate } from '../models/DiaryCreate';
import type { DiaryImageResponse } from '../models/DiaryImageResponse';
import type { DiaryListResponse } from '../models/DiaryListResponse';
import type { DiaryResponse } from '../models/DiaryResponse';
import type { DiaryUpdate } from '../models/DiaryUpdate';
import type { GameCategoryStats } from '../models/GameCategoryStats';
import type { GameOverallStats } from '../models/GameOverallStats';
import type { GamePlatformStats } from '../models/GamePlatformStats';
import type { GameShowcase } from '../models/GameShowcase';
import type { GameShowcaseCreate } from '../models/GameShowcaseCreate';
import type { GameShowcaseList } from '../models/GameShowcaseList';
import type { GameShowcaseUpdate } from '../models/GameShowcaseUpdate';
import type { GameStatusStats } from '../models/GameStatusStats';
import type { ImportFromNeteaseRequest } from '../models/ImportFromNeteaseRequest';
import type { ImportFromNeteaseResponse } from '../models/ImportFromNeteaseResponse';
import type { Link } from '../models/Link';
import type { LinkCategoryStats } from '../models/LinkCategoryStats';
import type { LinkCreate } from '../models/LinkCreate';
import type { LinkImageUploadResponse } from '../models/LinkImageUploadResponse';
import type { LinkList } from '../models/LinkList';
import type { LinkUpdate } from '../models/LinkUpdate';
import type { LyricsResponse } from '../models/LyricsResponse';
import type { MusicLibrary } from '../models/MusicLibrary';
import type { MusicLibraryCreate } from '../models/MusicLibraryCreate';
import type { MusicLibraryDetail } from '../models/MusicLibraryDetail';
import type { MusicLibraryList } from '../models/MusicLibraryList';
import type { MusicLibraryUpdate } from '../models/MusicLibraryUpdate';
import type { MusicPublicOverview } from '../models/MusicPublicOverview';
import type { MusicPublicPlaylistDetail } from '../models/MusicPublicPlaylistDetail';
import type { MusicPublicPlaylistList } from '../models/MusicPublicPlaylistList';
import type { MusicPublicStats } from '../models/MusicPublicStats';
import type { MusicPublicTrack } from '../models/MusicPublicTrack';
import type { MusicPublicTrackList } from '../models/MusicPublicTrackList';
import type { MusicTrack } from '../models/MusicTrack';
import type { MusicTrackCreate } from '../models/MusicTrackCreate';
import type { MusicTrackList } from '../models/MusicTrackList';
import type { MusicTrackUpdate } from '../models/MusicTrackUpdate';
import type { PerformanceResponse } from '../models/PerformanceResponse';
import type { PhotoListResponse } from '../models/PhotoListResponse';
import type { PhotoResponse } from '../models/PhotoResponse';
import type { PhotoUpdate } from '../models/PhotoUpdate';
import type { PlayerCode } from '../models/PlayerCode';
import type { RelatedProject } from '../models/RelatedProject';
import type { ResourceLink } from '../models/ResourceLink';
import type { ResourceLinkCategoryStats } from '../models/ResourceLinkCategoryStats';
import type { ResourceLinkCreate } from '../models/ResourceLinkCreate';
import type { ResourceLinkList } from '../models/ResourceLinkList';
import type { ResourceLinkTagStats } from '../models/ResourceLinkTagStats';
import type { ResourceLinkUpdate } from '../models/ResourceLinkUpdate';
import type { SiteConfig } from '../models/SiteConfig';
import type { SiteConfigCreate } from '../models/SiteConfigCreate';
import type { SiteConfigPublic } from '../models/SiteConfigPublic';
import type { SiteConfigUpdate } from '../models/SiteConfigUpdate';
import type { SiteStatsResponse } from '../models/SiteStatsResponse';
import type { Skill } from '../models/Skill';
import type { SkillCreate } from '../models/SkillCreate';
import type { SkillPeriod } from '../models/SkillPeriod';
import type { SkillPeriodCreate } from '../models/SkillPeriodCreate';
import type { SkillPeriodUpdate } from '../models/SkillPeriodUpdate';
import type { SkillStats } from '../models/SkillStats';
import type { SkillUpdate } from '../models/SkillUpdate';
import type { SkillWithPeriodsAndProjects } from '../models/SkillWithPeriodsAndProjects';
import type { SkillWithProjects } from '../models/SkillWithProjects';
import type { SteamImportRequest } from '../models/SteamImportRequest';
import type { SteamImportResponse } from '../models/SteamImportResponse';
import type { SystemPerformanceMetrics } from '../models/SystemPerformanceMetrics';
import type { SystemStatusResponse } from '../models/SystemStatusResponse';
import type { TaskListResponse } from '../models/TaskListResponse';
import type { TaskStatusResponse } from '../models/TaskStatusResponse';
import type { TimelineCreate } from '../models/TimelineCreate';
import type { TimelineListResponse } from '../models/TimelineListResponse';
import type { TimelineResponse } from '../models/TimelineResponse';
import type { TimelineUpdate } from '../models/TimelineUpdate';
import type { Token } from '../models/Token';
import type { TokenRefreshRequest } from '../models/TokenRefreshRequest';
import type { User } from '../models/User';
import type { UserCreate } from '../models/UserCreate';
import type { UserUpdate } from '../models/UserUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class Service {
    /**
     * Login For Access Token
     * 用户登录获取访问令牌
     * @param formData
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static loginForAccessTokenApiV1AuthLoginPost(
        formData: Body_login_for_access_token_api_v1_auth_login_post,
    ): CancelablePromise<Token> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Register
     * 用户注册（默认关闭，需通过 ENABLE_OPEN_REGISTRATION 开启）
     * @param requestBody
     * @returns User Successful Response
     * @throws ApiError
     */
    public static registerApiV1AuthRegisterPost(
        requestBody: UserCreate,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Refresh Access Token
     * 用刷新令牌换取新的访问令牌（同时轮换刷新令牌）
     * @param requestBody
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static refreshAccessTokenApiV1AuthRefreshPost(
        requestBody?: (TokenRefreshRequest | null),
    ): CancelablePromise<Token> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Logout
     * Revoke the current refresh session and expire its httpOnly cookie.
     * @returns void
     * @throws ApiError
     */
    public static logoutApiV1AuthLogoutPost(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/logout',
        });
    }
    /**
     * Test Token
     * 测试令牌有效性
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testTokenApiV1AuthTestTokenPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/test-token',
        });
    }
    /**
     * Read User Me
     * 获取当前用户信息
     * @returns User Successful Response
     * @throws ApiError
     */
    public static readUserMeApiV1UsersMeGet(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me',
        });
    }
    /**
     * Update User Me
     * 更新当前用户信息
     * @param requestBody
     * @returns User Successful Response
     * @throws ApiError
     */
    public static updateUserMeApiV1UsersMePut(
        requestBody: UserUpdate,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Users
     * 获取用户列表（仅超级用户）
     * @param skip
     * @param limit
     * @returns User Successful Response
     * @throws ApiError
     */
    public static readUsersApiV1UsersGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<User>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create User
     * 创建用户（仅超级用户）
     * @param requestBody
     * @returns User Successful Response
     * @throws ApiError
     */
    public static createUserApiV1UsersPost(
        requestBody: UserCreate,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read User
     * 获取指定用户信息
     * @param userId
     * @returns User Successful Response
     * @throws ApiError
     */
    public static readUserApiV1UsersUserIdGet(
        userId: number,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User
     * 更新用户信息
     * @param userId
     * @param requestBody
     * @returns User Successful Response
     * @throws ApiError
     */
    public static updateUserApiV1UsersUserIdPut(
        userId: number,
        requestBody: UserUpdate,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete User
     * 删除用户（仅超级用户）
     *
     * 被删用户名下的所有数据（文章、归档、日记、时间线、相册等）会转移给当前操作的超管，
     * 不丢失任何内容。
     * @param userId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteUserApiV1UsersUserIdDelete(
        userId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Diary
     * 创建日记
     * @param requestBody
     * @returns DiaryResponse Successful Response
     * @throws ApiError
     */
    public static createDiaryApiV1DiariesPost(
        requestBody: DiaryCreate,
    ): CancelablePromise<DiaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/diaries/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Diaries
     * 获取日记列表
     * @param skip 跳过的记录数
     * @param limit 每页记录数
     * @param publicOnly 是否只获取公开日记
     * @returns DiaryListResponse Successful Response
     * @throws ApiError
     */
    public static getDiariesApiV1DiariesGet(
        skip?: number,
        limit: number = 20,
        publicOnly: boolean = true,
    ): CancelablePromise<DiaryListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/diaries/',
            query: {
                'skip': skip,
                'limit': limit,
                'public_only': publicOnly,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Diary
     * 获取单篇日记详情
     * @param diaryId
     * @returns DiaryResponse Successful Response
     * @throws ApiError
     */
    public static getDiaryApiV1DiariesDiaryIdGet(
        diaryId: number,
    ): CancelablePromise<DiaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/diaries/{diary_id}',
            path: {
                'diary_id': diaryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Diary
     * 更新日记
     * @param diaryId
     * @param requestBody
     * @returns DiaryResponse Successful Response
     * @throws ApiError
     */
    public static updateDiaryApiV1DiariesDiaryIdPut(
        diaryId: number,
        requestBody: DiaryUpdate,
    ): CancelablePromise<DiaryResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/diaries/{diary_id}',
            path: {
                'diary_id': diaryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Diary
     * 删除日记
     * @param diaryId
     * @returns void
     * @throws ApiError
     */
    public static deleteDiaryApiV1DiariesDiaryIdDelete(
        diaryId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/diaries/{diary_id}',
            path: {
                'diary_id': diaryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Image Upload Urls
     * 获取图片预签名上传URL（仅日记 owner / 超级管理员）
     * @param diaryId
     * @param fileCount 上传文件数量
     * @returns app__schemas__diary__ImageUploadUrlResponse Successful Response
     * @throws ApiError
     */
    public static getImageUploadUrlsApiV1DiariesDiaryIdImagesUploadUrlsPost(
        diaryId: number,
        fileCount: number = 1,
    ): CancelablePromise<Array<app__schemas__diary__ImageUploadUrlResponse>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/diaries/{diary_id}/images/upload-urls',
            path: {
                'diary_id': diaryId,
            },
            query: {
                'file_count': fileCount,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Diary Images
     * 获取日记的所有图片
     * @param diaryId
     * @returns DiaryImageResponse Successful Response
     * @throws ApiError
     */
    public static getDiaryImagesApiV1DiariesDiaryIdImagesGet(
        diaryId: number,
    ): CancelablePromise<Array<DiaryImageResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/diaries/{diary_id}/images',
            path: {
                'diary_id': diaryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Save Image Info
     * 保存图片信息（仅日记 owner / 超级管理员）
     * @param diaryId
     * @param requestBody
     * @returns DiaryImageResponse Successful Response
     * @throws ApiError
     */
    public static saveImageInfoApiV1DiariesDiaryIdImagesPost(
        diaryId: number,
        requestBody: Record<string, any>,
    ): CancelablePromise<DiaryImageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/diaries/{diary_id}/images',
            path: {
                'diary_id': diaryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Timeline
     * 创建时间线记录（需登录）
     * @param requestBody
     * @returns TimelineResponse Successful Response
     * @throws ApiError
     */
    public static createTimelineApiV1TimelinesPost(
        requestBody: TimelineCreate,
    ): CancelablePromise<TimelineResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/timelines/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Timelines
     * 获取时间线记录列表
     * @param skip 跳过的记录数
     * @param limit 每页记录数
     * @param publicOnly 是否只获取公开记录
     * @param search 搜索关键词
     * @param tags 标签筛选，多个标签用逗号分隔
     * @returns TimelineListResponse Successful Response
     * @throws ApiError
     */
    public static getTimelinesApiV1TimelinesGet(
        skip?: number,
        limit: number = 20,
        publicOnly: boolean = true,
        search?: (string | null),
        tags?: (string | null),
    ): CancelablePromise<TimelineListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/timelines/',
            query: {
                'skip': skip,
                'limit': limit,
                'public_only': publicOnly,
                'search': search,
                'tags': tags,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Timeline
     * 获取单个时间线记录
     * @param timelineId
     * @returns TimelineResponse Successful Response
     * @throws ApiError
     */
    public static getTimelineApiV1TimelinesTimelineIdGet(
        timelineId: number,
    ): CancelablePromise<TimelineResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/timelines/{timeline_id}',
            path: {
                'timeline_id': timelineId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Timeline
     * 更新时间线记录
     * @param timelineId
     * @param requestBody
     * @returns TimelineResponse Successful Response
     * @throws ApiError
     */
    public static updateTimelineApiV1TimelinesTimelineIdPut(
        timelineId: number,
        requestBody: TimelineUpdate,
    ): CancelablePromise<TimelineResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/timelines/{timeline_id}',
            path: {
                'timeline_id': timelineId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Timeline
     * 删除时间线记录
     * @param timelineId
     * @returns void
     * @throws ApiError
     */
    public static deleteTimelineApiV1TimelinesTimelineIdDelete(
        timelineId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/timelines/{timeline_id}',
            path: {
                'timeline_id': timelineId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Timelines
     * 获取当前用户的时间线记录列表
     * @param skip 跳过的记录数
     * @param limit 每页记录数
     * @param search 搜索关键词
     * @param tags 标签筛选，多个标签用逗号分隔
     * @returns TimelineListResponse Successful Response
     * @throws ApiError
     */
    public static getMyTimelinesApiV1TimelinesMyTimelinesGet(
        skip?: number,
        limit: number = 20,
        search?: (string | null),
        tags?: (string | null),
    ): CancelablePromise<TimelineListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/timelines/my/timelines',
            query: {
                'skip': skip,
                'limit': limit,
                'search': search,
                'tags': tags,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Skills
     * 获取技能列表（公开接口）
     * @param skip
     * @param limit
     * @param category 按类别筛选
     * @returns SkillWithProjects Successful Response
     * @throws ApiError
     */
    public static readSkillsApiV1SkillsGet(
        skip?: number,
        limit: number = 100,
        category?: (string | null),
    ): CancelablePromise<Array<SkillWithProjects>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/skills/',
            query: {
                'skip': skip,
                'limit': limit,
                'category': category,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Skill
     * 创建新技能
     * @param requestBody
     * @returns Skill Successful Response
     * @throws ApiError
     */
    public static createSkillApiV1SkillsPost(
        requestBody: SkillCreate,
    ): CancelablePromise<Skill> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/skills/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Skill Stats
     * 获取技能统计信息（公开接口）
     * @returns SkillStats Successful Response
     * @throws ApiError
     */
    public static getSkillStatsApiV1SkillsStatsGet(): CancelablePromise<SkillStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/skills/stats',
        });
    }
    /**
     * Get Skill Projects
     * 获取技能相关的项目列表（公开接口）
     * @param skillId
     * @returns RelatedProject Successful Response
     * @throws ApiError
     */
    public static getSkillProjectsApiV1SkillsSkillIdProjectsGet(
        skillId: number,
    ): CancelablePromise<Array<RelatedProject>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/skills/{skill_id}/projects',
            path: {
                'skill_id': skillId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Skill
     * 获取技能详情，包含学习时间段和相关项目（公开接口）
     * @param skillId
     * @param includeProjects 是否包含相关项目信息
     * @returns SkillWithPeriodsAndProjects Successful Response
     * @throws ApiError
     */
    public static readSkillApiV1SkillsSkillIdGet(
        skillId: number,
        includeProjects: boolean = true,
    ): CancelablePromise<SkillWithPeriodsAndProjects> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/skills/{skill_id}',
            path: {
                'skill_id': skillId,
            },
            query: {
                'include_projects': includeProjects,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Skill
     * 更新技能信息
     * @param skillId
     * @param requestBody
     * @returns Skill Successful Response
     * @throws ApiError
     */
    public static updateSkillApiV1SkillsSkillIdPut(
        skillId: number,
        requestBody: SkillUpdate,
    ): CancelablePromise<Skill> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/skills/{skill_id}',
            path: {
                'skill_id': skillId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Skill
     * 删除技能
     * @param skillId
     * @returns Skill Successful Response
     * @throws ApiError
     */
    public static deleteSkillApiV1SkillsSkillIdDelete(
        skillId: number,
    ): CancelablePromise<Skill> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/skills/{skill_id}',
            path: {
                'skill_id': skillId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Skill Periods
     * 获取技能的所有学习时间段（公开接口）
     * @param skillId
     * @param skip
     * @param limit
     * @returns SkillPeriod Successful Response
     * @throws ApiError
     */
    public static readSkillPeriodsApiV1SkillsSkillIdPeriodsGet(
        skillId: number,
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<SkillPeriod>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/skills/{skill_id}/periods',
            path: {
                'skill_id': skillId,
            },
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Skill Period
     * 为技能添加学习时间段
     * @param skillId
     * @param requestBody
     * @returns SkillPeriod Successful Response
     * @throws ApiError
     */
    public static createSkillPeriodApiV1SkillsSkillIdPeriodsPost(
        skillId: number,
        requestBody: SkillPeriodCreate,
    ): CancelablePromise<SkillPeriod> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/skills/{skill_id}/periods',
            path: {
                'skill_id': skillId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Skill Period
     * 更新技能学习时间段
     * @param skillId
     * @param periodId
     * @param requestBody
     * @returns SkillPeriod Successful Response
     * @throws ApiError
     */
    public static updateSkillPeriodApiV1SkillsSkillIdPeriodsPeriodIdPut(
        skillId: number,
        periodId: number,
        requestBody: SkillPeriodUpdate,
    ): CancelablePromise<SkillPeriod> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/skills/{skill_id}/periods/{period_id}',
            path: {
                'skill_id': skillId,
                'period_id': periodId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Skill Period
     * 删除技能学习时间段
     * @param skillId
     * @param periodId
     * @returns SkillPeriod Successful Response
     * @throws ApiError
     */
    public static deleteSkillPeriodApiV1SkillsSkillIdPeriodsPeriodIdDelete(
        skillId: number,
        periodId: number,
    ): CancelablePromise<SkillPeriod> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/skills/{skill_id}/periods/{period_id}',
            path: {
                'skill_id': skillId,
                'period_id': periodId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Current Period
     * 添加从指定日期到当前时间的学习时间段
     * @param skillId
     * @param startDate
     * @param notes
     * @returns SkillPeriod Successful Response
     * @throws ApiError
     */
    public static addCurrentPeriodApiV1SkillsSkillIdPeriodsCurrentPost(
        skillId: number,
        startDate: string,
        notes?: (string | null),
    ): CancelablePromise<SkillPeriod> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/skills/{skill_id}/periods/current',
            path: {
                'skill_id': skillId,
            },
            query: {
                'start_date': startDate,
                'notes': notes,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Projects
     * 获取项目列表，支持筛选和搜索
     * @param skip
     * @param limit
     * @param platform
     * @param tag
     * @param language
     * @param search
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProjectsApiV1ProjectsGet(
        skip?: number,
        limit: number = 100,
        platform?: (string | null),
        tag?: (string | null),
        language?: (string | null),
        search?: (string | null),
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/',
            query: {
                'skip': skip,
                'limit': limit,
                'platform': platform,
                'tag': tag,
                'language': language,
                'search': search,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Project
     * 通过项目URL创建新项目记录（仅超级管理员）
     * @param projectUrl
     * @param tag
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createProjectApiV1ProjectsPost(
        projectUrl: string,
        tag: string = '策划中',
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/projects/',
            query: {
                'project_url': projectUrl,
                'tag': tag,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project
     * 获取单个项目详情
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProjectApiV1ProjectsProjectIdGet(
        projectId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Project
     * 更新项目信息（目前只支持更新标签，仅超级管理员）
     * @param projectId
     * @param tag
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateProjectApiV1ProjectsProjectIdPut(
        projectId: number,
        tag?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            query: {
                'tag': tag,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Project
     * 删除项目（仅超级管理员）
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteProjectApiV1ProjectsProjectIdDelete(
        projectId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Platform Stats
     * 获取各平台项目数量统计
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPlatformStatsApiV1ProjectsStatsPlatformGet(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/stats/platform',
        });
    }
    /**
     * Get Tag Stats
     * 获取各标签项目数量统计
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getTagStatsApiV1ProjectsStatsTagGet(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/stats/tag',
        });
    }
    /**
     * Get Language Stats
     * 获取使用最多的编程语言统计
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getLanguageStatsApiV1ProjectsStatsLanguageGet(
        limit: number = 10,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/stats/language',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Refresh Project
     * 刷新项目信息（重新从远程获取最新数据，仅超级管理员）
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static refreshProjectApiV1ProjectsRefreshProjectIdPost(
        projectId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/projects/refresh/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Site Configs
     * 获取所有站点配置（需要认证）
     * @param skip
     * @param limit
     * @returns SiteConfig Successful Response
     * @throws ApiError
     */
    public static readSiteConfigsApiV1SiteConfigGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<SiteConfig>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/site-config/',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Site Config
     * 创建新的站点配置（需要认证）
     * @param requestBody
     * @returns SiteConfig Successful Response
     * @throws ApiError
     */
    public static createSiteConfigApiV1SiteConfigPost(
        requestBody: SiteConfigCreate,
    ): CancelablePromise<SiteConfig> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/site-config/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Active Site Config
     * 获取当前激活的站点配置（需要认证）
     * @returns SiteConfig Successful Response
     * @throws ApiError
     */
    public static readActiveSiteConfigApiV1SiteConfigActiveGet(): CancelablePromise<SiteConfig> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/site-config/active',
        });
    }
    /**
     * Read Public Site Config
     * 获取公开的站点配置信息（不需要认证）
     * @returns SiteConfigPublic Successful Response
     * @throws ApiError
     */
    public static readPublicSiteConfigApiV1SiteConfigPublicGet(): CancelablePromise<SiteConfigPublic> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/site-config/public',
        });
    }
    /**
     * Update Site Config
     * 更新站点配置（需要认证）
     * @param configId
     * @param requestBody
     * @returns SiteConfig Successful Response
     * @throws ApiError
     */
    public static updateSiteConfigApiV1SiteConfigConfigIdPut(
        configId: number,
        requestBody: SiteConfigUpdate,
    ): CancelablePromise<SiteConfig> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/site-config/{config_id}',
            path: {
                'config_id': configId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Site Config
     * 删除站点配置（需要认证）
     * @param configId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteSiteConfigApiV1SiteConfigConfigIdDelete(
        configId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/site-config/{config_id}',
            path: {
                'config_id': configId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Site Icon
     * 上传站点图标（需要认证）
     * @param configId
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadSiteIconApiV1SiteConfigConfigIdUploadIconPost(
        configId: number,
        formData: Body_upload_site_icon_api_v1_site_config__config_id__upload_icon_post,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/site-config/{config_id}/upload-icon',
            path: {
                'config_id': configId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Profile Image
     * 上传个人头像（需要认证）
     * @param configId
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadProfileImageApiV1SiteConfigConfigIdUploadProfilePost(
        configId: number,
        formData: Body_upload_profile_image_api_v1_site_config__config_id__upload_profile_post,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/site-config/{config_id}/upload-profile',
            path: {
                'config_id': configId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Links
     * 获取链接列表
     * @param category 链接分类（内置: friend, video, other；支持自定义分类）
     * @param tags 标签，多个标签用逗号分隔
     * @param isActive 是否启用
     * @param skip 跳过数量
     * @param limit 返回数量
     * @param sortBy 排序方式: sort_order, created_at, name
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static getLinksApiV1LinksGet(
        category?: (string | null),
        tags?: (string | null),
        isActive?: (boolean | null),
        skip?: number,
        limit: number = 100,
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<Link>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/',
            query: {
                'category': category,
                'tags': tags,
                'is_active': isActive,
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Link
     * 创建链接
     * @param requestBody
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static createLinkApiV1LinksPost(
        requestBody: LinkCreate,
    ): CancelablePromise<Link> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/links/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Links Paginated
     * 分页获取链接列表
     * @param category 链接分类（内置: friend, video, other；支持自定义分类）
     * @param tags 标签，多个标签用逗号分隔
     * @param isActive 是否启用
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序方式: sort_order, created_at, name
     * @returns LinkList Successful Response
     * @throws ApiError
     */
    public static getLinksPaginatedApiV1LinksListGet(
        category?: (string | null),
        tags?: (string | null),
        isActive?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<LinkList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/list',
            query: {
                'category': category,
                'tags': tags,
                'is_active': isActive,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Random Links By Category
     * 根据分类随机获取链接
     * @param category
     * @param limit 返回数量
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static getRandomLinksByCategoryApiV1LinksRandomCategoryGet(
        category: string,
        limit: number = 5,
    ): CancelablePromise<Array<Link>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/random/{category}',
            path: {
                'category': category,
            },
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Random Links
     * 随机获取链接
     * @param category 链接分类（内置: friend, video, other；支持自定义分类）
     * @param limit 返回数量
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static getRandomLinksApiV1LinksRandomGet(
        category?: (string | null),
        limit: number = 5,
    ): CancelablePromise<Array<Link>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/random',
            query: {
                'category': category,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Link
     * 获取单个链接
     * @param linkId
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static getLinkApiV1LinksLinkIdGet(
        linkId: number,
    ): CancelablePromise<Link> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/{link_id}',
            path: {
                'link_id': linkId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Link
     * 更新链接
     * @param linkId
     * @param requestBody
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static updateLinkApiV1LinksLinkIdPut(
        linkId: number,
        requestBody: LinkUpdate,
    ): CancelablePromise<Link> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/links/{link_id}',
            path: {
                'link_id': linkId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Link
     * 删除链接
     * @param linkId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteLinkApiV1LinksLinkIdDelete(
        linkId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/links/{link_id}',
            path: {
                'link_id': linkId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Category Stats
     * 获取各分类链接统计
     * @returns LinkCategoryStats Successful Response
     * @throws ApiError
     */
    public static getCategoryStatsApiV1LinksCategoriesStatsGet(): CancelablePromise<Array<LinkCategoryStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/categories/stats',
        });
    }
    /**
     * Get All Tags
     * 获取所有标签
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getAllTagsApiV1LinksTagsAllGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/tags/all',
        });
    }
    /**
     * Get Links By Tags
     * 根据标签获取链接
     * @param tags 标签，多个标签用逗号分隔
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static getLinksByTagsApiV1LinksByTagsListGet(
        tags: string,
    ): CancelablePromise<Array<Link>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/links/by-tags/list',
            query: {
                'tags': tags,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Link Image
     * 上传链接图片到MinIO
     * @param formData
     * @returns LinkImageUploadResponse Successful Response
     * @throws ApiError
     */
    public static uploadLinkImageApiV1LinksUploadImagePost(
        formData: Body_upload_link_image_api_v1_links_upload_image_post,
    ): CancelablePromise<LinkImageUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/links/upload-image',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Image To Link
     * 为指定链接上传新图片
     * @param linkId
     * @param formData
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static uploadImageToLinkApiV1LinksLinkIdUploadImagePost(
        linkId: number,
        formData: Body_upload_image_to_link_api_v1_links__link_id__upload_image_post,
    ): CancelablePromise<Link> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/links/{link_id}/upload-image',
            path: {
                'link_id': linkId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Link With Image
     * 创建链接并上传图片
     * @param formData
     * @returns Link Successful Response
     * @throws ApiError
     */
    public static createLinkWithImageApiV1LinksCreateWithImagePost(
        formData: Body_create_link_with_image_api_v1_links_create_with_image_post,
    ): CancelablePromise<Link> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/links/create-with-image',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Resource Links
     * 获取资源链接列表
     * @param category 资源分类: bilibili, douyin, weibo, zhihu, github, personal, other
     * @param tags 标签，多个标签用逗号分隔
     * @param isActive 是否启用
     * @param skip 跳过数量
     * @param limit 返回数量
     * @param sortBy 排序方式: sort_order, created_at, title
     * @returns ResourceLink Successful Response
     * @throws ApiError
     */
    public static getResourceLinksApiV1ResourceLinksGet(
        category?: (string | null),
        tags?: (string | null),
        isActive?: (boolean | null),
        skip?: number,
        limit: number = 100,
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<ResourceLink>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource-links/',
            query: {
                'category': category,
                'tags': tags,
                'is_active': isActive,
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Resource Link
     * 创建资源链接
     * @param requestBody
     * @returns ResourceLink Successful Response
     * @throws ApiError
     */
    public static createResourceLinkApiV1ResourceLinksPost(
        requestBody: ResourceLinkCreate,
    ): CancelablePromise<ResourceLink> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/resource-links/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Resource Links Paginated
     * 分页获取资源链接列表
     * @param category 资源分类: bilibili, douyin, weibo, zhihu, github, personal, other
     * @param tags 标签，多个标签用逗号分隔
     * @param isActive 是否启用
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序方式: sort_order, created_at, title
     * @returns ResourceLinkList Successful Response
     * @throws ApiError
     */
    public static getResourceLinksPaginatedApiV1ResourceLinksListGet(
        category?: (string | null),
        tags?: (string | null),
        isActive?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<ResourceLinkList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource-links/list',
            query: {
                'category': category,
                'tags': tags,
                'is_active': isActive,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Resource Link Categories
     * 获取资源链接分类统计
     * @param isActive 是否启用
     * @returns ResourceLinkCategoryStats Successful Response
     * @throws ApiError
     */
    public static getResourceLinkCategoriesApiV1ResourceLinksCategoriesGet(
        isActive?: (boolean | null),
    ): CancelablePromise<Array<ResourceLinkCategoryStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource-links/categories',
            query: {
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Resource Link Tags
     * 获取资源链接标签统计
     * @param isActive 是否启用
     * @returns ResourceLinkTagStats Successful Response
     * @throws ApiError
     */
    public static getResourceLinkTagsApiV1ResourceLinksTagsGet(
        isActive?: (boolean | null),
    ): CancelablePromise<Array<ResourceLinkTagStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource-links/tags',
            query: {
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Resource Link
     * 获取单个资源链接
     * @param linkId
     * @returns ResourceLink Successful Response
     * @throws ApiError
     */
    public static getResourceLinkApiV1ResourceLinksLinkIdGet(
        linkId: number,
    ): CancelablePromise<ResourceLink> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource-links/{link_id}',
            path: {
                'link_id': linkId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Resource Link
     * 更新资源链接
     * @param linkId
     * @param requestBody
     * @returns ResourceLink Successful Response
     * @throws ApiError
     */
    public static updateResourceLinkApiV1ResourceLinksLinkIdPut(
        linkId: number,
        requestBody: ResourceLinkUpdate,
    ): CancelablePromise<ResourceLink> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/resource-links/{link_id}',
            path: {
                'link_id': linkId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Resource Link
     * 删除资源链接
     * @param linkId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteResourceLinkApiV1ResourceLinksLinkIdDelete(
        linkId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/resource-links/{link_id}',
            path: {
                'link_id': linkId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Anime Watchlist
     * 获取追番追剧列表
     * @param category 分类: anime, drama, other
     * @param tags 标签，多个标签用逗号分隔
     * @param status 状态: want_watch, watching, completed, dropped
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param skip 跳过数量
     * @param limit 返回数量
     * @param sortBy 排序方式: sort_order, created_at, title, progress, rating
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static getAnimeWatchlistApiV1AnimeWatchlistGet(
        category?: (string | null),
        tags?: (string | null),
        status?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        skip?: number,
        limit: number = 100,
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<AnimeWatchlist>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/',
            query: {
                'category': category,
                'tags': tags,
                'status': status,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Anime Watchlist Item
     * 创建追番追剧项目
     * @param requestBody
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static createAnimeWatchlistItemApiV1AnimeWatchlistPost(
        requestBody: AnimeWatchlistCreate,
    ): CancelablePromise<AnimeWatchlist> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/anime-watchlist/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Anime Watchlist Paginated
     * 分页获取追番追剧列表
     * @param category 分类: anime, drama, other
     * @param tags 标签，多个标签用逗号分隔
     * @param status 状态: want_watch, watching, completed, dropped
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序方式: sort_order, created_at, title, progress, rating
     * @returns AnimeWatchlistList Successful Response
     * @throws ApiError
     */
    public static getAnimeWatchlistPaginatedApiV1AnimeWatchlistListGet(
        category?: (string | null),
        tags?: (string | null),
        status?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<AnimeWatchlistList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/list',
            query: {
                'category': category,
                'tags': tags,
                'status': status,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Want Watch Anime
     * 获取想看的动漫/剧集
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static getWantWatchAnimeApiV1AnimeWatchlistWantWatchGet(): CancelablePromise<Array<AnimeWatchlist>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/want-watch',
        });
    }
    /**
     * Get Watching Anime
     * 获取正在看的动漫/剧集
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static getWatchingAnimeApiV1AnimeWatchlistWatchingGet(): CancelablePromise<Array<AnimeWatchlist>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/watching',
        });
    }
    /**
     * Get Completed Anime
     * 获取已看完的动漫/剧集
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static getCompletedAnimeApiV1AnimeWatchlistCompletedGet(): CancelablePromise<Array<AnimeWatchlist>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/completed',
        });
    }
    /**
     * Get Favorite Anime
     * 获取收藏的动漫/剧集
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static getFavoriteAnimeApiV1AnimeWatchlistFavoritesGet(): CancelablePromise<Array<AnimeWatchlist>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/favorites',
        });
    }
    /**
     * Get Anime Status Stats
     * 获取追番追剧状态统计
     * @param isActive 是否启用
     * @returns AnimeWatchlistStatusStats Successful Response
     * @throws ApiError
     */
    public static getAnimeStatusStatsApiV1AnimeWatchlistStatusesGet(
        isActive?: (boolean | null),
    ): CancelablePromise<Array<AnimeWatchlistStatusStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/statuses',
            query: {
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Anime Category Stats
     * 获取追番追剧分类统计
     * @param isActive 是否启用
     * @returns AnimeWatchlistCategoryStats Successful Response
     * @throws ApiError
     */
    public static getAnimeCategoryStatsApiV1AnimeWatchlistCategoriesGet(
        isActive?: (boolean | null),
    ): CancelablePromise<Array<AnimeWatchlistCategoryStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/categories',
            query: {
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Anime Tag Stats
     * 获取追番追剧标签统计
     * @param isActive 是否启用
     * @returns AnimeWatchlistTagStats Successful Response
     * @throws ApiError
     */
    public static getAnimeTagStatsApiV1AnimeWatchlistTagsGet(
        isActive?: (boolean | null),
    ): CancelablePromise<Array<AnimeWatchlistTagStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/tags',
            query: {
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Proxy Anime Image
     * 代理获取图片，解决前端跨域问题
     *
     * 使用方式:
     * 前端: <img src="http://localhost:8000/api/v1/anime-watchlist/proxy-image?url=https://example.com/image.jpg" />
     * @param url 要代理的图片URL
     * @returns any Successful Response
     * @throws ApiError
     */
    public static proxyAnimeImageApiV1AnimeWatchlistProxyImageGet(
        url: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/proxy-image',
            query: {
                'url': url,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Anime Watchlist Item
     * 获取单个追番追剧项目
     * @param itemId
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static getAnimeWatchlistItemApiV1AnimeWatchlistItemIdGet(
        itemId: number,
    ): CancelablePromise<AnimeWatchlist> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/{item_id}',
            path: {
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Anime Watchlist Item
     * 更新追番追剧项目
     * @param itemId
     * @param requestBody
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static updateAnimeWatchlistItemApiV1AnimeWatchlistItemIdPut(
        itemId: number,
        requestBody: AnimeWatchlistUpdate,
    ): CancelablePromise<AnimeWatchlist> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/anime-watchlist/{item_id}',
            path: {
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Anime Watchlist Item
     * 删除追番追剧项目
     * @param itemId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAnimeWatchlistItemApiV1AnimeWatchlistItemIdDelete(
        itemId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/anime-watchlist/{item_id}',
            path: {
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Anime Cover Url
     * 获取动漫封面图片的URL
     * @param itemId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAnimeCoverUrlApiV1AnimeWatchlistItemIdCoverUrlGet(
        itemId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/anime-watchlist/{item_id}/cover-url',
            path: {
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Batch Update Anime Covers
     * 批量更新动漫封面图片（已废弃，请使用batch-update-metadata）
     *
     * 为所有没有MinIO封面图片的追番项目下载并上传封面图片
     *
     * Args:
     * limit: 批量处理的数量限制
     *
     * Returns:
     * dict: 包含处理结果的字典
     * @param limit 批量处理数量限制，最大200
     * @returns any Successful Response
     * @throws ApiError
     */
    public static batchUpdateAnimeCoversApiV1AnimeWatchlistBatchUpdateCoversPost(
        limit: number = 50,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/anime-watchlist/batch-update-covers',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Batch Update Anime Metadata
     * 批量更新动漫元数据
     *
     * 为所有有URL的追番项目从B站页面提取并更新元数据
     *
     * Args:
     * limit: 批量处理的数量限制
     *
     * Returns:
     * dict: 包含处理结果的字典
     * @param limit 批量处理数量限制，最大200
     * @returns any Successful Response
     * @throws ApiError
     */
    public static batchUpdateAnimeMetadataApiV1AnimeWatchlistBatchUpdateMetadataPost(
        limit: number = 50,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/anime-watchlist/batch-update-metadata',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Anime Progress
     * 更新观看进度
     * @param itemId
     * @param progress 观看进度百分比(0-100)
     * @param currentEpisode 当前看到第几集
     * @returns AnimeWatchlist Successful Response
     * @throws ApiError
     */
    public static updateAnimeProgressApiV1AnimeWatchlistItemIdProgressPatch(
        itemId: number,
        progress: number,
        currentEpisode?: (number | null),
    ): CancelablePromise<AnimeWatchlist> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/anime-watchlist/{item_id}/progress',
            path: {
                'item_id': itemId,
            },
            query: {
                'progress': progress,
                'current_episode': currentEpisode,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Libraries
     * 获取音乐库列表
     * @param tags 标签，多个标签用逗号分隔
     * @param isPublic 是否公开
     * @param isActive 是否启用
     * @param skip 跳过数量
     * @param limit 返回数量
     * @param sortBy 排序方式: sort_order, created_at, title, track_count
     * @returns MusicLibrary Successful Response
     * @throws ApiError
     */
    public static getMusicLibrariesApiV1MusicLibrariesGet(
        tags?: (string | null),
        isPublic?: (boolean | null),
        isActive?: (boolean | null),
        skip?: number,
        limit: number = 100,
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<MusicLibrary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-libraries/',
            query: {
                'tags': tags,
                'is_public': isPublic,
                'is_active': isActive,
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Music Library
     * 创建音乐库
     * @param requestBody
     * @returns MusicLibrary Successful Response
     * @throws ApiError
     */
    public static createMusicLibraryApiV1MusicLibrariesPost(
        requestBody: MusicLibraryCreate,
    ): CancelablePromise<MusicLibrary> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music-libraries/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Libraries Paginated
     * 分页获取音乐库列表
     * @param tags 标签，多个标签用逗号分隔
     * @param isPublic 是否公开
     * @param isActive 是否启用
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序方式: sort_order, created_at, title, track_count
     * @returns MusicLibraryList Successful Response
     * @throws ApiError
     */
    public static getMusicLibrariesPaginatedApiV1MusicLibrariesListGet(
        tags?: (string | null),
        isPublic?: (boolean | null),
        isActive?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<MusicLibraryList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-libraries/list',
            query: {
                'tags': tags,
                'is_public': isPublic,
                'is_active': isActive,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Library
     * 获取音乐库详情（包含歌曲列表）
     * @param libraryId
     * @returns MusicLibraryDetail Successful Response
     * @throws ApiError
     */
    public static getMusicLibraryApiV1MusicLibrariesLibraryIdGet(
        libraryId: number,
    ): CancelablePromise<MusicLibraryDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-libraries/{library_id}',
            path: {
                'library_id': libraryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Music Library
     * 更新音乐库
     * @param libraryId
     * @param requestBody
     * @returns MusicLibrary Successful Response
     * @throws ApiError
     */
    public static updateMusicLibraryApiV1MusicLibrariesLibraryIdPut(
        libraryId: number,
        requestBody: MusicLibraryUpdate,
    ): CancelablePromise<MusicLibrary> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/music-libraries/{library_id}',
            path: {
                'library_id': libraryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Music Library
     * 删除音乐库
     * @param libraryId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteMusicLibraryApiV1MusicLibrariesLibraryIdDelete(
        libraryId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/music-libraries/{library_id}',
            path: {
                'library_id': libraryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Import From Netease
     * 从网易云导入歌单
     * @param requestBody
     * @returns ImportFromNeteaseResponse Successful Response
     * @throws ApiError
     */
    public static importFromNeteaseApiV1MusicLibrariesImportFromNeteasePost(
        requestBody: ImportFromNeteaseRequest,
    ): CancelablePromise<ImportFromNeteaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music-libraries/import-from-netease',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Library Tracks
     * 获取音乐库中的歌曲列表
     * @param libraryId
     * @param category 分类
     * @param tags 标签，多个标签用逗号分隔
     * @param status 状态: unplayed, listening, completed, disliked
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param sortBy 排序方式: sort_order, created_at, title, rating, play_count
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getLibraryTracksApiV1MusicLibrariesLibraryIdTracksGet(
        libraryId: number,
        category?: (string | null),
        tags?: (string | null),
        status?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<MusicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-libraries/{library_id}/tracks',
            path: {
                'library_id': libraryId,
            },
            query: {
                'category': category,
                'tags': tags,
                'status': status,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync Library From Netease
     * 从网易云同步歌单
     * @param libraryId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static syncLibraryFromNeteaseApiV1MusicLibrariesLibraryIdSyncPost(
        libraryId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music-libraries/{library_id}/sync',
            path: {
                'library_id': libraryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Tracks
     * 获取音乐曲目列表
     * @param libraryId 所属歌单ID
     * @param category 分类
     * @param tags 标签，多个标签用逗号分隔
     * @param status 状态: unplayed, listening, completed, disliked
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param skip 跳过数量
     * @param limit 返回数量
     * @param sortBy 排序方式: sort_order, created_at, title, rating, play_count
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getMusicTracksApiV1MusicTracksGet(
        libraryId?: (number | null),
        category?: (string | null),
        tags?: (string | null),
        status?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        skip?: number,
        limit: number = 100,
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<MusicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/',
            query: {
                'library_id': libraryId,
                'category': category,
                'tags': tags,
                'status': status,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Music Track
     * 创建音乐曲目
     * @param requestBody
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static createMusicTrackApiV1MusicTracksPost(
        requestBody: MusicTrackCreate,
    ): CancelablePromise<MusicTrack> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music-tracks/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Tracks Paginated
     * 分页获取音乐曲目列表
     * @param libraryId 所属歌单ID
     * @param category 分类
     * @param tags 标签，多个标签用逗号分隔
     * @param status 状态: unplayed, listening, completed, disliked
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序方式: sort_order, created_at, title, rating, play_count
     * @returns MusicTrackList Successful Response
     * @throws ApiError
     */
    public static getMusicTracksPaginatedApiV1MusicTracksListGet(
        libraryId?: (number | null),
        category?: (string | null),
        tags?: (string | null),
        status?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<MusicTrackList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/list',
            query: {
                'library_id': libraryId,
                'category': category,
                'tags': tags,
                'status': status,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Favorite Tracks
     * 获取收藏的歌曲
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getFavoriteTracksApiV1MusicTracksFavoritesGet(): CancelablePromise<Array<MusicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/favorites',
        });
    }
    /**
     * Get Unplayed Tracks
     * 获取未听的歌曲
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getUnplayedTracksApiV1MusicTracksUnplayedGet(): CancelablePromise<Array<MusicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/unplayed',
        });
    }
    /**
     * Get Listening Tracks
     * 获取在听的歌曲
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getListeningTracksApiV1MusicTracksListeningGet(): CancelablePromise<Array<MusicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/listening',
        });
    }
    /**
     * Get Completed Tracks
     * 获取已听完的歌曲
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getCompletedTracksApiV1MusicTracksCompletedGet(): CancelablePromise<Array<MusicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/completed',
        });
    }
    /**
     * Get Music Track
     * 获取音乐曲目详情
     * @param trackId
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static getMusicTrackApiV1MusicTracksTrackIdGet(
        trackId: number,
    ): CancelablePromise<MusicTrack> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/{track_id}',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Music Track
     * 更新音乐曲目
     * @param trackId
     * @param requestBody
     * @returns MusicTrack Successful Response
     * @throws ApiError
     */
    public static updateMusicTrackApiV1MusicTracksTrackIdPut(
        trackId: number,
        requestBody: MusicTrackUpdate,
    ): CancelablePromise<MusicTrack> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/music-tracks/{track_id}',
            path: {
                'track_id': trackId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Music Track
     * 删除音乐曲目
     * @param trackId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteMusicTrackApiV1MusicTracksTrackIdDelete(
        trackId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/music-tracks/{track_id}',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Track Lyrics
     * 获取歌词
     * @param trackId
     * @returns LyricsResponse Successful Response
     * @throws ApiError
     */
    public static getTrackLyricsApiV1MusicTracksTrackIdLyricsGet(
        trackId: number,
    ): CancelablePromise<LyricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/{track_id}/lyrics',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Player Code
     * 获取播放器代码
     * @param trackId
     * @returns PlayerCode Successful Response
     * @throws ApiError
     */
    public static getPlayerCodeApiV1MusicTracksTrackIdPlayerGet(
        trackId: number,
    ): CancelablePromise<PlayerCode> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music-tracks/{track_id}/player',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Play
     * 记录播放
     * @param trackId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordPlayApiV1MusicTracksTrackIdPlayPost(
        trackId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music-tracks/{track_id}/play',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Backfill Netease Ids
     * 批量补全无效的 netease_id
     *
     * 扫描所有歌曲，对 netease_id 非纯数字的记录通过网易云搜索 API 自动匹配补全。
     * 使用 dry_run=true 可先预览将要修复的内容。
     * @param dryRun 预览模式，不实际修改数据
     * @returns any Successful Response
     * @throws ApiError
     */
    public static backfillNeteaseIdsApiV1MusicTracksBackfillNeteaseIdsPost(
        dryRun: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music-tracks/backfill-netease-ids',
            query: {
                'dry_run': dryRun,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Overview
     * 音乐馆首页概览
     *
     * 返回统计数据、歌单列表和最近添加的歌曲
     * @returns MusicPublicOverview Successful Response
     * @throws ApiError
     */
    public static getMusicOverviewApiV1MusicGet(): CancelablePromise<MusicPublicOverview> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/',
        });
    }
    /**
     * Get Public Playlists
     * 获取公开歌单列表（分页）
     *
     * 仅返回公开且启用的歌单
     * @param tags 标签筛选，逗号分隔
     * @param page 页码
     * @param size 每页数量
     * @returns MusicPublicPlaylistList Successful Response
     * @throws ApiError
     */
    public static getPublicPlaylistsApiV1MusicPlaylistsGet(
        tags?: (string | null),
        page: number = 1,
        size: number = 20,
    ): CancelablePromise<MusicPublicPlaylistList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/playlists',
            query: {
                'tags': tags,
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Playlist Detail
     * 获取歌单详情（含歌曲列表）
     *
     * 自动增加浏览次数
     * @param playlistId
     * @param page 歌曲页码
     * @param size 每页歌曲数
     * @returns MusicPublicPlaylistDetail Successful Response
     * @throws ApiError
     */
    public static getPublicPlaylistDetailApiV1MusicPlaylistsPlaylistIdGet(
        playlistId: number,
        page: number = 1,
        size: number = 50,
    ): CancelablePromise<MusicPublicPlaylistDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/playlists/{playlist_id}',
            path: {
                'playlist_id': playlistId,
            },
            query: {
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Playlist Tracks
     * 获取歌单内歌曲列表（分页，支持筛选）
     * @param playlistId
     * @param category 分类筛选
     * @param tags 标签筛选，逗号分隔
     * @param status 状态筛选
     * @param page 页码
     * @param size 每页数量
     * @returns MusicPublicTrackList Successful Response
     * @throws ApiError
     */
    public static getPublicPlaylistTracksApiV1MusicPlaylistsPlaylistIdTracksGet(
        playlistId: number,
        category?: (string | null),
        tags?: (string | null),
        status?: (string | null),
        page: number = 1,
        size: number = 20,
    ): CancelablePromise<MusicPublicTrackList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/playlists/{playlist_id}/tracks',
            path: {
                'playlist_id': playlistId,
            },
            query: {
                'category': category,
                'tags': tags,
                'status': status,
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Random Tracks
     * 随机推荐歌曲
     *
     * 从所有公开歌单中随机抽取歌曲
     * @param count 推荐数量
     * @returns MusicPublicTrack Successful Response
     * @throws ApiError
     */
    public static getRandomTracksApiV1MusicTracksRandomGet(
        count: number = 5,
    ): CancelablePromise<Array<MusicPublicTrack>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/tracks/random',
            query: {
                'count': count,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Track Detail
     * 获取歌曲详情
     *
     * 仅返回公开歌单下的歌曲
     * @param trackId
     * @returns MusicPublicTrack Successful Response
     * @throws ApiError
     */
    public static getPublicTrackDetailApiV1MusicTracksTrackIdGet(
        trackId: number,
    ): CancelablePromise<MusicPublicTrack> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/tracks/{track_id}',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Player Code
     * 获取播放器 iframe 代码
     *
     * 仅返回公开歌单下的歌曲播放器
     * @param trackId
     * @returns PlayerCode Successful Response
     * @throws ApiError
     */
    public static getPublicPlayerCodeApiV1MusicTracksTrackIdPlayerGet(
        trackId: number,
    ): CancelablePromise<PlayerCode> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/tracks/{track_id}/player',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Track Lyrics
     * 获取歌词
     *
     * 仅返回公开歌单下的歌曲歌词
     * @param trackId
     * @returns LyricsResponse Successful Response
     * @throws ApiError
     */
    public static getPublicTrackLyricsApiV1MusicTracksTrackIdLyricsGet(
        trackId: number,
    ): CancelablePromise<LyricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/tracks/{track_id}/lyrics',
            path: {
                'track_id': trackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Music Stats
     * 音乐馆统计数据
     *
     * 返回歌单数、歌曲数、播放统计、分类统计等
     * @returns MusicPublicStats Successful Response
     * @throws ApiError
     */
    public static getMusicStatsApiV1MusicStatsGet(): CancelablePromise<MusicPublicStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/stats',
        });
    }
    /**
     * Get Games
     * 获取游戏列表
     * @param platform 平台: steam, epic, ps, switch, pc, mobile, other
     * @param category 分类: rpg, fps, strategy, simulation, indie, adventure, other
     * @param status 状态: want_play, playing, completed, shelved, dropped
     * @param tags 标签，逗号分隔
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param isR18 是否 R18 成人内容
     * @param skip
     * @param limit
     * @param sortBy 排序: sort_order, created_at, title, play_time, rating
     * @returns GameShowcase Successful Response
     * @throws ApiError
     */
    public static getGamesApiV1GameShowcaseGet(
        platform?: (string | null),
        category?: (string | null),
        status?: (string | null),
        tags?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        isR18?: (boolean | null),
        skip?: number,
        limit: number = 100,
        sortBy: string = 'sort_order',
    ): CancelablePromise<Array<GameShowcase>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/',
            query: {
                'platform': platform,
                'category': category,
                'status': status,
                'tags': tags,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'is_r18': isR18,
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Game
     * 创建游戏
     * @param requestBody
     * @returns GameShowcase Successful Response
     * @throws ApiError
     */
    public static createGameApiV1GameShowcasePost(
        requestBody: GameShowcaseCreate,
    ): CancelablePromise<GameShowcase> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/game-showcase/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Games Paginated
     * 分页获取游戏列表
     * @param platform 平台
     * @param category 分类
     * @param status 状态
     * @param tags 标签
     * @param isFavorite 是否收藏
     * @param isActive 是否启用
     * @param isR18 是否 R18 成人内容
     * @param page
     * @param size
     * @param sortBy
     * @returns GameShowcaseList Successful Response
     * @throws ApiError
     */
    public static getGamesPaginatedApiV1GameShowcaseListGet(
        platform?: (string | null),
        category?: (string | null),
        status?: (string | null),
        tags?: (string | null),
        isFavorite?: (boolean | null),
        isActive?: (boolean | null),
        isR18?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<GameShowcaseList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/list',
            query: {
                'platform': platform,
                'category': category,
                'status': status,
                'tags': tags,
                'is_favorite': isFavorite,
                'is_active': isActive,
                'is_r18': isR18,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Game Stats
     * 获取游戏总体统计
     * @returns GameOverallStats Successful Response
     * @throws ApiError
     */
    public static getGameStatsApiV1GameShowcaseStatsGet(): CancelablePromise<GameOverallStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/stats',
        });
    }
    /**
     * Get Status Stats
     * 获取游戏状态统计
     * @returns GameStatusStats Successful Response
     * @throws ApiError
     */
    public static getStatusStatsApiV1GameShowcaseStatsStatusGet(): CancelablePromise<Array<GameStatusStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/stats/status',
        });
    }
    /**
     * Get Platform Stats
     * 获取游戏平台统计
     * @returns GamePlatformStats Successful Response
     * @throws ApiError
     */
    public static getPlatformStatsApiV1GameShowcaseStatsPlatformGet(): CancelablePromise<Array<GamePlatformStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/stats/platform',
        });
    }
    /**
     * Get Category Stats
     * 获取游戏分类统计
     * @returns GameCategoryStats Successful Response
     * @throws ApiError
     */
    public static getCategoryStatsApiV1GameShowcaseStatsCategoryGet(): CancelablePromise<Array<GameCategoryStats>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/stats/category',
        });
    }
    /**
     * Import From Steam
     * 从 Steam 批量导入游戏
     * @param requestBody
     * @returns SteamImportResponse Successful Response
     * @throws ApiError
     */
    public static importFromSteamApiV1GameShowcaseImportFromSteamPost(
        requestBody: SteamImportRequest,
    ): CancelablePromise<SteamImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/game-showcase/import-from-steam',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync From Steam
     * 同步 Steam 游戏数据（更新游玩时长等）
     * @param steamId Steam 64位用户ID
     * @returns any Successful Response
     * @throws ApiError
     */
    public static syncFromSteamApiV1GameShowcaseSyncFromSteamPost(
        steamId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/game-showcase/sync-from-steam',
            query: {
                'steam_id': steamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Game
     * 获取单个游戏详情
     * @param gameId
     * @returns GameShowcase Successful Response
     * @throws ApiError
     */
    public static getGameApiV1GameShowcaseGameIdGet(
        gameId: number,
    ): CancelablePromise<GameShowcase> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/game-showcase/{game_id}',
            path: {
                'game_id': gameId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Game
     * 更新游戏
     * @param gameId
     * @param requestBody
     * @returns GameShowcase Successful Response
     * @throws ApiError
     */
    public static updateGameApiV1GameShowcaseGameIdPut(
        gameId: number,
        requestBody: GameShowcaseUpdate,
    ): CancelablePromise<GameShowcase> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/game-showcase/{game_id}',
            path: {
                'game_id': gameId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Game
     * 删除游戏
     * @param gameId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteGameApiV1GameShowcaseGameIdDelete(
        gameId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/game-showcase/{game_id}',
            path: {
                'game_id': gameId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Games Overview
     * 游戏展示首页概览（排除 R18 成人内容）
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getGamesOverviewApiV1GamesGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/games/',
        });
    }
    /**
     * Get Public Games
     * 公开游戏列表（分页，排除 R18 成人内容）
     * @param platform 平台
     * @param category 分类
     * @param status 状态
     * @param tags 标签
     * @param isFavorite 是否收藏
     * @param page
     * @param size
     * @param sortBy
     * @returns GameShowcaseList Successful Response
     * @throws ApiError
     */
    public static getPublicGamesApiV1GamesListGet(
        platform?: (string | null),
        category?: (string | null),
        status?: (string | null),
        tags?: (string | null),
        isFavorite?: (boolean | null),
        page: number = 1,
        size: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<GameShowcaseList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/games/list',
            query: {
                'platform': platform,
                'category': category,
                'status': status,
                'tags': tags,
                'is_favorite': isFavorite,
                'page': page,
                'size': size,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Random Games
     * 随机推荐游戏
     * @param count 随机数量
     * @returns GameShowcase Successful Response
     * @throws ApiError
     */
    public static getRandomGamesApiV1GamesRandomGet(
        count: number = 5,
    ): CancelablePromise<Array<GameShowcase>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/games/random',
            query: {
                'count': count,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Stats
     * 公开统计数据
     * @returns GameOverallStats Successful Response
     * @throws ApiError
     */
    public static getPublicStatsApiV1GamesStatsGet(): CancelablePromise<GameOverallStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/games/stats',
        });
    }
    /**
     * Get Public Game
     * 获取单个游戏详情（仅已启用的）
     * @param gameId
     * @returns GameShowcase Successful Response
     * @throws ApiError
     */
    public static getPublicGameApiV1GamesGameIdGet(
        gameId: number,
    ): CancelablePromise<GameShowcase> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/games/{game_id}',
            path: {
                'game_id': gameId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Album
     * 创建相册
     * @param requestBody
     * @returns AlbumResponse Successful Response
     * @throws ApiError
     */
    public static createAlbumApiV1AlbumsPost(
        requestBody: AlbumCreate,
    ): CancelablePromise<AlbumResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/albums/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Albums
     * 获取相册列表（非超级管理员强制只返回公开相册）
     * @param skip 跳过的记录数
     * @param limit 每页记录数
     * @param publicOnly 是否只获取公开相册
     * @param tag 按标签筛选
     * @param sortBy 排序字段：created_at, updated_at, view_count, title
     * @returns AlbumListResponse Successful Response
     * @throws ApiError
     */
    public static getAlbumsApiV1AlbumsGet(
        skip?: number,
        limit: number = 20,
        publicOnly: boolean = true,
        tag?: (string | null),
        sortBy: string = 'created_at',
    ): CancelablePromise<AlbumListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/albums/',
            query: {
                'skip': skip,
                'limit': limit,
                'public_only': publicOnly,
                'tag': tag,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Album
     * 获取单个相册详情（私有相册仅 owner / 超级管理员）
     * @param albumId
     * @returns AlbumResponse Successful Response
     * @throws ApiError
     */
    public static getAlbumApiV1AlbumsAlbumIdGet(
        albumId: number,
    ): CancelablePromise<AlbumResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/albums/{album_id}',
            path: {
                'album_id': albumId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Album
     * 更新相册（仅 owner / 超级管理员）
     * @param albumId
     * @param requestBody
     * @returns AlbumResponse Successful Response
     * @throws ApiError
     */
    public static updateAlbumApiV1AlbumsAlbumIdPut(
        albumId: number,
        requestBody: AlbumUpdate,
    ): CancelablePromise<AlbumResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/albums/{album_id}',
            path: {
                'album_id': albumId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Album
     * 删除相册（仅 owner / 超级管理员）
     * @param albumId
     * @returns void
     * @throws ApiError
     */
    public static deleteAlbumApiV1AlbumsAlbumIdDelete(
        albumId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/albums/{album_id}',
            path: {
                'album_id': albumId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Photo Upload Url
     * 获取照片上传URL（仅相册 owner / 超级管理员）
     * @param albumId
     * @param filename 文件名
     * @returns app__schemas__album__ImageUploadUrlResponse Successful Response
     * @throws ApiError
     */
    public static getPhotoUploadUrlApiV1AlbumsAlbumIdPhotosUploadUrlPost(
        albumId: number,
        filename: string,
    ): CancelablePromise<app__schemas__album__ImageUploadUrlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/albums/{album_id}/photos/upload-url',
            path: {
                'album_id': albumId,
            },
            query: {
                'filename': filename,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Photo
     * 上传照片到相册（仅相册 owner / 超级管理员）
     * @param albumId
     * @param formData
     * @returns PhotoResponse Successful Response
     * @throws ApiError
     */
    public static uploadPhotoApiV1AlbumsAlbumIdPhotosPost(
        albumId: number,
        formData: Body_upload_photo_api_v1_albums__album_id__photos_post,
    ): CancelablePromise<PhotoResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/albums/{album_id}/photos',
            path: {
                'album_id': albumId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Album Photos
     * 获取相册中的照片列表（私有相册仅 owner / 超级管理员）
     * @param albumId
     * @param skip 跳过的记录数
     * @param limit 每页记录数
     * @param sortBy 排序字段：sort_order, created_at, updated_at
     * @returns PhotoListResponse Successful Response
     * @throws ApiError
     */
    public static getAlbumPhotosApiV1AlbumsAlbumIdPhotosGet(
        albumId: number,
        skip?: number,
        limit: number = 20,
        sortBy: string = 'sort_order',
    ): CancelablePromise<PhotoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/albums/{album_id}/photos',
            path: {
                'album_id': albumId,
            },
            query: {
                'skip': skip,
                'limit': limit,
                'sort_by': sortBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Photo
     * 获取单张照片详情（私有相册照片仅 owner / 超级管理员）
     * @param photoId
     * @returns PhotoResponse Successful Response
     * @throws ApiError
     */
    public static getPhotoApiV1AlbumsPhotosPhotoIdGet(
        photoId: number,
    ): CancelablePromise<PhotoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/albums/photos/{photo_id}',
            path: {
                'photo_id': photoId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Photo
     * 更新照片信息（仅相册 owner / 超级管理员）
     * @param photoId
     * @param requestBody
     * @returns PhotoResponse Successful Response
     * @throws ApiError
     */
    public static updatePhotoApiV1AlbumsPhotosPhotoIdPut(
        photoId: number,
        requestBody: PhotoUpdate,
    ): CancelablePromise<PhotoResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/albums/photos/{photo_id}',
            path: {
                'photo_id': photoId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Photo
     * 删除照片（仅相册 owner / 超级管理员）
     * @param photoId
     * @returns void
     * @throws ApiError
     */
    public static deletePhotoApiV1AlbumsPhotosPhotoIdDelete(
        photoId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/albums/photos/{photo_id}',
            path: {
                'photo_id': photoId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Site Stats
     * 获取站点基本统计信息（仅超级管理员）。
     * @returns SiteStatsResponse Successful Response
     * @throws ApiError
     */
    public static getSiteStatsApiV1SiteStatsGet(): CancelablePromise<SiteStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/site-stats/',
        });
    }
    /**
     * Get Detailed Stats
     * 获取详细统计信息（仅超级管理员）。
     * @param period 统计周期: 7days, 30days, 90days
     * @returns DetailedStatsResponse Successful Response
     * @throws ApiError
     */
    public static getDetailedStatsApiV1SiteStatsDetailedGet(
        period: string = '7days',
    ): CancelablePromise<DetailedStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/site-stats/detailed',
            query: {
                'period': period,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload About File
     * 上传md文件到about文件夹
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadAboutFileApiV1AboutUploadPost(
        formData: Body_upload_about_file_api_v1_about_upload_post,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/about/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get About Files
     * 获取所有about文件的MinIO链接
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAboutFilesApiV1AboutGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/about/',
        });
    }
    /**
     * Delete About File
     * 删除指定的about文件
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAboutFileApiV1AboutFileIdDelete(
        fileId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/about/{file_id}',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Proxy Image
     * 代理获取图片，解决前端跨域问题
     *
     * 使用方式:
     * 前端: <img src="http://localhost:8000/api/proxy/image?url=https://example.com/image.jpg" />
     *
     * 参数:
     * - url: 要代理的图片URL（必需）
     * - width: 可选的图片宽度
     * - height: 可选的图片高度
     * @param url 要代理的图片URL
     * @param width 可选的图片宽度
     * @param height 可选的图片高度
     * @returns any Successful Response
     * @throws ApiError
     */
    public static proxyImageApiV1ProxyImageGet(
        url: string,
        width?: (number | null),
        height?: (number | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/image',
            query: {
                'url': url,
                'width': width,
                'height': height,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Thumbnail
     * 创建缩略图（需要安装Pillow库）
     * 使用方式: /api/proxy/thumbnail?url=https://example.com/large.jpg&width=200&height=200
     * @param url 原始图片URL
     * @param width 缩略图宽度
     * @param height 缩略图高度
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createThumbnailApiV1ProxyThumbnailGet(
        url: string,
        width: number = 300,
        height: number = 300,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/thumbnail',
            query: {
                'url': url,
                'width': width,
                'height': height,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Proxy Md File
     * 代理获取MD文件内容，通过缓存加速访问
     *
     * 参数：
     * - file_id: MD文件的ID
     * - force_refresh: 是否强制刷新缓存
     *
     * 权限：匿名用户仅可获取公开文件（is_public=True）；
     * 登录用户可获取自己的文件，超级管理员可获取任意文件。
     * 无权访问时统一返回 404，避免泄露文件是否存在。
     *
     * 注意：本接口用独立短 session 查元数据，查完立即归还连接；
     * 后续 MinIO 回源 / 缓存读取不再占用 DB 连接，避免高并发下
     * MinIO 慢回源拖垮数据库连接池（QueuePool 耗尽）。
     * @param fileId
     * @param forceRefresh 是否强制刷新缓存
     * @returns any Successful Response
     * @throws ApiError
     */
    public static proxyMdFileApiV1ProxyMdFileIdGet(
        fileId: number,
        forceRefresh: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/md/{file_id}',
            path: {
                'file_id': fileId,
            },
            query: {
                'force_refresh': forceRefresh,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Invalidate Md Cache
     * 使MD文件的缓存失效
     *
     * 参数:
     * - file_id: MD文件的ID
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static invalidateMdCacheApiV1ProxyMdFileIdInvalidateGet(
        fileId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/md/{file_id}/invalidate',
            path: {
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Cache Stats
     * 获取缓存统计信息
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getCacheStatsApiV1ProxyMdStatsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/md/stats',
        });
    }
    /**
     * Clean Expired Cache
     * 清理过期的缓存文件
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cleanExpiredCacheApiV1ProxyMdCleanPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxy/md/clean',
        });
    }
    /**
     * Proxy Oss Object
     * 代理获取 OSS（MinIO）对象，隐藏 OSS 真实地址
     *
     * 使用方式:
     * 前端: <img src="http://后端/api/v1/proxy/oss/diary-imagesV2/xxx.jpg" />
     *
     * 参数:
     * - object_name: OSS 对象名（支持包含多级路径）
     * @param objectName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static proxyOssObjectApiV1ProxyOssObjectNameGet(
        objectName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/oss/{object_name}',
            path: {
                'object_name': objectName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clean Expired Image Cache
     * 清理过期的图片缓存
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cleanExpiredImageCacheApiV1ProxyOssCleanPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxy/oss/clean',
        });
    }
    /**
     * Get Image Cache Stats
     * 获取图片缓存统计信息
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getImageCacheStatsApiV1ProxyOssStatsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxy/oss-stats',
        });
    }
    /**
     * Stream Logs
     * 实时日志流接口
     *
     * 使用 Server-Sent Events (SSE) 实时推送日志
     *
     * 参数:
     * level: 日志级别过滤 (DEBUG, INFO, WARNING, ERROR)
     * module: 模块名过滤
     * lines: 初始返回的日志行数
     * follow: 是否持续跟踪新日志
     *
     * 返回:
     * SSE 流，每行日志作为一个事件
     * @param level 日志级别过滤
     * @param module 模块名过滤
     * @param lines 初始返回的日志行数
     * @param follow 是否持续跟踪新日志
     * @returns any Successful Response
     * @throws ApiError
     */
    public static streamLogsApiV1AdminLogsStreamGet(
        level?: (string | null),
        module?: (string | null),
        lines: number = 100,
        follow: boolean = true,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/logs/stream',
            query: {
                'level': level,
                'module': module,
                'lines': lines,
                'follow': follow,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Log Files
     * 获取可用的日志文件列表
     *
     * 返回:
     * 日志文件列表，包含文件名、路径、大小和修改时间
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getLogFilesApiV1AdminLogsFilesGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/logs/files',
        });
    }
    /**
     * Get Log Stats
     * 获取日志统计信息
     *
     * 返回:
     * 日志统计信息，包含总行数、各级别日志数量、文件大小等
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getLogStatsApiV1AdminLogsStatsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/logs/stats',
        });
    }
    /**
     * Get Performance Metrics
     * 获取性能监控指标
     *
     * 返回系统、应用、数据库和业务的完整性能指标
     *
     * 返回:
     * PerformanceResponse 包含所有性能指标
     * @param useCache 是否使用缓存
     * @returns PerformanceResponse Successful Response
     * @throws ApiError
     */
    public static getPerformanceMetricsApiV1AdminPerformanceGet(
        useCache: boolean = true,
    ): CancelablePromise<PerformanceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/performance',
            query: {
                'use_cache': useCache,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get System Status
     * 获取系统状态
     *
     * 返回系统整体健康状态和各组件状态
     *
     * 返回:
     * SystemStatusResponse 包含系统状态信息
     * @returns SystemStatusResponse Successful Response
     * @throws ApiError
     */
    public static getSystemStatusApiV1AdminSystemStatusGet(): CancelablePromise<SystemStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/system-status',
        });
    }
    /**
     * Get Database Pool Status
     * 获取数据库连接池状态
     *
     * 返回数据库连接池的详细状态信息
     *
     * 返回:
     * DatabasePoolStatus 包含连接池状态
     * @returns DatabasePoolStatus Successful Response
     * @throws ApiError
     */
    public static getDatabasePoolStatusApiV1AdminDatabasePoolGet(): CancelablePromise<DatabasePoolStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/database-pool',
        });
    }
    /**
     * Get System Performance
     * 获取系统性能指标
     *
     * 返回 CPU、内存、磁盘、网络等系统性能指标
     *
     * 返回:
     * SystemPerformanceMetrics 系统性能指标
     * @returns SystemPerformanceMetrics Successful Response
     * @throws ApiError
     */
    public static getSystemPerformanceApiV1AdminPerformanceSystemGet(): CancelablePromise<SystemPerformanceMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/performance/system',
        });
    }
    /**
     * Get Application Performance
     * 获取应用性能指标
     *
     * 返回请求数、响应时间、错误率等应用性能指标
     *
     * 返回:
     * ApplicationPerformanceMetrics 应用性能指标
     * @returns ApplicationPerformanceMetrics Successful Response
     * @throws ApiError
     */
    public static getApplicationPerformanceApiV1AdminPerformanceApplicationGet(): CancelablePromise<ApplicationPerformanceMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/performance/application',
        });
    }
    /**
     * Get Database Performance
     * 获取数据库性能指标
     *
     * 返回连接池、查询等数据库性能指标
     *
     * 返回:
     * DatabasePerformanceMetrics 数据库性能指标
     * @returns DatabasePerformanceMetrics Successful Response
     * @throws ApiError
     */
    public static getDatabasePerformanceApiV1AdminPerformanceDatabaseGet(): CancelablePromise<DatabasePerformanceMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/performance/database',
        });
    }
    /**
     * Get Business Metrics
     * 获取业务指标
     *
     * 返回用户数、内容数、访问量等业务指标
     *
     * 返回:
     * BusinessMetrics 业务指标
     * @returns BusinessMetrics Successful Response
     * @throws ApiError
     */
    public static getBusinessMetricsApiV1AdminPerformanceBusinessGet(): CancelablePromise<BusinessMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/performance/business',
        });
    }
    /**
     * Get Admin Dashboard
     * 获取后台管理仪表盘数据
     *
     * 返回后台管理所需的所有关键数据
     *
     * 返回:
     * 包含系统状态、性能指标、日志统计等综合数据
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAdminDashboardApiV1AdminDashboardGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/dashboard',
        });
    }
    /**
     * Admin Health Check
     * 后台管理健康检查
     *
     * 检查后台管理功能是否正常工作
     *
     * 返回:
     * 健康检查结果
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminHealthCheckApiV1AdminHealthCheckGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/health-check',
        });
    }
    /**
     * Get All Tasks
     * 获取所有定时任务列表和状态（仅超级管理员，last_error 可能含内部信息）
     * @returns TaskListResponse Successful Response
     * @throws ApiError
     */
    public static getAllTasksApiV1SchedulerTasksGet(): CancelablePromise<TaskListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/scheduler/tasks',
        });
    }
    /**
     * Get Task Detail
     * 获取单个任务详情（仅超级管理员）
     * @param taskName
     * @returns TaskStatusResponse Successful Response
     * @throws ApiError
     */
    public static getTaskDetailApiV1SchedulerTasksTaskNameGet(
        taskName: string,
    ): CancelablePromise<TaskStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/scheduler/tasks/{task_name}',
            path: {
                'task_name': taskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Enable Task
     * 启用定时任务
     * @param taskName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static enableTaskApiV1SchedulerTasksTaskNameEnablePost(
        taskName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/scheduler/tasks/{task_name}/enable',
            path: {
                'task_name': taskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Disable Task
     * 禁用定时任务
     * @param taskName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static disableTaskApiV1SchedulerTasksTaskNameDisablePost(
        taskName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/scheduler/tasks/{task_name}/disable',
            path: {
                'task_name': taskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Task Now
     * 手动触发执行任务
     * @param taskName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static runTaskNowApiV1SchedulerTasksTaskNameRunPost(
        taskName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/scheduler/tasks/{task_name}/run',
            path: {
                'task_name': taskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Test Not Found
     * 测试资源未找到异常
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testNotFoundApiV1TestExceptionsTestNotFoundGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/not-found',
        });
    }
    /**
     * Test Bad Request
     * 测试请求参数错误异常
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testBadRequestApiV1TestExceptionsTestBadRequestGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/bad-request',
        });
    }
    /**
     * Test Validation
     * 测试数据验证异常
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testValidationApiV1TestExceptionsTestValidationGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/validation',
        });
    }
    /**
     * Test Database Error
     * 测试数据库异常
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testDatabaseErrorApiV1TestExceptionsTestDatabaseErrorGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/database-error',
        });
    }
    /**
     * Test External Service Error
     * 测试外部服务异常
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testExternalServiceErrorApiV1TestExceptionsTestExternalServiceErrorGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/external-service-error',
        });
    }
    /**
     * Test Success
     * 测试成功响应
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testSuccessApiV1TestExceptionsTestSuccessGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/success',
        });
    }
    /**
     * Test Paginated
     * 测试分页响应
     * @param page
     * @param pageSize
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testPaginatedApiV1TestExceptionsTestPaginatedGet(
        page: number = 1,
        pageSize: number = 5,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/paginated',
            query: {
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Test Unknown Error
     * 测试未知异常（会被全局异常处理器捕获）
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testUnknownErrorApiV1TestExceptionsTestUnknownErrorGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/unknown-error',
        });
    }
    /**
     * Test Structured Logging
     * 测试结构化日志
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testStructuredLoggingApiV1TestExceptionsTestStructuredLoggingGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/structured-logging',
        });
    }
    /**
     * Test Performance Monitor
     * 测试性能监控
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testPerformanceMonitorApiV1TestExceptionsTestPerformanceMonitorGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test-exceptions/test/performance-monitor',
        });
    }
}
