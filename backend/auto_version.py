#!/usr/bin/env python3
"""
智能版本管理工具
根据提交信息自动选择版本升级策略
- feat: 新功能 -> minor 版本升级
- fix: 修复 -> patch 版本升级
- breaking!: 破坏性更改 -> major 版本升级
- release!: 发布版本 -> 创建发布标签
"""

import re
import subprocess
import sys
from pathlib import Path


def get_last_tag():
    """获取最新的Git标签"""
    try:
        result = subprocess.run(
            ["git", "describe", "--tags", "--abbrev=0"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().lstrip('v')
    except subprocess.CalledProcessError:
        # 没有标签，返回初始版本
        return "0.0.0"


def get_commit_messages_since_tag():
    """获取自上一个标签以来的所有提交信息"""
    try:
        result = subprocess.run(
            ["git", "log", "$(git describe --tags --abbrev=0 2>/dev/null || echo '')..HEAD", "--pretty=format:%s"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except subprocess.CalledProcessError:
        return []


def determine_version_type(commit_messages):
    """根据提交信息确定版本类型"""
    has_breaking = any("breaking!" in msg.lower() or "!: breaking" in msg.lower() for msg in commit_messages)
    has_feature = any("feat:" in msg for msg in commit_messages)
    has_fix = any("fix:" in msg for msg in commit_messages)
    
    if has_breaking:
        return "major"
    elif has_feature:
        return "minor"
    elif has_fix:
        return "patch"
    else:
        return None  # 没有需要升级的提交


def bump_version(current_version, bump_type):
    """升级版本号"""
    major, minor, patch = map(int, current_version.split('.'))
    
    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    elif bump_type == "patch":
        patch += 1
    
    return f"{major}.{minor}.{patch}"


def update_pyproject_toml(new_version):
    """更新pyproject.toml中的版本号"""
    pyproject_path = Path("pyproject.toml")
    content = pyproject_path.read_text(encoding="utf-8")
    updated_content = re.sub(
        r'version = "[^"]+"', f'version = "{new_version}"', content
    )
    pyproject_path.write_text(updated_content, encoding="utf-8")


def create_and_push_tag(new_version):
    """创建并推送Git标签"""
    try:
        # 提交版本文件更改
        subprocess.run(["git", "add", "pyproject.toml"], check=True)
        subprocess.run(["git", "commit", "-m", f"Release version {new_version}"], check=True)
        
        # 创建标签
        subprocess.run(
            ["git", "tag", "-a", f"v{new_version}", "-m", f"Release version {new_version}"],
            check=True
        )
        
        # 推送提交和标签
        subprocess.run(["git", "push"], check=True)
        subprocess.run(["git", "push", "origin", f"v{new_version}"], check=True)
        
        print(f"✅ 版本 {new_version} 发布成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 版本发布失败: {e}")
        return False


def auto_release():
    """自动发布版本"""
    current_version = get_last_tag()
    commit_messages = get_commit_messages_since_tag()
    
    if not commit_messages:
        print("没有新的提交需要发布")
        return
    
    print(f"当前版本: v{current_version}")
    print(f"发现 {len(commit_messages)} 个新提交")
    
    bump_type = determine_version_type(commit_messages)
    
    if bump_type:
        new_version = bump_version(current_version, bump_type)
        print(f"建议升级为: v{new_version} ({bump_type})")
        
        # 更新版本号
        update_pyproject_toml(new_version)
        
        # 创建并推送标签
        create_and_push_tag(new_version)
    else:
        print("没有检测到需要升级的提交类型 (feat:, fix:, 或 breaking!)")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "auto":
        auto_release()
    else:
        print("智能版本管理工具")
        print("使用方法: python auto_version.py auto")
        print("\n提交信息规范:")
        print("- feat: 新功能 (升级 minor 版本)")
        print("- fix: 错误修复 (升级 patch 版本)")
        print("- feat!: 破坏性更改 (升级 major 版本)")


if __name__ == "__main__":
    main()