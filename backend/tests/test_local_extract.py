#!/usr/bin/env python3
"""
从本地HTML文件测试提取封面图片功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging  # noqa: E402

from bs4 import BeautifulSoup  # noqa: E402

from app.services.minio_service import MinIOService  # noqa: E402

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_local_html_extract():
    """从本地HTML文件测试提取封面图片"""
    print("从本地HTML文件测试提取封面图片...\n")

    minio_service = MinIOService()

    # 读取本地HTML文件
    html_file = "/tests/test_anime_page.html"

    try:
        with open(html_file, "r", encoding="utf-8") as f:
            html_content = f.read()

        # 解析HTML
        soup = BeautifulSoup(html_content, "html.parser")

        print("HTML内容解析成功")

        # 查找Open Graph meta标签
        og_image = soup.find("meta", attrs={"property": "og:image"})
        if og_image and og_image.get("content"):
            print(f"找到Open Graph图片: {og_image['content']}")

            # 尝试上传这个图片
            try:
                object_name, public_url = minio_service.upload_anime_cover(
                    og_image["content"]
                )
                print("✅ 成功上传Open Graph图片到MinIO")
                print(f"   对象名称: {object_name}")
                print(f"   公开URL: {public_url}")

                # 清理测试图片
                if minio_service.delete_anime_cover(object_name):
                    print("   ✅ 测试图片删除成功")
                else:
                    print("   ⚠️ 测试图片删除失败")

                return True
            except Exception as e:
                print(f"❌ 上传图片失败: {e}")

        # 查找Twitter Card meta标签
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            print(f"找到Twitter Card图片: {twitter_image['content']}")

            # 尝试上传这个图片
            try:
                object_name, public_url = minio_service.upload_anime_cover(
                    twitter_image["content"]
                )
                print("✅ 成功上传Twitter Card图片到MinIO")
                print(f"   对象名称: {object_name}")
                print(f"   公开URL: {public_url}")

                # 清理测试图片
                if minio_service.delete_anime_cover(object_name):
                    print("   ✅ 测试图片删除成功")
                else:
                    print("   ⚠️ 测试图片删除失败")

                return True
            except Exception as e:
                print(f"❌ 上传图片失败: {e}")

        # 查找封面图片元素
        cover_img = soup.find("img", class_="poster-img")
        if cover_img and cover_img.get("src"):
            print(f"找到封面图片元素: {cover_img['src']}")

            # 这个URL可能不是完整的，需要处理
            img_src = cover_img["src"]
            if img_src.startswith("http"):
                full_url = img_src
            else:
                full_url = f"https://example.com/{img_src.lstrip('/')}"

            # 尝试上传这个图片
            try:
                object_name, public_url = minio_service.upload_anime_cover(full_url)
                print("✅ 成功上传封面图片到MinIO")
                print(f"   对象名称: {object_name}")
                print(f"   公开URL: {public_url}")

                # 清理测试图片
                if minio_service.delete_anime_cover(object_name):
                    print("   ✅ 测试图片删除成功")
                else:
                    print("   ⚠️ 测试图片删除失败")

                return True
            except Exception as e:
                print(f"❌ 上传图片失败: {e}")

        print("没有找到可用的封面图片")
        return False

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False


if __name__ == "__main__":
    print("开始从本地HTML文件测试提取封面图片功能...\n")
    success = test_local_html_extract()

    if success:
        print("\n✅ 测试成功！")
    else:
        print("\n❌ 测试失败！")

    print("\nMinIO配置信息:")
    from app.core.config import settings

    print(f"  端点: {settings.MINIO_ENDPOINT}")
    print(f"  存储桶: {settings.MINIO_BUCKET_NAME}")
    print(f"  安全连接: {settings.MINIO_SECURE}")
