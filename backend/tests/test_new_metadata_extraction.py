#!/usr/bin/env python3
"""
测试新的元数据提取功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.minio_service import MinIOService  # noqa: E402


def test_metadata_extraction():
    """测试元数据提取功能"""
    print("测试新的元数据提取功能")
    print("=" * 60)

    # 创建MinIO服务实例
    minio_service = MinIOService()

    # 测试URL
    test_url = "https://www.bilibili.com/bangumi/media/md21087073"

    try:
        print(f"测试URL: {test_url}")
        print("\n开始提取元数据...")

        # 调用extract_metadata_from_bilibili_url方法
        metadata = minio_service.extract_metadata_from_bilibili_url(test_url)

        print("\n提取成功!")
        print("元数据内容:")
        for key, value in metadata.items():
            if value is not None:
                print(f"- {key}: {value}")

        return metadata

    except Exception as e:
        print(f"\n提取失败: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_metadata_extraction()
