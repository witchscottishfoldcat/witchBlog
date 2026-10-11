# 后台管理 API 前端开发文档

## 📋 目录
- [概述](#概述)
- [认证方式](#认证方式)
- [API 端点](#api-端点)
- [数据模型](#数据模型)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 概述

后台管理 API 提供系统监控、日志查看、性能指标等功能，**仅超级管理员可访问**。

### 基础信息
- **基础 URL**: `http://your-domain.com/api/v1`
- **认证方式**: Bearer Token (JWT)
- **权限要求**: `is_superuser = true`
- **数据格式**: JSON
- **字符编码**: UTF-8

### 功能模块
- 实时日志流（SSE）
- 系统性能监控
- 数据库连接池监控
- 业务指标统计
- 系统健康检查

---

## 认证方式

### 1. 获取访问令牌

**端点**: `POST /auth/login`

**请求头**:
```http
Content-Type: application/x-www-form-urlencoded
```

**请求体**:
```http
username=admin&password=your_password
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 2. 使用令牌访问 API

所有后台管理 API 都需要在请求头中携带令牌：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 令牌刷新

令牌有效期过后，需要重新登录获取新令牌。

---

## API 端点

### 1. 实时日志流

#### 获取日志流（SSE）

**端点**: `GET /admin/logs/stream`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|--------|---------|------|
| level | string | 否 | null | 日志级别过滤: DEBUG, INFO, WARNING, ERROR |
| module | string | 否 | null | 模块名过滤 |
| lines | int | 否 | 100 | 初始返回的日志行数 (1-10000) |
| follow | bool | 否 | true | 是否持续跟踪新日志 |

**响应**: Server-Sent Events (SSE) 流

**响应格式**:
```
data: {"timestamp":"2026-02-09 13:26:07","level":"DEBUG","module":"database","message":"从连接池取出连接","context":null}

data: {"timestamp":"2026-02-09 13:26:07","level":"INFO","module":"app.api.v1.admin","message":"超级管理员 admin 请求实时日志流","context":null}
```

#### 获取日志文件列表

**端点**: `GET /admin/logs/files`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "name": "app.log",
      "path": "logs/app.log",
      "size": 3164474,
      "modified": "2026-02-09T13:26:07.123456"
    },
    {
      "name": "app_error.log",
      "path": "logs/app_error.log",
      "size": 2222244,
      "modified": "2026-02-09T13:26:07.123456"
    }
  ],
  "count": 2
}
```

#### 获取日志统计

**端点**: `GET /admin/logs/stats`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total_lines": 31837,
    "error_count": 50,
    "warning_count": 200,
    "info_count": 8000,
    "debug_count": 1750,
    "file_size": 3165521
  }
}
```

---

### 2. 性能监控

#### 获取完整性能指标

**端点**: `GET /admin/performance`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|--------|---------|------|
| use_cache | bool | 否 | true | 是否使用缓存（5秒） |

**响应**:
```json
{
  "timestamp": "2026-02-09T13:59:57.569447",
  "system": {
    "cpu_percent": 17.6,
    "cpu_count": 4,
    "memory_total": 8192,
    "memory_used": 7680,
    "memory_percent": 93.9,
    "disk_total": 102400,
    "disk_used": 92000,
    "disk_percent": 89.9,
    "network_sent": 1024000,
    "network_recv": 2048000,
    "boot_time": "2026-02-01T00:00:00",
    "uptime": 691200
  },
  "application": {
    "total_requests": 10000,
    "today_requests": 500,
    "average_response_time": 125.5,
    "error_rate": 0.5,
    "active_connections": 10,
    "uptime": 86400,
    "start_time": "2026-02-08T10:30:00"
  },
  "database": {
    "pool_size": 20,
    "checked_out": 5,
    "checked_in": 15,
    "invalid": 0,
    "total_connections": 1000,
    "connection_errors": 2,
    "status": "healthy"
  },
  "business": {
    "total_users": 100,
    "active_users": 80,
    "total_diaries": 500,
    "total_albums": 50,
    "total_photos": 1000,
    "total_visitors": 10000,
    "today_visitors": 500
  }
}
```

#### 获取系统性能指标

**端点**: `GET /admin/performance/system`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "cpu_percent": 17.6,
  "cpu_count": 4,
  "memory_total": 8192,
  "memory_used": 7680,
  "memory_percent": 93.9,
  "disk_total": 102400,
  "disk_used": 92000,
  "disk_percent": 89.9,
  "network_sent": 1024000,
  "network_recv": 2048000,
  "boot_time": "2026-02-01T00:00:00",
  "uptime": 691200
}
```

#### 获取应用性能指标

**端点**: `GET /admin/performance/application`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "total_requests": 10000,
  "today_requests": 500,
  "average_response_time": 125.5,
  "error_rate": 0.5,
  "active_connections": 10,
  "uptime": 86400,
  "start_time": "2026-02-08T10:30:00"
}
```

#### 获取数据库性能指标

**端点**: `GET /admin/performance/database`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "pool_size": 20,
  "checked_out": 5,
  "checked_in": 15,
  "invalid": 0,
  "total_connections": 1000,
  "connection_errors": 2,
  "status": "healthy"
}
```

#### 获取业务指标

**端点**: `GET /admin/performance/business`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "total_users": 100,
  "active_users": 80,
  "total_diaries": 500,
  "total_albums": 50,
  "total_photos": 1000,
  "total_visitors": 10000,
  "today_visitors": 500
}
```

---

### 3. 系统管理

#### 获取系统状态

**端点**: `GET /admin/system-status`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-09T13:59:57.569447",
  "uptime": 86400,
  "version": "1.0.2",
  "environment": "production",
  "components": {
    "database": "healthy"
  },
  "health_checks": {
    "database": {
      "status": "healthy",
      "timestamp": 1739104200.0,
      "connection_pool": {
        "total_connections": 1000,
        "current_connections": 20,
        "checked_out_connections": 5,
        "connection_errors": 2
      }
    }
  }
}
```

