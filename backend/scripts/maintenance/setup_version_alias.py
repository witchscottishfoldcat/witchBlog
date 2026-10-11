#!/usr/bin/env python3
"""
设置版本管理Git别名
运行此脚本将设置方便的Git别名，用于版本控制
"""

import subprocess
import sys


def run_command(command):
    """运行命令并打印结果"""
    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        print(f"✅ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command} 失败: {e}")
        return False


def setup_aliases():
    """设置版本管理相关的Git别名"""
    aliases = {
        "ver": '"!python safe_version.py current"',
        "ver-patch": '"!python safe_version.py bump patch"',
        "ver-minor": '"!python safe_version.py bump minor"',
        "ver-major": '"!python safe_version.py bump major"',
        "ver-auto": '"!python safe_version.py auto"',
        "ver-release": '"!python safe_version.py commit"',
    }

    print("设置Git版本管理别名...")
    for alias_name, command in aliases.items():
        full_command = f"git config --global alias.{alias_name} {command}"
        if not run_command(full_command):
            print("设置别名失败，请手动运行以下命令:")
            for name, cmd in aliases.items():
                print(f"  git config --global alias.{name} {cmd}")
            return False

    print("\n✅ 所有别名设置成功！")
    print("\n现在您可以使用以下命令管理版本:")
    print("  git ver          # 查看当前版本")
    print("  git ver-patch    # 升级补丁版本")
    print("  git ver-minor    # 升级次版本")
    print("  git ver-major    # 升级主版本")
    print("  git ver-auto     # 自动版本管理")
    print("  git ver-release  # 提交当前版本并创建标签")

    return True


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Git版本管理别名设置工具")
        print("使用方法: python setup_version_alias.py")
        print("\n这将设置以下Git别名:")
        print(
            "  git ver, git ver-patch, git ver-minor, git ver-major, git ver-auto, git ver-release"
        )
        return

    setup_aliases()


if __name__ == "__main__":
    main()
