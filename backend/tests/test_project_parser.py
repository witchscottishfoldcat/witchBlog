#!/usr/bin/env python3
"""
测试项目解析服务
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.project_parser import project_parser_service  # noqa: E402


def test_github_parsing():
    """测试GitHub项目解析"""
    print("\n=== 测试GitHub项目解析 ===")

    url = "https://github.com/example-user/example-project"

    try:
        print(f"正在解析GitHub项目: {url}")
        project_info = project_parser_service.extract_github_info(url)

        print(f"项目名称: {project_info['name']}")
        print(f"项目描述: {project_info['description']}")
        print(f"所有者: {project_info['owner']}")
        print(f"仓库名: {project_info['repository_name']}")
        print(f"平台: {project_info['platform']}")
        print(f"星标数: {project_info['stars_count']}")
        print(f"复刻数: {project_info['forks_count']}")
        print(f"主要语言: {project_info['language_stats']['dominant_language']}")

        print("\n语言分布:")
        for lang in project_info["languages"]:
            print(f"  - {lang['language']}: {lang['percentage']}%")

        return True

    except Exception as e:
        print(f"解析失败: {e}")
        return False


def test_gitee_parsing():
    """测试Gitee项目解析"""
    print("\n=== 测试Gitee项目解析 ===")

    url = "https://gitee.com/example-user/example-project"

    try:
        print(f"正在解析Gitee项目: {url}")
        project_info = project_parser_service.extract_gitee_info(url)

        print(f"项目名称: {project_info['name']}")
        print(f"项目描述: {project_info['description']}")
        print(f"所有者: {project_info['owner']}")
        print(f"仓库名: {project_info['repository_name']}")
        print(f"平台: {project_info['platform']}")
        print(f"星标数: {project_info['stars_count']}")
        print(f"复刻数: {project_info['forks_count']}")
        print(f"主要语言: {project_info['language_stats']['dominant_language']}")

        print("\n语言分布:")
        for lang in project_info["languages"]:
            print(f"  - {lang['language']}: {lang['percentage']}%")

        return True

    except Exception as e:
        print(f"解析失败: {e}")
        return False


def test_url_parsing():
    """测试URL解析"""
    print("\n=== 测试URL解析 ===")

    urls = [
        "https://github.com/example-user/example-project",
        "https://gitee.com/example-user/example-project",
    ]

    for url in urls:
        try:
            platform, project_path = project_parser_service.parse_project_url(url)
            print(f"URL: {url}")
            print(f"平台: {platform}, 项目路径: {project_path}")
        except Exception as e:
            print(f"解析失败: {e}")


def main():
    """主测试流程"""
    print("开始测试项目解析服务...")

    # 测试URL解析
    test_url_parsing()

    # 测试GitHub项目解析
    github_success = test_github_parsing()

    # 测试Gitee项目解析
    gitee_success = test_gitee_parsing()

    print("\n=== 测试结果 ===")
    print(f"GitHub解析: {'成功' if github_success else '失败'}")
    print(f"Gitee解析: {'成功' if gitee_success else '失败'}")

    if github_success and gitee_success:
        print("所有测试通过!")
    else:
        print("部分测试失败!")

    return github_success and gitee_success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
