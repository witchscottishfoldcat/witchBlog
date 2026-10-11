import axios from 'axios';
import { Service } from '../services';
import { setAuthToken, getAuthToken, API_BASE_URL } from '../config/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export const login = async (credentials: LoginCredentials, remember = true) => {
  try {
    // 使用URLSearchParams来发送application/x-www-form-urlencoded格式的数据
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    params.append('grant_type', 'password');
    params.append('scope', remember ? 'remember' : '');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/login`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true,
      }
    );
    
    if (response.data?.access_token) {
      setAuthToken(response.data.access_token);
      return response.data;
    }
    
    throw new Error('登录失败：未收到访问令牌');
  } catch (error: any) {
    // 处理API错误
    console.error('登录错误详情:', error);
    
    // 处理 422 验证错误 - 根据 API 文档，格式为 { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
    if (error?.response?.status === 422) {
      const detail = error.response.data?.detail;
      if (detail) {
        if (Array.isArray(detail)) {
          // detail 是数组，每个元素有 loc, msg, type
          const errorMessages = detail.map((d: any) => {
            if (typeof d === 'string') return d;
            // 提取字段名（loc 数组的最后一个元素通常是字段名）
            const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
            const fieldName = field ? `${field}: ` : '';
            return `${fieldName}${d.msg || d.message || JSON.stringify(d)}`;
          });
          throw new Error(errorMessages.join('; '));
        } else if (typeof detail === 'string') {
          throw new Error(detail);
        } else {
          throw new Error('请求参数验证失败');
        }
      } else {
        throw new Error('请求参数验证失败');
      }
    }
    
    // 处理 401 未授权错误
    if (error?.response?.status === 401) {
      throw new Error('用户名或密码错误');
    }
    
    // 处理其他错误响应
    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
        throw new Error(detail);
      } else if (Array.isArray(detail)) {
        throw new Error(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '));
      } else {
        throw new Error(JSON.stringify(detail));
      }
    }
    
    // 处理网络错误和 CORS 错误
    if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
      // 检查是否是 CORS 错误
      const isCorsError = error?.message?.includes('CORS') || 
                         error?.request?.status === 0 ||
                         (error?.request?.readyState === 4 && !error?.response);
      
      if (isCorsError) {
        throw new Error('跨域请求被阻止。请配置后端 CORS 或使用 Nginx 反向代理');
      } else {
        throw new Error('网络连接失败，请检查网络连接或服务器是否可用');
      }
    }
    
    if (error?.message) {
      throw new Error(error.message);
    }
    
    throw new Error('登录失败，请检查网络连接和用户名密码');
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, { withCredentials: true });
  } finally {
    setAuthToken(null);
    window.location.href = '/login';
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const getCurrentUser = async () => {
  try {
    return await Service.readUserMeApiV1UsersMeGet();
  } catch (error: any) {
    // 如果是 401 错误，拦截器已经处理了重定向，这里不需要再调用 logout
    // 其他错误直接抛出，让调用者处理
    if (error?.response?.status === 401) {
      // 401 错误由拦截器处理，这里只抛出错误
      throw error;
    }
    // 其他错误也直接抛出
    throw error;
  }
};

