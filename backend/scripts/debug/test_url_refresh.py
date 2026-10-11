#!/usr/bin/env python3
"""
测试URL刷新功能的脚本
"""

import os
import sys
import time

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.md_file import MDFile
from app.services.md_file import MDFileService


def test_url_refresh():
    """测试URL刷新功能"""
    db = SessionLocal()
    try:
        # 获取第一个文件
        file = db.query(MDFile).first()
        if not file:
            print("数据库中没有文件，无法测试")
            return False

        print(f"测试文件: {file.title} (ID: {file.id})")
        print(f"原始URL: {file.file_url}")

        # 记录原始URL
        original_url = file.file_url

        # 刷新URL
        refreshed_file = MDFileService.refresh_file_url(db, file.id)
        print(f"刷新后URL: {refreshed_file.file_url}")

        # 检查URL是否已更改
        if original_url != refreshed_file.file_url:
            print("✓ URL刷新成功！URL已更改")
            return True
        else:
            print("⚠ URL未更改，可能是URL还未过期或者刷新逻辑有问题")
            return False

    except Exception as e:
        print(f"测试过程中出错: {str(e)}")
        return False
    finally:
        db.close()


def test_get_file_with_refresh():
    """测试获取文件时自动刷新URL"""
    db = SessionLocal()
    try:
        # 获取第一个文件
        file = db.query(MDFile).first()
        if not file:
            print("数据库中没有文件，无法测试")
            return False

        print(f"测试文件: {file.title} (ID: {file.id})")
        print(f"原始URL: {file.file_url}")

        # 使用get_file方法，它会自动刷新URL
        refreshed_file = MDFileService.get_file(db, file.id, refresh_url=True)
        print(f"通过get_file获取的URL: {refreshed_file.file_url}")

        # 检查URL是否不同
        if file.file_url != refreshed_file.file_url:
            print("✓ get_file方法成功刷新了URL")
            return True
        else:
            print("⚠ get_file方法未更改URL")
            return False

    except Exception as e:
        print(f"测试过程中出错: {str(e)}")
        return False
    finally:
        db.close()


def test_get_files_with_refresh():
    """测试获取文件列表时自动刷新URL"""
    db = SessionLocal()
    try:
        print("测试获取文件列表时自动刷新URL...")

        # 获取文件列表
        files, total = MDFileService.get_files(db, limit=5, refresh_urls=True)

        if not files:
            print("数据库中没有文件，无法测试")
            return False

        print(f"获取到 {len(files)} 个文件")

        # 检查每个文件是否有URL
        all_have_urls = True
        for i, file in enumerate(files):
            print(f"文件 {i+1}: {file.title}")
            if not file.file_url:
                print(f"  ⚠ 文件 {file.title} 没有URL")
                all_have_urls = False
            else:
                print(f"  ✓ URL: {file.file_url[:50]}...")

        if all_have_urls:
            print("✓ 所有文件都有有效的URL")
            return True
        else:
            print("⚠ 部分文件缺少URL")
            return False

    except Exception as e:
        print(f"测试过程中出错: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """主函数"""
    print("开始测试URL刷新功能...")
    print("=" * 50)

    # 测试1: 直接刷新URL
    print("\n测试1: 直接刷新URL")
    test1_result = test_url_refresh()

    # 测试2: 获取文件时自动刷新URL
    print("\n测试2: 获取文件时自动刷新URL")
    test2_result = test_get_file_with_refresh()

    # 测试3: 获取文件列表时自动刷新URL
    print("\n测试3: 获取文件列表时自动刷新URL")
    test3_result = test_get_files_with_refresh()

    # 总结
    print("\n" + "=" * 50)
    print("测试结果总结:")
    print(f"直接刷新URL: {'✓ 成功' if test1_result else '✗ 失败'}")
    print(f"获取文件时刷新URL: {'✓ 成功' if test2_result else '✗ 失败'}")
    print(f"获取文件列表时刷新URL: {'✓ 成功' if test3_result else '✗ 失败'}")

    if test1_result and test2_result and test3_result:
        print("\n🎉 所有测试通过！URL刷新功能正常工作")
    else:
        print("\n⚠ 部分测试失败，请检查相关代码")


if __name__ == "__main__":
    main()
