/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameCategoryStats } from './GameCategoryStats';
import type { GamePlatformStats } from './GamePlatformStats';
import type { GameStatusStats } from './GameStatusStats';
/**
 * 游戏总体统计
 */
export type GameOverallStats = {
    total_games: number;
    total_play_time: number;
    total_play_time_hours: number;
    favorite_count: number;
    average_rating: (number | null);
    status_stats: Array<GameStatusStats>;
    platform_stats: Array<GamePlatformStats>;
    category_stats: Array<GameCategoryStats>;
};