#### 获取数据库连接池状态

**端点**: `GET /admin/database-pool`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "pool_size": 20,
  "max_overflow": 40,
  "checked_in": 15,
  "checked_out": 5,
  "overflow": 0,
  "invalid": 0,
  "total_connections": 1000,
  "connection_errors": 2,
  "current_connections": 20,
  "status": "healthy"
}
```

#### 获取仪表盘数据

**端点**: `GET /admin/dashboard`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "success": true,
  "data": {
    "system_status": {
      "status": "healthy",
      "timestamp": "2026-02-09T13:59:57.569447",
      "uptime": 86400,
      "version": "1.0.2",
      "environment": "production"
    },
    "performance": {
      "timestamp": "2026-02-09T13:59:57.569447",
      "system": {...},
      "application": {...},
      "database": {...},
      "business": {...}
    },
    "log_stats": {
      "total_lines": 31837,
      "error_count": 50,
      "warning_count": 200,
      "info_count": 8000,
      "debug_count": 1750,
      "file_size": 3165521
    },
    "log_files": [...],
    "timestamp": "2026-02-09T13:59:57.569447"
  }
}
```

#### 健康检查

**端点**: `GET /admin/health-check`

**请求头**:
```http
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "status": "healthy",
  "checks": {
    "performance_monitor": true,
    "log_stream_service": true,
    "database": true,
    "system_metrics": true,
    "log_file": true
  },
  "timestamp": "2026-02-08T10:30:00"
}
```

---

## 数据模型

### LogEntry
```typescript
interface LogEntry {
  timestamp: string;    // 时间戳 "2026-02-09 13:26:07"
  level: string;        // 日志级别: DEBUG, INFO, WARNING, ERROR, RAW
  module: string;       // 模块名
  message: string;      // 日志消息
  context?: {           // 上下文信息（可选）
    [key: string]: string;
  };
}
```

