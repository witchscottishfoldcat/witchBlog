#!/usr/bin/env python3
"""
版本管理工具
通过Git提交自动管理版本号
使用方法：
- python version.py bump major   # 主版本号更新 (1.0.0 -> 2.0.0)
- python version.py bump minor   # 次版本号更新 (1.0.0 -> 1.1.0)
- python version.py bump patch   # 补丁版本更新 (1.0.0 -> 1.0.1)
- python version.py tag          # 为当前提交创建Git标签
"""

import re
import subprocess
import sys
from pathlib import Path


def get_current_version():
    """从pyproject.toml获取当前版本"""
    pyproject_path = Path("pyproject.toml")
    content = pyproject_path.read_text(encoding="utf-8")
    match = re.search(r'version = "([^"]+)"', content)
    return match.group(1) if match else "0.0.0"


def update_version(new_version):
    """更新pyproject.toml中的版本号"""
    pyproject_path = Path("pyproject.toml")
    content = pyproject_path.read_text(encoding="utf-8")
    updated_content = re.sub(
        r'version = "[^"]+"', f'version = "{new_version}"', content
    )
    pyproject_path.write_text(updated_content, encoding="utf-8")
    print(f"版本已更新到: {new_version}")


def create_git_tag(version):
    """创建Git标签并推送"""
    try:
        # 检查是否有未提交的更改
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            check=True
        )
        if result.stdout.strip():
            print("警告: 存在未提交的更改，请先提交代码")
            return False

        # 创建标签
        subprocess.run(
            ["git", "tag", "-a", f"v{version}", "-m", f"Release version {version}"],
            check=True
        )
        
        # 推送标签
        subprocess.run(
            ["git", "push", "origin", f"v{version}"],
            check=True
        )
        
        print(f"Git标签 v{version} 创建并推送成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git操作失败: {e}")
        return False


def bump_version(bump_type):
    """升级版本号"""
    current = get_current_version()
    major, minor, patch = map(int, current.split('.'))
    
    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    elif bump_type == "patch":
        patch += 1
    else:
        print(f"未知的版本类型: {bump_type}")
        return None
    
    return f"{major}.{minor}.{patch}"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1]
    
    if command == "bump":
        if len(sys.argv) < 3:
            print("请指定版本类型: major, minor, 或 patch")
            return
        
        bump_type = sys.argv[2].lower()
        if bump_type not in ["major", "minor", "patch"]:
            print("版本类型必须是: major, minor, 或 patch")
            return
        
        new_version = bump_version(bump_type)
        if new_version:
            update_version(new_version)
            
            # 提交版本更改
            subprocess.run(["git", "add", "pyproject.toml"], check=True)
            subprocess.run(["git", "commit", "-m", f"Bump version to {new_version}"], check=True)
            subprocess.run(["git", "push"], check=True)
            
            # 创建Git标签
            create_git_tag(new_version)
    
    elif command == "tag":
        current_version = get_current_version()
        create_git_tag(current_version)
    
    elif command == "current":
        print(f"当前版本: {get_current_version()}")
    
    else:
        print("未知命令")
        print(__doc__)


if __name__ == "__main__":
    main()