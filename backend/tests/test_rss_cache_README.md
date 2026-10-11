# RSS缓存自动清除功能测试脚本说明

本目录包含用于测试RSS缓存自动清除功能的测试脚本。

## 测试脚本

### 1. `test_rss_cache_simple.py` - 简单直接测试（推荐）
**适用场景**: 快速验证RSS缓存自动清除功能是否正常工作

**特点**:
- 直接调用服务层方法，不依赖HTTP请求
- 测试完整，包含所有4种场景
- 输出清晰，易于理解
- 自动清理测试数据

**使用方法**:
```bash
python test_rss_cache_simple.py
```

**测试内容**:
- ✅ 创建公开文章时清除RSS缓存
- ✅ 更新公开文章时清除RSS缓存
- ✅ 将文章从私有切换为公开时清除RSS缓存
- ✅ 删除文章时清除RSS缓存

### 2. `test_rss_cache_invalidation.py` - 详细测试
**适用场景**: 需要更详细的测试信息和日志

**特点**:
- 打印详细的缓存信息
- 包含时间戳区分测试文章
- 输出完整的测试结果汇总

**使用方法**:
```bash
python test_rss_cache_invalidation.py
```

### 3. `test_rss_cache_http.py` - HTTP接口测试
**适用场景**: 需要通过HTTP接口测试完整的API流程

**特点**:
- 通过HTTP请求调用API
- 测试端到端的业务流程
- 比较请求响应时间判断缓存状态
- 更接近实际使用场景

**前置要求**:
- 需要安装 `requests` 库
- 需要服务器正在运行 (http://localhost:8000)

**使用方法**:
```bash
pip install requests
python test_rss_cache_http.py
```

## 测试原理

RSS缓存自动清除功能通过以下机制实现:

1. **创建公开文章**: 在 `MDFileService.create_file()` 中，如果创建公开文章，会调用 `rss_service.clear_cache()`

2. **更新公开文章**: 在 `MDMonitorService.invalidate_cache_on_update()` 中，如果更新的文章是公开的，会调用 `rss_service.clear_cache()`

3. **删除文章**: 在 `MDMonitorService.invalidate_cache_on_delete()` 中，删除任何文章都会调用 `rss_service.clear_cache()`

4. **切换公开状态**:
   - 在 `MDMonitorService.invalidate_cache_on_update()` 中，如果文章从私有变为公开，会调用 `rss_service.clear_cache()`
   - 在 `md_files.py` 的 `toggle_file_public_status()` 端点中，如果文件变为公开，会调用 `rss_service.clear_cache()`

## 预期测试结果

所有测试脚本都应该输出类似以下结果:

```
======================================================================
测试结果汇总
======================================================================
  创建公开文章: ✅ 通过
  更新公开文章: ✅ 通过
  切换公开状态（私有->公开）: ✅ 通过
  删除文章: ✅ 通过

总计: 4/4 个测试通过
======================================================================
```

## 故障排查

### 测试失败的可能原因

1. **缓存未被清除**
   - 检查 `app/services/md_monitor_service.py` 中的 `invalidate_cache_on_update()` 和 `invalidate_cache_on_delete()` 方法
   - 确认是否正确调用了 `rss_service.clear_cache()`

2. **私有文章切换为公开后缓存未被清除**
   - 检查 `app/services/md_monitor_service.py` 第157-158行，确认条件判断是否正确
   - 检查 `app/api/v1/md_files.py` 中的 `toggle_file_public_status()` 函数

3. **HTTP测试脚本失败**
   - 确认服务器是否正在运行: `http://localhost:8000`
   - 检查 `requests` 库是否已安装
   - 查看服务器日志，确认API端点是否正常工作

### 调试建议

1. **查看日志输出**: 测试脚本会输出详细的日志信息，可以帮助定位问题

2. **检查数据库连接**: 确保数据库配置正确且可访问

3. **手动验证**: 可以先手动测试RSS feed是否正常生成
   ```bash
   python test_rss.py
   ```

4. **检查缓存信息**: 在测试前后手动检查缓存信息
   ```python
   from app.services.rss import rss_service
   cache_info = rss_service.get_cache_info()
   print(cache_info)
   ```

## 清理测试数据

测试脚本会自动清理创建的测试文章。如果测试过程中出现异常，可以手动清理:

```python
from app.core.database import SessionLocal
from app.services.md_file import MDFileService

db = SessionLocal()
md_file_service = MDFileService()

# 查找并删除测试文章
files = md_file_service.get_files(db, limit=100, owner_id=1)[0]
for file in files:
    if "测试" in file.title or "test" in file.title.lower():
        md_file_service.delete_file(db, file.id, 1)
        print(f"已删除: {file.title}")

db.close()
```

## 相关文件

- `app/services/rss.py` - RSS服务和缓存实现
- `app/services/md_monitor_service.py` - 文件监控服务和缓存失效逻辑
- `app/services/md_file.py` - MD文件服务
- `app/api/v1/md_files.py` - MD文件API端点
