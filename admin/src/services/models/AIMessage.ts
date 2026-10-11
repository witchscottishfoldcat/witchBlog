/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageRole } from './MessageRole';
/**
 * AI消息模型
 */
export type AIMessage = {
    /**
     * 消息角色
     */
    role: MessageRole;
    /**
     * 消息内容，支持纯文本或混合内容（文本+图片）
     */
    content: string;
};