### SystemPerformanceMetrics
```typescript
interface SystemPerformanceMetrics {
  cpu_percent: number;      // CPU 使用率 (%)
  cpu_count: number;       // CPU 核心数
  memory_total: number;     // 总内存 (MB)
  memory_used: number;     // 已用内存 (MB)
  memory_percent: number;   // 内存使用率 (%)
  disk_total: number;      // 总磁盘空间 (MB)
  disk_used: number;       // 已用磁盘空间 (MB)
  disk_percent: number;    // 磁盘使用率 (%)
  network_sent: number;    // 网络发送字节数
  network_recv: number;    // 网络接收字节数
  boot_time: string;       // 系统启动时间
  uptime: number;         // 系统运行时间 (秒)
}
```

### ApplicationPerformanceMetrics
```typescript
interface ApplicationPerformanceMetrics {
  total_requests: number;        // 总请求数
  today_requests: number;        // 今日请求数
  average_response_time: number; // 平均响应时间 (ms)
  error_rate: number;           // 错误率 (%)
  active_connections: number;    // 活跃连接数
  uptime: number;               // 应用运行时间 (秒)
  start_time: string;           // 应用启动时间
}
```

### DatabasePerformanceMetrics
```typescript
interface DatabasePerformanceMetrics {
  pool_size: number;         // 连接池大小
  checked_out: number;       // 已取出连接数
  checked_in: number;        // 已归还连接数
  invalid: number;           // 无效连接数
  total_connections: number;   // 总连接数
  connection_errors: number;   // 连接错误数
  status: string;            // 数据库状态: healthy, unhealthy
}
```

### BusinessMetrics
```typescript
interface BusinessMetrics {
  total_users: number;      // 总用户数
  active_users: number;      // 活跃用户数
  total_diaries: number;    // 总日记数
  total_albums: number;     // 总相册数
  total_photos: number;     // 总照片数
  total_visitors: number;    // 总访问者数
  today_visitors: number;    // 今日访问者数
}
```

---

## 使用示例

### 1. 基础设置

```typescript
// API 基础配置
const API_BASE_URL = 'http://your-domain.com/api/v1';
const TOKEN_KEY = 'admin_token';

// 获取存储的令牌
const getToken = (): string => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

// 设置令牌
const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// 创建请求头
const createHeaders = (): HeadersInit => ({
  'Authorization': `Bearer ${getToken()}`
});
```

### 2. 登录示例

```typescript
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

const login = async (username: string, password: string): Promise<void> => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error('登录失败');
  }

  const data: LoginResponse = await response.json();
  setToken(data.access_token);
};
```

### 3. 实时日志流（SSE）

```typescript
interface LogStreamOptions {
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  module?: string;
  lines?: number;
  follow?: boolean;
}

const connectLogStream = (
  options: LogStreamOptions = {},
  onMessage: (log: LogEntry) => void,
  onError: (error: Error) => void
): EventSource => {
  const params = new URLSearchParams();
  if (options.level) params.append('level', options.level);
  if (options.module) params.append('module', options.module);
  if (options.lines) params.append('lines', options.lines.toString());
  if (options.follow !== undefined) params.append('follow', options.follow.toString());

  const eventSource = new EventSource(
    `${API_BASE_URL}/admin/logs/stream?${params.toString()}`,
    {
      headers: createHeaders(),
    }
  );

  eventSource.onmessage = (event) => {
    try {
      const log: LogEntry = JSON.parse(event.data);
      onMessage(log);
    } catch (error) {
      console.error('解析日志失败:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('日志流连接错误:', error);
    onError(new Error('日志流连接失败'));
  };

  return eventSource;
};

// 使用示例
const eventSource = connectLogStream(
  { level: 'INFO', lines: 50, follow: true },
  (log) => {
    console.log(`[${log.timestamp}] ${log.level} - ${log.message}`);
    // 更新 UI 显示日志
    updateLogDisplay(log);
  },
  (error) => {
    console.error('日志流错误:', error);
    // 显示错误提示
    showErrorMessage('日志流连接失败，请重试');
  }
);

// 断开连接
const disconnectLogStream = (eventSource: EventSource): void => {
  eventSource.close();
};
```

