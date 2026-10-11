/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Steam 导入响应
 */
export type SteamImportResponse = {
    /**
     * Steam 库中总游戏数
     */
    total_found: number;
    /**
     * 新导入的游戏数
     */
    imported: number;
    /**
     * 更新的游戏数
     */
    updated: number;
    /**
     * 跳过的游戏数
     */
    skipped: number;
    /**
     * 失败的游戏数
     */
    failed: number;
    message: string;
};

