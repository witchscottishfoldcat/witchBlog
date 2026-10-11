# Scripts Directory

This directory contains utility scripts organized by purpose:

## Directory Structure

- **`maintenance/`** - 数据库维护、权限修复、数据迁移等运维脚本
  - 权限修复脚本（fix_*_permissions.py）
  - 数据更新脚本（update_*.py）
  - 初始化脚本（init_*.py）
  - 用户创建脚本（create_*.py）
  - 调度器脚本（scheduler.py）

- **`debug/`** - 调试和测试脚本
  - API 测试脚本（test_*.py）
  - 连接测试脚本（check_*.py, try_*.py）
  - 验证脚本（verify_*.py）

- **`setup/`** - 环境设置和数据处理脚本
  - 批量处理脚本（batch_process_*.py）
  - 简单测试脚本（simple_test_*.py）

- **`legacy/`** - 已废弃或不再使用的旧脚本（保留供参考）

## Usage Guidelines

1. **维护脚本**（maintenance/）应在生产环境谨慎使用，建议先备份数据
2. **调试脚本**（debug/）仅用于开发和测试环境，不应部署到生产环境
3. **设置脚本**（setup/）通常在项目初始化或数据迁移时运行一次
4. 所有脚本应通过 `python -m scripts.maintenance.script_name` 方式运行

## Security Notes

- 所有脚本应使用环境变量获取敏感信息，不要硬编码密码
- 生产环境运行维护脚本前，请确保已配置正确的数据库连接和权限
- 调试脚本可能包含敏感信息输出，请勿在生产环境使用
