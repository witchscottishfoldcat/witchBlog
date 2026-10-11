# 测试文件清理计划

## 可以安全删除的临时文件

### 1. 根目录临时测试文件
这些文件看起来是临时测试文件，可以直接删除：

- `test_minio_direct.py` - MinIO直接连接测试
- `test_minio_upload.py` - MinIO上传测试

### 2. 根目录检查脚本
这些脚本主要用于临时检查数据库表结构：

- `check_album_table.py` - 检查相册表结构
- `check_album_tables.py` - 相册表检查脚本
- `check_minio_policy_detailed.py` - MinIO策略详细检查
- `check_policy_statements.py` - 策略语句检查

### 3. 修复脚本
这些是一次性修复脚本，问题解决后可以删除：

- `cleanup_minio_policy.py` - MinIO策略清理
- `fix_permanent_diary_images_v2.py` - 修复永久日记图片
- `monitor_diary_images_permissions.py` - 日记图片权限监控

### 4. 数据添加脚本
这些是示例数据添加脚本，数据添加完成后可删除：

- `add_cover_photo_id_field.py` - 添加封面照片ID字段
- `add_sample_anime_watchlist.py` - 添加示例动漫收藏
- `add_sample_links.py` - 添加示例链接
- `add_sample_resource_links.py` - 添加示例资源链接
- `add_sample_skills.py` - 添加示例技能
- `add_sample_timelines.py` - 添加示例时间线

## 建议保留的文件

### 1. 版本管理相关
- `version.py` - 基础版本控制
- `auto_version.py` - 自动版本控制
- `safe_version.py` - 安全版本控制
- `setup_version_alias.py` - Git别名设置

### 2. 官方测试目录
- `tests/` 目录下的所有文件 - 这些是标准测试

### 3. scripts目录中的有用脚本
- `init_db.py` - 数据库初始化
- `init_mysql.py` - MySQL初始化
- `init_site_config.py` - 站点配置初始化

## 清理步骤

1. 首先备份项目（可选）
2. 删除根目录的临时测试文件
3. 删除已完成的检查脚本
4. 删除已使用的修复脚本
5. 删除示例数据添加脚本

总计可以删除约15-20个临时文件和脚本。