### 4. 性能监控

```typescript
interface PerformanceResponse {
  timestamp: string;
  system: SystemPerformanceMetrics;
  application: ApplicationPerformanceMetrics;
  database: DatabasePerformanceMetrics;
  business: BusinessMetrics;
}

const getPerformance = async (useCache = true): Promise<PerformanceResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/admin/performance?use_cache=${useCache}`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('获取性能指标失败');
  }

  return response.json();
};

// 定时刷新性能指标
const startPerformanceMonitoring = (
  intervalMs = 5000,
  onUpdate: (data: PerformanceResponse) => void
): NodeJS.Timeout => {
  const updatePerformance = async () => {
    try {
      const data = await getPerformance();
      onUpdate(data);
    } catch (error) {
      console.error('获取性能指标失败:', error);
    }
  };

  // 立即获取一次
  updatePerformance();

  // 定时刷新
  return setInterval(updatePerformance, intervalMs);
};

// 使用示例
const timer = startPerformanceMonitoring(5000, (data) => {
  console.log('CPU:', data.system.cpu_percent + '%');
  console.log('内存:', data.system.memory_percent + '%');
  console.log('磁盘:', data.system.disk_percent + '%');
  
  // 更新 UI
  updateSystemMetrics(data.system);
  updateApplicationMetrics(data.application);
  updateDatabaseMetrics(data.database);
  updateBusinessMetrics(data.business);
});

// 停止监控
const stopPerformanceMonitoring = (timer: NodeJS.Timeout): void => {
  clearInterval(timer);
};
```

### 5. 系统状态

```typescript
interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: { [key: string]: string };
  health_checks: { [key: string]: any };
}

const getSystemStatus = async (): Promise<SystemStatus> => {
  const response = await fetch(
    `${API_BASE_URL}/admin/system-status`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('获取系统状态失败');
  }

  return response.json();
};

// 使用示例
const checkSystemHealth = async (): Promise<void> => {
  try {
    const status = await getSystemStatus();
    
    // 根据状态显示不同的 UI
    switch (status.status) {
      case 'healthy':
        showSuccessStatus('系统运行正常');
        break;
      case 'degraded':
        showWarningStatus('系统性能下降');
        break;
      case 'unhealthy':
        showErrorStatus('系统异常');
        break;
    }
    
    // 显示详细信息
    displaySystemDetails(status);
  } catch (error) {
    console.error('获取系统状态失败:', error);
    showErrorStatus('无法获取系统状态');
  }
};
```

### 6. React 组件示例

```typescript
import React, { useState, useEffect, useRef } from 'react';

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 获取系统状态
    getSystemStatus().then(setSystemStatus).catch(console.error);
    
    // 获取性能指标
    getPerformance().then(setPerformance).catch(console.error);
    
    // 连接日志流
    const eventSource = connectLogStream(
      { level: 'INFO', lines: 50 },
      (log) => {
        setLogs(prev => [...prev.slice(-99), log]);
      },
      (error) => {
        console.error('日志流错误:', error);
      }
    );
    eventSourceRef.current = eventSource;
    
    // 定时刷新性能指标
    const timer = startPerformanceMonitoring(5000, (data) => {
      setPerformance(data);
    });
    timerRef.current = timer;
    
    // 清理
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="admin-dashboard">
      {/* 系统状态 */}
      {systemStatus && (
        <SystemStatusCard status={systemStatus} />
      )}
      
      {/* 性能指标 */}
      {performance && (
        <PerformanceMetrics data={performance} />
      )}
      
      {/* 实时日志 */}
      <LogStreamPanel logs={logs} />
    </div>
  );
};

