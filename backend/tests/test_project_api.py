#!/usr/bin/env python3
"""
测试项目展示API功能
"""


import requests

# API基础URL
BASE_URL = "http://localhost:8001/api/v1"


def test_create_project():
    """测试创建项目"""
    print("\n=== 测试创建项目 ===")

    # 测试GitHub项目
    github_project = {
        "project_url": "https://github.com/example-user/example-project",
        "tag": "已完成",
    }

    try:
        response = requests.post(
            f"{BASE_URL}/projects/",
            json=github_project,
            headers={"Content-Type": "application/json"},
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            project_data = response.json()
            print(f"项目创建成功: {project_data['name']}")
            return project_data["id"]
        else:
            print(f"创建失败: {response.text}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None


def test_get_projects():
    """测试获取项目列表"""
    print("\n=== 测试获取项目列表 ===")

    try:
        response = requests.get(f"{BASE_URL}/projects/")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            projects = response.json()
            print(f"获取到 {len(projects)} 个项目")
            for project in projects:
                print(
                    f" - {project['name']} ({project['platform']}) - {project['tag']}"
                )
            return projects
        else:
            print(f"获取失败: {response.text}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None


def test_get_project():
    project_id = 1
    """测试获取单个项目"""
    print(f"\n=== 测试获取单个项目 (ID: {project_id}) ===")

    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            project = response.json()
            print(f"项目名称: {project['name']}")
            print(f"项目描述: {project['description']}")
            print(f"项目平台: {project['platform']}")
            print(f"项目标签: {project['tag']}")
            print(f"星标数: {project['stars_count']}")
            print(f"主要语言: {project['language_stats']['dominant_language']}")
            print("语言分布:")
            for lang in project["languages"]:
                print(f"  - {lang['language']}: {lang['percentage']}%")
            return project
        else:
            print(f"获取失败: {response.text}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None


def test_update_project():
    project_id = 1
    """测试更新项目"""
    print(f"\n=== 测试更新项目 (ID: {project_id}) ===")

    try:
        response = requests.put(
            f"{BASE_URL}/projects/{project_id}",
            json={"tag": "进行中"},
            headers={"Content-Type": "application/json"},
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            project = response.json()
            print(f"更新成功，新标签: {project['tag']}")
            return project
        else:
            print(f"更新失败: {response.text}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None


def test_refresh_project():
    project_id = 1
    """测试刷新项目信息"""
    print(f"\n=== 测试刷新项目信息 (ID: {project_id}) ===")

    try:
        response = requests.post(f"{BASE_URL}/projects/refresh/{project_id}")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            project = response.json()
            print(f"刷新成功，项目: {project['name']}")
            print(f"更新时间: {project['updated_at']}")
            return project
        else:
            print(f"刷新失败: {response.text}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None


def test_get_stats():
    """测试获取统计数据"""
    print("\n=== 测试获取统计数据 ===")

    # 测试平台统计
    print("\n--- 平台统计 ---")
    try:
        response = requests.get(f"{BASE_URL}/projects/stats/platform")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"平台统计: {stats}")
    except Exception as e:
        print(f"请求失败: {e}")

    # 测试标签统计
    print("\n--- 标签统计 ---")
    try:
        response = requests.get(f"{BASE_URL}/projects/stats/tag")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"标签统计: {stats}")
    except Exception as e:
        print(f"请求失败: {e}")

    # 测试语言统计
    print("\n--- 语言统计 ---")
    try:
        response = requests.get(f"{BASE_URL}/projects/stats/language")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"语言统计: {stats}")
    except Exception as e:
        print(f"请求失败: {e}")


def main():
    """主测试流程"""
    print("开始测试项目展示API功能...")

    # 1. 测试创建项目
    project_id = test_create_project()

    if project_id:
        # 2. 测试获取项目列表
        test_get_projects()

        # 3. 测试获取单个项目
        test_get_project()

        # 4. 测试更新项目
        test_update_project()

        # 5. 测试刷新项目
        test_refresh_project()

    # 6. 测试获取统计数据
    test_get_stats()

    print("\n测试完成!")


if __name__ == "__main__":
    main()
