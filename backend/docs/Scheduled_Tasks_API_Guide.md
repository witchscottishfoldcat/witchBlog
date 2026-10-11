# 定时任务管理 API 文档

## 概述

定时任务管理系统提供了查看、启用/禁用、手动触发等功能。所有任务状态持久化到数据库，支持实时监控任务执行情况。

## 基础信息

- **基础路径**: `/api/v1/scheduler`
- **认证**: 需要登录
- **响应格式**: JSON

---

## 数据模型

### TaskStatusResponse - 任务状态响应

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 任务名称 |
| `description` | string | 任务描述 |
| `trigger_type` | string | 触发类型（`interval`/`cron`） |
| `schedule` | string | 调度表达式 |
| `is_enabled` | boolean | 是否启用 |
| `is_running` | boolean | 是否正在运行 |
| `last_run_at` | datetime | 最后运行时间 |
| `next_run_at` | datetime | 下次运行时间 |
| `last_status` | string | 最后运行状态 |
| `last_error` | string | 最后错误信息 |
| `last_duration` | number | 最后执行时长（秒） |
| `run_count` | number | 累计运行次数 |

### TaskListResponse - 任务列表响应

| 字段 | 类型 | 说明 |
|------|------|------|
| `tasks` | array | 任务列表 |
| `total` | number | 总任务数 |
| `enabled_count` | number | 启用的任务数 |
| `disabled_count` | number | 禁用的任务数 |

---

## API 端点

### 1. 获取所有定时任务

**端点**: `GET /api/v1/scheduler/tasks`

**描述**: 获取所有定时任务的列表和状态

**请求参数**: 无

**响应示例**:
```json
{
  "tasks": [
    {
      "name": "minio_url_refresh",
      "description": "刷新 MinIO 文件签名 URL，防止链接过期",
      "trigger_type": "interval",
      "schedule": "每小时执行",
      "is_enabled": true,
      "is_running": false,
      "last_run_at": "2026-02-11T10:00:00.000Z",
      "next_run_at": "2026-02-11T11:00:00.000Z",
      "last_status": "success",
      "last_error": null,
      "last_duration": 5,
      "run_count": 125
    },
    {
      "name": "steam_game_sync",
      "description": "从 Steam 同步游戏数据（游玩时长等）",
      "trigger_type": "cron",
      "schedule": "每天 03:00",
      "is_enabled": true,
      "is_running": false,
      "last_run_at": "2026-02-11T03:00:00.000Z",
      "next_run_at": "2026-02-12T03:00:00.000Z",
      "last_status": "success",
      "last_error": null,
      "last_duration": 120,
      "run_count": 45
    }
  ],
  "total": 2,
  "enabled_count": 2,
  "disabled_count": 0
}
```

---

### 2. 获取单个任务详情

**端点**: `GET /api/v1/scheduler/tasks/{task_name}`

**描述**: 获取指定任务的详细信息

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|--------|------|
| `task_name` | string | 是 | 任务名称 |

**请求示例**:
```
GET /api/v1/scheduler/tasks/minio_url_refresh
```

**响应示例**:
```json
{
  "name": "minio_url_refresh",
  "description": "刷新 MinIO 文件签名 URL，防止链接过期",
  "trigger_type": "interval",
  "schedule": "每小时执行",
  "is_enabled": true,
  "is_running": false,
  "last_run_at": "2026-02-11T10:00:00.000Z",
  "next_run_at": "2026-02-11T11:00:00.000Z",
  "last_status": "success",
  "last_error": null,
  "last_duration": 5,
  "run_count": 125
}
```

**错误响应** (404):
```json
{
  "detail": "任务 unknown_task 不存在"
}
```

---

### 3. 启用定时任务

**端点**: `POST /api/v1/scheduler/tasks/{task_name}/enable`

**描述**: 启用指定的定时任务

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|--------|------|
| `task_name` | string | 是 | 任务名称 |

**请求示例**:
```
POST /api/v1/scheduler/tasks/steam_game_sync/enable
```

**响应示例**:
```json
{
  "message": "任务 steam_game_sync 已启用",
  "is_enabled": true
}
```

**错误响应** (404):
```json
{
  "detail": "任务 unknown_task 不存在"
}
```

---

### 4. 禁用定时任务

**端点**: `POST /api/v1/scheduler/tasks/{task_name}/disable`

