# 版本管理方案

本项目提供两种简单的Git版本管理方案，让每个Git提交对应一个版本。

## 方案一：基础版本控制 (version.py)

### 安装
1. 确保 `version.py` 文件在项目根目录
2. 设置post-commit hook：`chmod +x .git/hooks/post-commit`

### 使用方法
```bash
# 手动升级主版本号 (1.0.0 -> 2.0.0)
python version.py bump major

# 手动升级次版本号 (1.0.0 -> 1.1.0) 
python version.py bump minor

# 手动升级补丁版本号 (1.0.0 -> 1.0.1)
python version.py bump patch

# 为当前版本创建Git标签
python version.py tag

# 查看当前版本
python version.py current
```

### 自动化工作流
每次提交后，post-commit hook会自动：
1. 检查是否有版本变化
2. 如有变化，自动创建Git标签
3. 版本格式: `1.0.{提交次数}`

## 方案二：智能语义版本控制 (auto_version.py)

### 使用方法
```bash
# 根据提交信息自动决定版本升级
python auto_version.py auto
```

### 提交信息规范
- `feat: 添加新功能` → 自动升级 minor 版本
- `fix: 修复bug` → 自动升级 patch 版本  
- `feat!: 破坏性更改` → 自动升级 major 版本

### 工作流示例
1. 正常开发，遵循提交信息规范
2. 需要发布时，运行 `python auto_version.py auto`
3. 工具会分析提交历史，自动决定版本号并创建Git标签

## 快速设置

选择一种方案后，创建一个方便的Git别名：

```bash
# 方案一
git config --global alias.version "!python version.py bump patch && git push"

# 方案二  
git config --global alias.release "!python auto_version.py auto"
```

## 其他选项

1. **使用Git标签直接管理**：
   ```bash
   # 手动创建标签
   git tag -a v1.0.1 -m "版本1.0.1"
   git push origin v1.0.1
   ```

2. **使用CI/CD自动化版本**：可在GitHub Actions等工具中设置自动版本发布

选择适合您团队工作流的方案即可！