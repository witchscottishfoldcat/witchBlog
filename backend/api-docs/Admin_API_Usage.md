# 后台管理 API 使用文档

## 概述

后台管理 API 提供系统监控、日志查看、性能指标等功能，**仅超级管理员可访问**。

## 权限要求

所有后台管理接口都需要用户具有 `is_superuser=True` 权限。非超级管理员访问将返回 401 未授权错误。

## API 端点

### 1. 实时日志流

**端点**: `GET /api/v1/admin/logs/stream`

**描述**: 使用 Server-Sent Events (SSE) 实时推送日志

**查询参数**:
- `level` (可选): 日志级别过滤 (DEBUG, INFO, WARNING, ERROR)
- `module` (可选): 模块名过滤
- `lines` (可选): 初始返回的日志行数，默认 100，最大 10000
- `follow` (可选): 是否持续跟踪新日志，默认 true

**响应格式**: SSE 流，每行日志作为一个事件

**示例**:
```bash
# 获取所有实时日志
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/admin/logs/stream"

# 只获取 ERROR 级别的日志
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/admin/logs/stream?level=ERROR"

# 获取特定模块的日志
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/admin/logs/stream?module=database"
```

**JavaScript 使用示例**:
```javascript
const eventSource = new EventSource(
  '/api/v1/admin/logs/stream?level=INFO&lines=50',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);

eventSource.onmessage = function(event) {
  const logEntry = JSON.parse(event.data);
  console.log(`[${logEntry.timestamp}] ${logEntry.level} - ${logEntry.message}`);
};

eventSource.onerror = function(error) {
  console.error('日志流连接错误:', error);
  eventSource.close();
};
```

### 2. 获取日志文件列表

**端点**: `GET /api/v1/admin/logs/files`

**描述**: 获取可用的日志文件列表

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "app.log",
      "path": "logs/app.log",
      "size": 1024000,
      "modified": "2025-02-09T10:30:00"
    },
    {
      "name": "app_error.log",
      "path": "logs/app_error.log",
      "size": 51200,
      "modified": "2025-02-09T10:30:00"
    }
  ],
  "count": 2
}
```

### 3. 获取日志统计信息

**端点**: `GET /api/v1/admin/logs/stats`

**描述**: 获取日志统计信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_lines": 10000,
    "error_count": 50,
    "warning_count": 200,
    "info_count": 8000,
    "debug_count": 1750,
    "file_size": 1024000
  }
}
```

### 4. 获取性能监控指标

**端点**: `GET /api/v1/admin/performance`

**查询参数**:
- `use_cache` (可选): 是否使用缓存，默认 true

**响应示例**:
```json
{
  "timestamp": "2025-02-09T10:30:00",
  "system": {
    "cpu_percent": 45.2,
    "cpu_count": 4,
    "memory_total": 8192,
    "memory_used": 4096,
    "memory_percent": 50.0,
    "disk_total": 102400,
    "disk_used": 51200,
    "disk_percent": 50.0,
    "network_sent": 1024000,
    "network_recv": 2048000,
    "boot_time": "2025-02-01T00:00:00",
    "uptime": 691200
  },
  "application": {
    "total_requests": 10000,
    "today_requests": 500,
    "average_response_time": 125.5,
    "error_rate": 0.5,
    "active_connections": 10,
    "uptime": 86400,
    "start_time": "2025-02-08T10:30:00"
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

### 5. 获取系统状态

**端点**: `GET /api/v1/admin/system-status`

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2025-02-09T10:30:00",
  "uptime": 86400,
  "version": "1.0.0",
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

### 6. 获取数据库连接池状态

**端点**: `GET /api/v1/admin/database-pool`

**响应示例**:
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

### 7. 获取系统性能指标

**端点**: `GET /api/v1/admin/performance/system`

**响应**: 仅返回系统性能指标（CPU、内存、磁盘、网络）

### 8. 获取应用性能指标

**端点**: `GET /api/v1/admin/performance/application`

**响应**: 仅返回应用性能指标（请求、响应时间、错误率）

### 9. 获取数据库性能指标

**端点**: `GET /api/v1/admin/performance/database`

**响应**: 仅返回数据库性能指标（连接池、查询）

### 10. 获取业务指标

**端点**: `GET /api/v1/admin/performance/business`

**响应**: 仅返回业务指标（用户数、内容数、访问量）

### 11. 获取后台管理仪表盘

**端点**: `GET /api/v1/admin/dashboard`

**描述**: 获取后台管理所需的所有关键数据

**响应示例**:
```json
{
  "success": true,
  "data": {
    "system_status": { ... },
    "performance": { ... },
    "log_stats": { ... },
    "log_files": [ ... ],
    "timestamp": "2025-02-09T10:30:00"
  }
}
```

### 12. 后台管理健康检查

**端点**: `GET /api/v1/admin/health-check`

**响应示例**:
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
  "timestamp": "2025-02-08T10:30:00"
}
```