export default AdminDashboard;
```

---

## 最佳实践

### 1. 令牌管理

```typescript
// 使用 localStorage 存储令牌
const TOKEN_KEY = 'admin_token';

// 登录时保存令牌
localStorage.setItem(TOKEN_KEY, token);

// 退出时清除令牌
localStorage.removeItem(TOKEN_KEY);

// 每次请求都检查令牌是否存在
const token = localStorage.getItem(TOKEN_KEY);
if (!token) {
  // 跳转到登录页
  window.location.href = '/login';
}
```

### 2. 错误处理

```typescript
const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...createHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // 令牌失效，跳转到登录页
      window.location.href = '/login';
      throw new Error('认证失败');
    }

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
};
```

### 3. 性能优化

```typescript
// 使用防抖减少请求频率
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 使用防抖处理性能监控刷新
const debouncedUpdatePerformance = debounce(
  (data: PerformanceResponse) => updateUI(data),
  300
);
```

### 4. 日志流管理

```typescript
// 限制日志显示数量，避免内存溢出
const MAX_LOGS = 1000;

const addLog = (logs: LogEntry[], newLog: LogEntry): LogEntry[] => {
  const updatedLogs = [...logs, newLog];
  
  // 如果超过最大数量，删除旧的日志
  if (updatedLogs.length > MAX_LOGS) {
    return updatedLogs.slice(-MAX_LOGS);
  }
  
  return updatedLogs;
};
```

---

## 常见问题

### Q1: 如何处理令牌过期？

**A**: 监听 401 错误，自动跳转到登录页：

```typescript
if (response.status === 401) {
  // 清除令牌
  localStorage.removeItem('admin_token');
  // 跳转到登录页
  window.location.href = '/login';
}
```

### Q2: SSE 连接断开如何重连？

**A**: 实现自动重连机制：

```typescript
const connectLogStreamWithRetry = (
  options: LogStreamOptions,
  onMessage: (log: LogEntry) => void,
  maxRetries = 3
): EventSource => {
  let retryCount = 0;
  
  const connect = (): EventSource => {
    const eventSource = connectLogStream(options, onMessage, (error) => {
      console.error('日志流断开:', error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => {
          console.log(`尝试重连 (${retryCount}/${maxRetries})...`);
          connect();
        }, 2000);
      }
    });
    
    return eventSource;
  };
  
  return connect();
};
```

### Q3: 如何优化性能监控刷新频率？

**A**: 根据网络状况动态调整：

```typescript
const getOptimalInterval = (): number => {
  const connectionType = navigator.connection?.effectiveType;
  
  switch (connectionType) {
    case 'slow-2g':
    case '2g':
      return 10000; // 10秒
    case '3g':
      return 5000;  // 5秒
    default:
      return 3000;  // 3秒
  }
};

const interval = getOptimalInterval();
startPerformanceMonitoring(interval, updateUI);
```

### Q4: 如何处理大量日志数据？

**A**: 使用虚拟滚动和分页：

```typescript
// 只渲染可见的日志
const VirtualLogList: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const visibleLogs = logs.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div>
      {visibleLogs.map((log, index) => (
        <LogItem key={index} log={log} />
      ))}
    </div>
  );
};
```

---

## 错误码说明

| HTTP 状态码 | 说明 | 处理方式 |
|------------|------|----------|
| 200 | 请求成功 | 正常处理 |
| 401 | 未授权 | 跳转到登录页 |
| 403 | 禁止访问 | 检查超级管理员权限 |
| 500 | 服务器错误 | 显示错误提示，稍后重试 |
| 503 | 服务不可用 | 显示维护提示 |

---

## 技术支持

如有问题，请联系：
- **API 文档**: http://your-domain.com/docs
- **问题反馈**: issue tracker
- **技术文档**: docs/ 目录

---

**最后更新**: 2026-02-09
**API 版本**: v1.0.0