**描述**: 禁用指定的定时任务

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|--------|------|
| `task_name` | string | 是 | 任务名称 |

**请求示例**:
```
POST /api/v1/scheduler/tasks/minio_url_refresh/disable
```

**响应示例**:
```json
{
  "message": "任务 minio_url_refresh 已禁用",
  "is_enabled": false
}
```

**错误响应** (404):
```json
{
  "detail": "任务 unknown_task 不存在"
}
```

---

### 5. 手动触发任务

**端点**: `POST /api/v1/scheduler/tasks/{task_name}/run`

**描述**: 立即手动触发执行指定的定时任务

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|--------|------|
| `task_name` | string | 是 | 任务名称 |

**请求示例**:
```
POST /api/v1/scheduler/tasks/minio_url_refresh/run
```

**成功响应示例**:
```json
{
  "success": true,
  "message": "任务已触发",
  "job_id": "minio_url_refresh",
  "started_at": "2026-02-11T10:30:00.000Z"
}
```

**错误响应** (404):
```json
{
  "detail": "任务 unknown_task 不存在"
}
```

**执行失败响应**:
```json
{
  "success": false,
  "error": "任务执行失败：连接超时",
  "job_id": "minio_url_refresh"
}
```

---

## 当前可用任务

| 任务名称 | 描述 | 触发类型 | 调度频率 |
|---------|--------|----------|-----------|
| `minio_url_refresh` | 将 MinIO 文件 URL 刷新为稳定的代理 URL，清理历史遗留的预签名/直链地址 | interval | 每小时 |
| `steam_game_sync` | 从 Steam 同步游戏数据（游玩时长等） | cron | 每天 03:00 |
| `project_stats_sync` | 从 GitHub / Gitee 更新项目模块仓库的星标数与复刻数 | cron | 每天 04:00 |

---

## 触发类型说明

### interval（间隔触发）
- 按固定时间间隔执行
- 示例：每小时、每 30 分钟

### cron（Cron 表达式触发）
- 按指定时间规则执行（当前支持每天固定时刻：`hour` + `minute`）
- 触发时间按 `SCHEDULER_TIMEZONE` 配置的时区解释（默认 `Asia/Shanghai`），
  不依赖容器系统时区；应用停机期间错过的执行会在启动时补跑一次
- 示例：每天 03:00

---

## 任务状态说明

| 状态 | 说明 |
|------|------|
| `pending` | 等待执行 |
| `running` | 正在执行 |
| `success` | 执行成功 |
| `failed` | 执行失败 |

---

## 前端集成示例

### React 示例

```tsx
import { useState, useEffect } from 'react';

interface Task {
  name: string;
  description: string;
  trigger_type: string;
  schedule: string;
  is_enabled: boolean;
  is_running: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_duration: number | null;
  run_count: number;
}

interface TaskList {
  tasks: Task[];
  total: number;
  enabled_count: number;
  disabled_count: number;
}

const ScheduledTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取任务列表
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/scheduler/tasks');
      const data: TaskList = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 启用任务
  const enableTask = async (taskName: string) => {
    try {
      const response = await fetch(`/api/v1/scheduler/tasks/${taskName}/enable`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log(data.message);
      fetchTasks(); // 刷新列表
    } catch (error) {
      console.error('启用任务失败:', error);
    }
  };

  // 禁用任务
  const disableTask = async (taskName: string) => {
    try {
      const response = await fetch(`/api/v1/scheduler/tasks/${taskName}/disable`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log(data.message);
      fetchTasks(); // 刷新列表
    } catch (error) {
      console.error('禁用任务失败:', error);
    }
  };

  // 手动触发任务
  const runTask = async (taskName: string) => {
    if (!confirm(`确定要立即执行任务 "${taskName}" 吗？`)) return;
    
    try {
      const response = await fetch(`/api/v1/scheduler/tasks/${taskName}/run`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert(`执行失败: ${data.error}`);
      }
    } catch (error) {
      console.error('触发任务失败:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    // 每 30 秒刷新一次状态
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scheduled-tasks">
      <h2>定时任务管理</h2>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>任务名称</th>
              <th>描述</th>
              <th>调度频率</th>
              <th>状态</th>
              <th>最后运行</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.name}>
                <td>{task.name}</td>
                <td>{task.description}</td>
                <td>{task.schedule}</td>
                <td>
                  {task.is_enabled ? (
                    <span className="badge success">已启用</span>
                  ) : (
                    <span className="badge warning">已禁用</span>
                  )}
                  {task.is_running && <span className="badge info">运行中</span>}
                </td>
                <td>{task.last_run_at ? new Date(task.last_run_at).toLocaleString() : '-'}</td>
                <td>
                  <button 
                    onClick={() => enableTask(task.name)}
                    disabled={task.is_enabled}
                  >
                    启用
                  </button>
                  <button 
                    onClick={() => disableTask(task.name)}
                    disabled={!task.is_enabled}
                  >
                    禁用
                  </button>
                  <button 
                    onClick={() => runTask(task.name)}
                    disabled={task.is_running}
                  >
                    立即执行
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ScheduledTasks;
```

