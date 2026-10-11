#!/usr/bin/env python3
"""
测试MinIO连接
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.minio_service import minio_service


def test_minio_connection():
    """测试MinIO连接"""
    try:
        print(f"正在测试MinIO连接...")
        print(f"端点: {settings.MINIO_ENDPOINT}")
        print(f"访问密钥: {settings.MINIO_ACCESS_KEY}")

        # 检查服务状态
        if minio_service._mock_mode:
            print("✗ MinIO处于模拟模式，无法连接到真实服务器")
            return False

        print("✓ MinIO服务初始化成功，处于正常模式")

        # 测试上传文件
        print("\n测试上传文件...")
        test_content = "# 测试文件\n\n这是一个测试MinIO连接的Markdown文件。"
        result = minio_service.upload_content(
            content=test_content, filename="test_connection.md"
        )

        print(f"✓ 文件上传成功")
        print(f"  对象名: {result['object_name']}")
        print(f"  文件大小: {result['size']} 字节")
        print(f"  URL: {result['url']}")

        # 测试获取文件内容
        print("\n测试获取文件内容...")
        content = minio_service.get_file_content(result["object_name"])
        print(f"✓ 文件内容获取成功")
        print(f"  内容: {content[:50]}...")

        # 测试删除文件
        print("\n测试删除文件...")
        if minio_service.delete_file(result["object_name"]):
            print("✓ 文件删除成功")

        return True
    except Exception as e:
        print(f"✗ MinIO连接测试失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_minio_connection()
    sys.exit(0 if success else 1)
