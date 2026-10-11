import axios from 'axios';
import { OpenAPI } from '../services/core/OpenAPI';

// 配置API基础URL
// 优先使用环境变量 VITE_API_BASE_URL
// 开发环境默认使用相对路径（通过 Vite 代理）
// 生产环境默认使用相对路径（通过 Nginx 代理）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 初始化OpenAPI配置
OpenAPI.BASE = API_BASE_URL;
OpenAPI.WITH_CREDENTIALS = true;

const LEGACY_TOKEN_KEYS = ['auth_token', 'auth_refresh_token'];
let accessToken: string | null = null;

/**
 * Access tokens live in memory only. The refresh token is an httpOnly cookie
 * and is therefore never exposed to JavaScript or browser storage.
 */
export const getAuthToken = (): string | null => {
  return accessToken;
};

export const setAuthToken = (token: string | null) => {
  accessToken = token;
  OpenAPI.TOKEN = token ?? undefined;
  // Remove credentials left by older releases during the first page load.
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

// 用刷新令牌换取新的访问令牌；成功返回 true
const refreshTokens = async (): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const { access_token } = response.data ?? {};
    if (!access_token) return false;
    setAuthToken(access_token);
    return true;
  } catch {
    return false;
  }
};

// 并发 401 时只发起一次刷新，其余请求等待同一次结果
let refreshInFlight: Promise<boolean> | null = null;

const startRefresh = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    setAuthToken(null);
    // 使用 setTimeout 避免在请求处理过程中重定向
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }
};

export const initAuth = async (): Promise<boolean> => {
  setAuthToken(null);
  return startRefresh();
};

// 配置 axios 响应拦截器：401 时先尝试刷新令牌并重试原请求，刷新失败再登出
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalConfig = error.config;
      const isAuthEndpoint =
        typeof originalConfig?.url === 'string' &&
        (originalConfig.url.includes('/auth/login') || originalConfig.url.includes('/auth/refresh'));

      if (!isAuthEndpoint && originalConfig && !originalConfig._retry) {
        originalConfig._retry = true;
        const refreshed = await startRefresh();
        if (refreshed) {
          originalConfig.headers = originalConfig.headers ?? {};
          originalConfig.headers['Authorization'] = `Bearer ${getAuthToken()}`;
          return axios(originalConfig);
        }
      }

      // 刷新失败（或本就是登录/刷新接口的 401）：清除 token 并重定向到登录页
      if (!isAuthEndpoint) {
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

// Restore a session from the protected refresh cookie after a full page load.
export const authReady = initAuth();
