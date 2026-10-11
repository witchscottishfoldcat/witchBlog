#!/usr/bin/env python3
"""
测试特定URL的元数据提取
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.minio_service import MinIOService  # noqa: E402


def test_specific_metadata():
    """测试特定URL的元数据提取"""
    # 创建MinIO服务实例
    minio_service = MinIOService()

    # 测试URL
    test_url = "https://www.bilibili.com/bangumi/media/md27682304"

    print(f"测试URL: {test_url}")
    print("=" * 60)

    try:
        # 提取元数据
        metadata = minio_service.extract_metadata_from_bilibili_url(test_url)

        print("提取的元数据:")
        for key, value in metadata.items():
            if value is not None:
                print(f"- {key}: {value}")

        print(f'\n总集数: {metadata.get("total_episodes", "未提取到")}')

    except Exception as e:
        print(f"提取失败: {e}")


if __name__ == "__main__":
    test_specific_metadata()