## 使用前准备

### 1. 创建超级管理员用户

```bash
# 注册用户
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure_password",
    "full_name": "System Administrator"
  }'

# 在数据库中设置 is_superuser = True
# 使用 SQL 或管理工具更新 users 表
UPDATE users SET is_superuser = true WHERE username = 'admin';
```

### 2. 获取访问令牌

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=secure_password"
```

响应示例:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

注意: 需要安装 `psutil` 来获取系统性能指标。

## 前端集成示例

### React 组件示例

```jsx
import React, { useState, useEffect } from 'react';

function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  const token = localStorage.getItem('admin_token');

  // 获取性能指标
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/admin/performance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setPerformance(data));
  }, [token]);

  // 获取系统状态
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/admin/system-status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setSystemStatus(data));
  }, [token]);

  // 实时日志流
  useEffect(() => {
    const eventSource = new EventSource(
      `http://localhost:8000/api/v1/admin/logs/stream?level=INFO&lines=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    eventSource.onmessage = (event) => {
      const logEntry = JSON.parse(event.data);
      setLogs(prev => [...prev.slice(-99), logEntry]);
    };

    return () => eventSource.close();
  }, [token]);

  return (
    <div>
      <h1>后台管理仪表盘</h1>
      
      {/* 系统状态 */}
      {systemStatus && (
        <div>
          <h2>系统状态: {systemStatus.status}</h2>
          <p>运行时间: {systemStatus.uptime} 秒</p>
        </div>
      )}

      {/* 性能指标 */}
      {performance && (
        <div>
          <h2>性能指标</h2>
          <p>CPU: {performance.system.cpu_percent}%</p>
          <p>内存: {performance.system.memory_percent}%</p>
          <p>平均响应时间: {performance.application.average_response_time}ms</p>
        </div>
      )}

      {/* 实时日志 */}
      <div>
        <h2>实时日志</h2>
        <ul>
          {logs.map((log, index) => (
            <li key={index}>
              [{log.timestamp}] {log.level} - {log.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;
```

## 安全建议

1. **访问控制**: 确保只有可信的超级管理员可以访问这些接口
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **令牌保护**: 妥善保管访问令牌，定期刷新
4. **日志过滤**: 避免在日志中记录敏感信息
5. **速率限制**: 考虑对实时日志流接口添加速率限制

## 注意事项

1. **psutil 依赖**: 系统性能指标需要 `psutil` 库，如果未安装，相关接口将返回默认值
2. **日志文件**: 确保日志文件存在且可读
3. **性能影响**: 实时日志流可能会对服务器性能产生影响，建议合理设置初始行数
4. **缓存**: 性能指标默认使用 5 秒缓存，可通过 `use_cache=false` 禁用

## 故障排除

### 问题: 获取系统性能指标失败

**解决**: 确保已安装 `psutil` 库
```bash
pip install psutil==5.9.6
```

### 问题: 日志流连接断开

**解决**: 检查日志文件是否存在，确认有写入权限

### 问题: 401 未授权错误

**解决**: 确保用户具有 `is_superuser=True` 权限，令牌有效
