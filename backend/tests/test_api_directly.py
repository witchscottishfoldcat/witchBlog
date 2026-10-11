#!/usr/bin/env python3
"""
直接测试CRUD操作，无需启动完整服务器
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


from app.core.database import SessionLocal  # noqa: E402
from app.crud.crud_project_info import crud_project_info  # noqa: E402
from app.services.project_parser import project_parser_service  # noqa: E402


def test_crud_operations():
    """测试CRUD操作"""
    print("\n=== 测试CRUD操作 ===")

    # 创建数据库会话
    db = SessionLocal()

    try:
        # 1. 测试解析GitHub项目
        github_url = "https://github.com/example-user/example-project"
        print(f"正在解析GitHub项目: {github_url}")

        project_data = project_parser_service.extract_project_info(github_url)
        project_data["tag"] = "已完成"

        print(f"解析成功: {project_data['name']}")
        print(f"语言数量: {len(project_data['languages'])}")

        # 2. 测试创建或更新项目记录
        print("\n正在创建或更新项目记录...")
        existing_project = crud_project_info.get_by_url(db=db, url=github_url)

        if existing_project:
            # 更新现有项目
            project = crud_project_info.update(
                db=db, db_obj=existing_project, obj_in=project_data
            )
            print(f"项目记录更新成功，ID: {project.id}")
        else:
            # 创建新项目
            project = crud_project_info.create(db=db, obj_in=project_data)
            print(f"项目记录创建成功，ID: {project.id}")

        # 3. 测试读取项目记录
        print("\n正在读取项目记录...")
        read_project = crud_project_info.get(db=db, id=project.id)
        assert read_project is not None
        print(f"读取成功: {read_project.name}")

        # 4. 测试更新项目记录
        print("\n正在更新项目记录...")
        update_data = {"tag": "进行中"}
        updated_project = crud_project_info.update(
            db=db, db_obj=read_project, obj_in=update_data
        )
        print(f"更新成功，新标签: {updated_project.tag}")

        # 5. 测试获取项目列表
        print("\n正在获取项目列表...")
        projects = crud_project_info.get_multi(db=db, skip=0, limit=10)
        print(f"获取到 {len(projects)} 个项目")

        return project.id

    except Exception as e:
        print(f"CRUD操作失败: {e}")
        return None
    finally:
        db.close()


def test_statistics():
    """测试统计功能"""
    print("\n=== 测试统计功能 ===")

    # 创建数据库会话
    db = SessionLocal()

    try:
        # 测试平台统计
        print("\n--- 平台统计 ---")
        platform_stats = crud_project_info.get_platform_stats(db=db)
        print(f"平台统计: {platform_stats}")

        # 测试标签统计
        print("\n--- 标签统计 ---")
        tag_stats = crud_project_info.get_tag_stats(db=db)
        print(f"标签统计: {tag_stats}")

        # 测试语言统计
        print("\n--- 语言统计 ---")
        language_stats = crud_project_info.get_language_stats(db=db, limit=5)
        print(f"语言统计: {language_stats}")

    except Exception as e:
        print(f"统计功能测试失败: {e}")
    finally:
        db.close()


def main():
    """主测试流程"""
    print("开始直接测试CRUD操作...")

    # 测试CRUD操作
    project_id = test_crud_operations()

    if project_id:
        print(f"测试成功，项目ID: {project_id}")
    else:
        print("CRUD操作测试失败")

    # 测试统计功能
    test_statistics()

    print("\n测试完成!")


if __name__ == "__main__":
    main()
