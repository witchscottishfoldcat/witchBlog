# 缓存清除机制说明

## 问题原因

当直接在后台修改数据库时，前端或后端的缓存不会自动清除，因为：
- Next.js 使用 ISR（增量静态再生）缓存，默认缓存 60 秒
- 直接修改数据库不会触发缓存失效机制
- 需要手动调用清除缓存的 API

## 解决方案

### 1. 创建了清除缓存的工具函数

**文件**: `src/utils/cache.ts`

这个工具函数会尝试多种方法清除缓存：

#### 方法一：调用后端 revalidate API（推荐）
```typescript
POST /api/v1/site-config/revalidate
```

#### 方法二：尝试其他可能的端点
- `/api/v1/site-config/clear-cache`
- `/api/v1/cache/revalidate`
- `/api/revalidate/site-config`

#### 方法三：如果后端没有 revalidate API
- 记录日志，建议后端添加 revalidate 端点
- 不影响主要功能，失败时静默处理

### 2. 使用方法

#### 自动调用（已集成）

在以下操作后会自动调用缓存清除：

1. **更新站点配置** (`handleSave`)
   - 更新配置成功后自动清除缓存

2. **上传网站图标** (`handleIconUpload`)
   - 上传成功后自动清除缓存

3. **上传个人资料图片** (`handleProfileUpload`)
   - 上传成功后自动清除缓存

#### 手动调用

如果需要手动清除缓存，可以导入并使用：

```typescript
import { revalidateSiteConfig } from '../utils/cache';

// 清除缓存
await revalidateSiteConfig();
```

### 3. 后端 API 实现（如果使用 Next.js）

如果后端使用 Next.js，需要创建 revalidate API 路由：

**文件**: `src/app/api/site-config/revalidate/route.ts` (Next.js)

```typescript
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 清除站点配置相关的缓存
    revalidatePath('/api/v1/site-config/active');
    revalidatePath('/api/v1/site-config/public');
    
    return NextResponse.json({ 
      revalidated: true, 
      message: '缓存清除成功' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: '清除缓存失败', details: error.message },
      { status: 500 }
    );
  }
}
```

### 4. 特性

- ✅ **非阻塞**：缓存清除在后台进行，不影响 UI 响应
- ✅ **容错处理**：如果清除缓存失败，不会影响主要功能
- ✅ **多端点支持**：自动尝试多个可能的端点
- ✅ **日志记录**：记录清除缓存的成功/失败信息

### 5. 注意事项

1. **后端 API 路径**：根据实际后端实现调整 `revalidateSiteConfig` 函数中的端点路径
2. **认证**：确保调用 revalidate API 时携带正确的认证 token
3. **错误处理**：缓存清除失败不会影响主要功能，但会在控制台记录错误

### 6. 测试

测试缓存清除是否工作：

1. 更新站点配置
2. 检查浏览器控制台，应该看到 "缓存清除成功" 的日志
3. 如果后端没有 revalidate API，会看到 "未找到缓存清除 API" 的提示

## 未来改进

- [ ] 添加缓存清除的 UI 反馈（可选）
- [ ] 支持批量清除多个资源的缓存
- [ ] 添加缓存清除的配置选项

