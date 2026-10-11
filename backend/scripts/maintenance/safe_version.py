#!/usr/bin/env python3
"""
安全版本管理工具
避免无限循环问题的版本控制方案
使用方法：
- python safe_version.py bump major   # 主版本号更新 (1.0.0 -> 2.0.0)
- python safe_version.py bump minor   # 次版本号更新 (1.0.0 -> 1.1.0)
- python safe_version.py bump patch   # 补丁版本更新 (1.0.0 -> 1.0.1)
- python safe_version.py auto         # 根据Git提交数自动更新
"""

import re
import subprocess
import sys
from pathlib import Path


def get_current_version():
    """从pyproject.toml获取当前版本"""
    pyproject_path = Path("../pyproject.toml")
    content = pyproject_path.read_text(encoding="utf-8")
    match = re.search(r'version = "([^"]+)"', content)
    return match.group(1) if match else "0.0.0"


def update_version_only(new_version):
    """只更新版本文件，不提交"""
    pyproject_path = Path("../pyproject.toml")
    content = pyproject_path.read_text(encoding="utf-8")
    updated_content = re.sub(
        r'version = "[^"]+"', f'version = "{new_version}"', content
    )
    pyproject_path.write_text(updated_content, encoding="utf-8")
    print(f"版本文件已更新到: {new_version}")


def commit_version(new_version):
    """提交版本文件并创建标签"""
    try:
        # 检查是否有其他未提交的更改
        result = subprocess.run(
            ["git", "status", "--porcelain", "pyproject.toml"],
            capture_output=True,
            text=True,
            check=True,
        )

        if not result.stdout.strip():
            print("没有版本文件更改需要提交")
            return False

        # 提交版本文件
        subprocess.run(["git", "add", "pyproject.toml"], check=True)
        subprocess.run(
            ["git", "commit", "-m", f"Bump version to {new_version}"], check=True
        )

        # 创建标签
        subprocess.run(
            [
                "git",
                "tag",
                "-a",
                f"v{new_version}",
                "-m",
                f"Release version {new_version}",
            ],
            check=True,
        )

        # 推送提交和标签
        subprocess.run(["git", "push"], check=True)
        subprocess.run(["git", "push", "origin", f"v{new_version}"], check=True)

        print(f"✅ 版本 {new_version} 发布成功，标签已推送")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 版本发布失败: {e}")
        return False


def bump_version(bump_type):
    """升级版本号"""
    current = get_current_version()
    major, minor, patch = map(int, current.split("."))

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


def auto_version_by_commits():
    """根据Git提交数自动更新版本"""
    try:
        # 获取总提交数
        result = subprocess.run(
            ["git", "rev-list", "--count", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        commit_count = int(result.stdout.strip())

        # 基于提交数生成版本号（每100个提交为一个小版本）
        major = 1
        minor = commit_count // 100
        patch = commit_count % 100

        return f"{major}.{minor}.{patch}"
    except subprocess.CalledProcessError:
        return "1.0.0"


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
            update_version_only(new_version)
            commit_version(new_version)

    elif command == "auto":
        current_version = get_current_version()
        new_version = auto_version_by_commits()

        if current_version != new_version:
            print(f"检测到新的提交，更新版本: {current_version} -> {new_version}")
            update_version_only(new_version)
            commit_version(new_version)
        else:
            print(f"版本无需更新，当前版本: {current_version}")

    elif command == "current":
        print(f"当前版本: {get_current_version()}")

    elif command == "update-only":
        if len(sys.argv) < 3:
            print("请指定新版本号")
            return

        new_version = sys.argv[2]
        update_version_only(new_version)

    elif command == "commit":
        current_version = get_current_version()
        commit_version(current_version)

    else:
        print("未知命令")
        print(__doc__)


if __name__ == "__main__":
    main()
