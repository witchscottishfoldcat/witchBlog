import type { Messages, MessageNamespace } from './messages';

/**
 * 获取嵌套键的类型
 * 支持如 "pagination.previous" 这样的嵌套键
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

/**
 * 获取嵌套值的类型
 */
type NestedValue<
  T extends object,
  K extends string
> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? T[Key] extends object
      ? NestedValue<T[Key], Rest>
      : never
    : never
  : K extends keyof T
  ? T[K]
  : never;

declare module 'next-intl' {
  /**
   * 客户端翻译 Hook
   * @template T 命名空间类型
   * @returns 翻译函数，支持嵌套键（如 "pagination.previous"）
   */
  export function useTranslations<T extends MessageNamespace>(
    namespace?: T
  ): <K extends NestedKeyOf<Messages[T]>>(
    key: K,
    values?: Record<string, unknown>
  ) => string;

  /**
   * 获取当前语言
   * @returns 当前语言代码
   */
  export function useLocale(): import('../i18n').Locale;

  /**
   * NextIntl 客户端提供者
   */
  export const NextIntlClientProvider: React.ComponentType<{
    children: React.ReactNode;
    messages: Messages;
    locale?: string;
    timeZone?: string;
  }>;
}

declare module 'next-intl/server' {
  /**
   * 服务器端翻译函数
   * @template T 命名空间类型
   * @returns Promise，解析为翻译函数，支持嵌套键（如 "pagination.previous"）
   */
  export function getTranslations<T extends MessageNamespace>(
    namespace?: T
  ): Promise<
    <K extends NestedKeyOf<Messages[T]>>(
      key: K,
      values?: Record<string, unknown>
    ) => string
  >;
}


