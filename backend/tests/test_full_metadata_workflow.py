import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "live 服务脚本：需要本地服务与 test_metadata.md，设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )

"""
测试完整的元数据工作流程
"""

import os
import sys

import requests

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from app.core.config import settings  # noqa: E402

# API基础URL
BASE_URL = (
    f"http://{settings.HOST}:{settings.PORT}"
    if settings.HOST != "0.0.0.0"
    else f"http://localhost:{settings.PORT}"
)
API_URL = f"{BASE_URL}{settings.API_V1_STR}/md-files/"


def test_api_upload_with_metadata():
    """测试通过API上传带有元数据的MD文件"""

    print("===== 测试API上传带有元数据的MD文件 =====")

    # 读取测试文件
    with open(
        os.path.join(project_root, "test_metadata.md"), "r", encoding="utf-8"
    ) as f:
        content = f.read()

    # 准备上传数据
    file_data = {
        "title": "API测试文档",
        "description": "通过API上传的测试文档",
        "content": content,
        "filename": "api_test_metadata.md",
        "tags": "api,测试,元数据",
        "is_public": True,
    }

    try:
        # 发送请求
        response = requests.post(f"{API_URL}", json=file_data)

        if response.status_code == 200:
            file_info = response.json()
            print("文件上传成功！")
            print(f"文件ID: {file_info.get('id')}")
            print(f"文件标题: {file_info.get('title')}")
            print(f"解析的元数据: {file_info.get('parsed_metadata')}")
            print(f"发布日期: {file_info.get('published')}")
            print(f"分类: {file_info.get('category')}")
            print(f"是否置顶: {file_info.get('pinned')}")
            print(f"作者: {file_info.get('author')}")
            return file_info.get("id")
        else:
            print(f"上传失败，状态码: {response.status_code}")
            print(f"错误信息: {response.text}")
            return None

    except requests.exceptions.ConnectionError:
        print("无法连接到API服务器。请确保服务器正在运行。")
        return None
    except Exception as e:
        print(f"发生错误: {str(e)}")
        return None


def test_api_get_file_with_metadata(file_id):
    """测试通过API获取带有元数据的MD文件信息"""

    if not file_id:
        print("文件ID为空，跳过获取测试")
        return

    print("\n===== 测试API获取带有元数据的MD文件信息 =====")

    try:
        # 获取文件信息
        response = requests.get(f"{API_URL}{file_id}")

        if response.status_code == 200:
            file_info = response.json()
            print("获取文件信息成功！")
            print(f"文件ID: {file_info.get('id')}")
            print(f"文件标题: {file_info.get('title')}")
            print(f"解析的元数据: {file_info.get('parsed_metadata')}")
            print(f"发布日期: {file_info.get('published')}")
            print(f"分类: {file_info.get('category')}")
            print(f"是否置顶: {file_info.get('pinned')}")
            print(f"作者: {file_info.get('author')}")
            print(f"标签: {file_info.get('tags')}")
        else:
            print(f"获取失败，状态码: {response.status_code}")
            print(f"错误信息: {response.text}")

    except requests.exceptions.ConnectionError:
        print("无法连接到API服务器。请确保服务器正在运行。")
    except Exception as e:
        print(f"发生错误: {str(e)}")


def test_api_list_files_with_metadata():
    """测试通过API获取MD文件列表，检查元数据是否包含在响应中"""

    print("\n===== 测试API获取MD文件列表 =====")

    try:
        # 获取文件列表
        response = requests.get(API_URL)

        if response.status_code == 200:
            file_list = response.json()
            print("获取文件列表成功！")
            print(f"文件总数: {file_list.get('total')}")

            files = file_list.get("files", [])
            if files:
                # 打印第一个文件的元数据信息
                first_file = files[0]
                print("\n第一个文件信息:")
                print(f"文件ID: {first_file.get('id')}")
                print(f"文件标题: {first_file.get('title')}")
                print(f"是否有解析的元数据: {'是' if first_file.get('parsed_metadata') else '否'}")
                print(f"发布日期: {first_file.get('published')}")
                print(f"分类: {first_file.get('category')}")
                print(f"是否置顶: {first_file.get('pinned')}")
                print(f"作者: {first_file.get('author')}")

                # 检查是否有元数据字段
                metadata_fields = [
                    "published",
                    "category",
                    "pinned",
                    "encrypted",
                    "author",
                    "parsed_metadata",
                ]
                has_metadata_fields = any(
                    field in first_file for field in metadata_fields
                )
                print(f"\n响应是否包含元数据字段: {'是' if has_metadata_fields else '否'}")
        else:
            print(f"获取失败，状态码: {response.status_code}")
            print(f"错误信息: {response.text}")

    except requests.exceptions.ConnectionError:
        print("无法连接到API服务器。请确保服务器正在运行。")
    except Exception as e:
        print(f"发生错误: {str(e)}")


def main():
    """主函数"""
    print("开始测试完整的元数据工作流程...\n")
    print(f"API地址: {API_URL}")

    # 测试API上传带有元数据的MD文件
    file_id = test_api_upload_with_metadata()

    # 测试API获取带有元数据的MD文件信息
    test_api_get_file_with_metadata(file_id)

    # 测试API获取MD文件列表
    test_api_list_files_with_metadata()

    print("\n测试完成！")


if __name__ == "__main__":
    main()
