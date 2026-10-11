/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 归档文件响应模型
 */
export type MDFileArchive = {
    original_file_id: number;
    title: string;
    description?: (string | null);
    original_filename: string;
    archive_object_name: string;
    bucket_name: string;
    file_size?: (number | null);
    file_url?: (string | null);
    etag?: (string | null);
    word_count?: (number | null);
    is_public?: (boolean | null);
    tags?: (string | null);
    archive_reason?: (string | null);
    published?: (boolean | null);
    category?: (string | null);
    subcategory?: (string | null);
    pinned?: (boolean | null);
    encrypted?: (boolean | null);
    author?: (string | null);
    parsed_metadata?: (Record<string, any> | null);
    id: number;
    archive_date: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
};

