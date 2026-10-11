import axios from 'axios';
import { API_BASE_URL, getAuthToken } from '../config/api';

/**
 * 通知后端清除前台（Next.js）的站点配置缓存。
 * 后端以超管身份代理调用前台 POST /api/site-config/revalidate，
 * 刷新密钥只保存在服务端（VITE_ 变量会进前端包，故不走前台直连）。
 * 调用方（SiteConfig 保存/上传后）不阻塞等待；失败时前台仍会按
 * 60 秒缓存 + ISR 自然过期，只是短暂陈旧。
 */
export async function revalidateSiteConfig(): Promise<void> {
  const token = getAuthToken();
  await axios.post(
    `${API_BASE_URL}/api/v1/site-config/revalidate-frontend`,
    null,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: true,
    }
  );
}

/**
 * 强制刷新站点配置（通过添加时间戳参数避免浏览器缓存）
 */
export function getConfigWithCacheBust(): string {
  return `/api/v1/site-config/active?t=${Date.now()}`;
}
