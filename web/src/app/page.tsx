import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n';

/**
 * 根路径 / 重定向到默认语言首页
 * 与 middleware 配合：middleware 也会将 / 重定向到 /zh，此 page 作为兜底
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}