### Vue 示例

```vue
<template>
  <div class="scheduled-tasks">
    <h2>定时任务管理</h2>
    <div v-if="loading">加载中...</div>
    <table v-else>
      <thead>
        <tr>
          <th>任务名称</th>
          <th>描述</th>
          <th>调度频率</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in tasks" :key="task.name">
          <td>{{ task.name }}</td>
          <td>{{ task.description }}</td>
          <td>{{ task.schedule }}</td>
          <td>
            <span v-if="task.is_enabled" class="badge success">已启用</span>
            <span v-else class="badge warning">已禁用</span>
            <span v-if="task.is_running" class="badge info">运行中</span>
          </td>
          <td>
            <button @click="enableTask(task.name)" :disabled="task.is_enabled">启用</button>
            <button @click="disableTask(task.name)" :disabled="!task.is_enabled">禁用</button>
            <button @click="runTask(task.name)" :disabled="task.is_running">立即执行</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'ScheduledTasks',
  setup() {
    const tasks = ref([]);
    const loading = ref(false);

    const fetchTasks = async () => {
      loading.value = true;
      try {
        const response = await fetch('/api/v1/scheduler/tasks');
        const data = await response.json();
        tasks.value = data.tasks;
      } catch (error) {
        console.error('获取任务列表失败:', error);
      } finally {
        loading.value = false;
      }
    };

    const enableTask = async (taskName) => {
      try {
        const response = await fetch(`/api/v1/scheduler/tasks/${taskName}/enable`, {
          method: 'POST',
        });
        const data = await response.json();
        console.log(data.message);
        fetchTasks();
      } catch (error) {
        console.error('启用任务失败:', error);
      }
    };

    const disableTask = async (taskName) => {
      try {
        const response = await fetch(`/api/v1/scheduler/tasks/${taskName}/disable`, {
          method: 'POST',
        });
        const data = await response.json();
        console.log(data.message);
        fetchTasks();
      } catch (error) {
        console.error('禁用任务失败:', error);
      }
    };

    const runTask = async (taskName) => {
      if (!confirm(`确定要立即执行任务 "${taskName}" 吗？`)) return;
      
      try {
        const response = await fetch(`/api/v1/scheduler/tasks/${taskName}/run`, {
          method: 'POST',
        });
        const data = await response.json();
        if (data.success) {
          alert(data.message);
        } else {
          alert(`执行失败: ${data.error}`);
        }
      } catch (error) {
        console.error('触发任务失败:', error);
      }
    };

    let interval;
    onMounted(() => {
      fetchTasks();
      interval = setInterval(fetchTasks, 30000);
    });

    onUnmounted(() => {
      clearInterval(interval);
    });

    return {
      tasks,
      loading,
      enableTask,
      disableTask,
      runTask,
    };
  },
};
</script>
```

---

## 错误处理

所有错误响应遵循统一格式：

### 404 Not Found
```json
{
  "detail": "任务 task_name 不存在"
}
```

### 500 Internal Server Error
```json
{
  "detail": "内部服务器错误"
}
```

---

## 注意事项

1. **权限控制**: 所有接口都需要登录认证
2. **任务执行**: 手动触发任务时，如果任务正在运行，会返回错误
3. **状态刷新**: 建议前端每 30-60 秒自动刷新一次任务状态
4. **并发控制**: 同一任务不会同时执行多次
5. **错误处理**: 任务执行失败会记录错误信息，不影响下次执行

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-02-11 | 初始版本，支持基础任务管理功能 |

---

## 联系方式

如有问题请联系后端开发团队。
