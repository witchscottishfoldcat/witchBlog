#!/usr/bin/env python3
"""
测试更完善的元数据提取功能
"""
import json
import re

import requests
from bs4 import BeautifulSoup


def extract_metadata_from_url(url):
    """从URL提取元数据信息"""
    print(f"测试URL: {url}")
    print("=" * 80)

    # 设置请求头，模拟真实浏览器
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",  # noqa: E501
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",  # noqa: E501
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
    }

    try:
        # 发送请求
        print("发送HTTP请求...")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"响应状态码: {response.status_code}")

        # 解析HTML
        soup = BeautifulSoup(response.text, "html.parser")
        print("HTML解析完成")

        metadata = {}

        # 1. Open Graph标签
        og_tags = {}
        for meta in soup.find_all("meta"):
            if meta.get("property") and meta.get("property").startswith("og:"):
                og_tags[meta.get("property")] = meta.get("content")

        metadata.update(
            {
                "title": og_tags.get("og:title"),
                "image_url": og_tags.get("og:image"),
                "description": og_tags.get("og:description"),
                "url": og_tags.get("og:url"),
                "type": og_tags.get("og:type"),
            }
        )

        # 2. 内联script数据
        scripts = soup.find_all("script")
        window_data = None

        for script in scripts:
            if script.string and ("__INITIAL_STATE__" in script.string):
                try:
                    pattern = r"window\.__INITIAL_STATE__\s*=\s*({.*?});"
                    match = re.search(pattern, script.string, re.DOTALL)
                    if match:
                        window_data = json.loads(match.group(1))
                        break
                except Exception:
                    continue

        if window_data and "mediaInfo" in window_data:
            media_info = window_data["mediaInfo"]

            # 提取更多详细信息
            if not metadata.get("title"):
                metadata["title"] = media_info.get("title")

            if not metadata.get("description"):
                metadata["description"] = media_info.get("brief")

            if not metadata.get("image_url"):
                metadata["image_url"] = media_info.get("cover")

            # 提取额外信息
            metadata["horizontal_cover"] = media_info.get("horizontal_cover")
            metadata["total_episodes"] = media_info.get("ep_size")
            metadata["areas"] = media_info.get("areas")
            metadata["publisher"] = media_info.get("publisher")
            metadata["style"] = media_info.get("style")
            metadata["alias"] = media_info.get("alias")

            # 从evaluate字段提取评分和描述
            evaluate = media_info.get("evaluate", "")
            if evaluate and not metadata.get("description"):
                metadata["description"] = evaluate

            # 提取季度信息
            if "season_id" in media_info:
                metadata["season_id"] = media_info["season_id"]

            if "season_title" in media_info:
                metadata["season_title"] = media_info["season_title"]

            # 提取类型标签
            if "styles" in media_info:
                metadata["styles"] = media_info["styles"]

            # 提取评分信息
            if "rating" in media_info:
                metadata["rating"] = media_info["rating"]

        # 处理缺失信息
        if not metadata.get("title"):
            title_tag = soup.find("title")
            if title_tag:
                metadata["title"] = title_tag.get_text().strip()

        if not metadata.get("description"):
            description_meta = soup.find("meta", attrs={"name": "description"})
            if description_meta:
                metadata["description"] = description_meta.get("content", "").strip()

        # 整理和清洗数据
        if metadata.get("areas"):
            if isinstance(metadata["areas"], list) and len(metadata["areas"]) > 0:
                metadata["areas"] = [
                    area.get("name") if isinstance(area, dict) else area
                    for area in metadata["areas"]
                ]
                metadata["areas"] = ", ".join(metadata["areas"])

        # 清理描述文本
        description = metadata.get("description")
        if description:
            metadata["description"] = description.strip()

        # 确保URL是完整的
        url = metadata.get("url")
        if url and not url.startswith("http"):
            metadata["url"] = "https:" + url

        return metadata

    except Exception as e:
        print(f"提取过程中出错: {e}")
        return {}


def test_multiple_urls():
    """测试多个URL的元数据提取"""
    test_urls = [
        "https://www.bilibili.com/bangumi/media/md21087073",  # 葬送的芙莉莲
        "https://www.bilibili.com/bangumi/media/md25581526",  # 赛马娘 芦毛灰姑娘
    ]

    for url in test_urls:
        print(f"\n{'='*80}")
        print(f"测试URL: {url}")
        print("=" * 80)

        metadata = extract_metadata_from_url(url)

        print("\n提取的元数据:")
        print("=" * 40)
        for key, value in metadata.items():
            if value is not None:
                print(f"{key}: {value}")

        print("\n" + "-" * 80 + "\n")


if __name__ == "__main__":
    test_multiple_urls()
