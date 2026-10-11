/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Steam 导入请求
 */
export type SteamImportRequest = {
    /**
     * Steam 64位用户ID
     */
    steam_id: string;
    /**
     * 是否导入全部游戏（False 则只导入有游玩时长的）
     */
    import_all?: boolean;
    /**
     * 导入时的默认状态
     */
    default_status?: string;
};

