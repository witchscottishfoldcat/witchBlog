#!/usr/bin/env python3
"""
测试从B站番剧页面提取更多元数据信息
"""
import json
import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


def extract_metadata_from_url(url):
    """从URL提取元数据信息"""
    print(f"测试URL: {url}")
    print("=" * 80)

    # 设置请求头，模拟真实浏览器
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
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
        print("=" * 80)

        metadata = {}

        # 1. Open Graph标签
        print("1. Open Graph标签:")
        og_tags = {}
        for meta in soup.find_all("meta"):
            if meta.get("property"):
                prop = meta.get("property")
                if prop.startswith("og:"):
                    og_tags[prop] = meta.get("content")

        for key, value in og_tags.items():
            print(f"   - {key}: {value}")
            if key == "og:title":
                metadata["title"] = value
            elif key == "og:image":
                metadata["image_url"] = value
            elif key == "og:description":
                metadata["description"] = value
            elif key == "og:url":
                metadata["url"] = value
            elif key == "og:type":
                metadata["type"] = value
        print("")

        # 2. Twitter Card标签
        print("2. Twitter Card标签:")
        twitter_tags = {}
        for meta in soup.find_all("meta"):
            if meta.get("name"):
                name = meta.get("name")
                if name.startswith("twitter:"):
                    twitter_tags[name] = meta.get("content")

        for key, value in twitter_tags.items():
            print(f"   - {key}: {value}")
            if key == "twitter:title" and "title" not in metadata:
                metadata["title"] = value
            elif key == "twitter:image" and "image_url" not in metadata:
                metadata["image_url"] = value
            elif key == "twitter:description" and "description" not in metadata:
                metadata["description"] = value
        print("")

        # 3. JSON-LD结构化数据
        print("3. JSON-LD结构化数据:")
        json_scripts = soup.find_all("script", type="application/ld+json")
        if json_scripts:
            for i, script in enumerate(json_scripts):
                try:
                    data = json.loads(script.string)
                    print(f"   JSON-LD {i+1}:")

                    if "name" in data and "title" not in metadata:
                        metadata["title"] = data["name"]
                        print(f'      - name: {data["name"]}')

                    if "description" in data and "description" not in metadata:
                        metadata["description"] = data["description"]
                        print(f'      - description: {data["description"]}')

                    if "image" in data and "image_url" not in metadata:
                        metadata["image_url"] = data["image"]
                        print(f'      - image: {data["image"]}')

                    # 检查是否有其他有用信息
                    if "genre" in data:
                        metadata["genres"] = data["genre"]
                        print(f'      - genre: {data["genre"]}')

                    if "datePublished" in data:
                        metadata["publish_date"] = data["datePublished"]
                        print(f'      - datePublished: {data["datePublished"]}')

                    if "aggregateRating" in data:
                        metadata["rating"] = data["aggregateRating"]
                        print(f'      - aggregateRating: {data["aggregateRating"]}')
                except Exception as e:
                    print(f"   JSON-LD {i+1} 解析失败: {e}")
        else:
            print("   未找到JSON-LD数据")
        print("")

        # 4. 内联script数据
        print("4. 内联script数据:")
        scripts = soup.find_all("script")
        window_data = None

        for script in scripts:
            if script.string and (
                "__INITIAL_STATE__" in script.string
                or "window.__INITIAL_STATE__" in script.string
            ):
                try:
                    # 尝试提取完整的JSON数据
                    pattern = r"window\.__INITIAL_STATE__\s*=\s*({.*?});"
                    match = re.search(pattern, script.string, re.DOTALL)
                    if match:
                        window_data = json.loads(match.group(1))
                        print("   找到window.__INITIAL_STATE__数据")
                        break
                except Exception as e:
                    print(f"   解析window.__INITIAL_STATE__失败: {e}")
                    continue

        if window_data:
            # 尝试从数据中提取更多信息
            print("   从__INITIAL_STATE__提取数据:")

            # 检查mediaInfo
            if "mediaInfo" in window_data:
                media_info = window_data["mediaInfo"]

                if "title" in media_info and "title" not in metadata:
                    metadata["title"] = media_info["title"]
                    print(f'      - title: {media_info["title"]}')

                if "evaluate" in media_info:
                    metadata["rating"] = media_info["evaluate"]
                    print(f'      - evaluate: {media_info["evaluate"]}')

                if "areas" in media_info:
                    metadata["areas"] = media_info["areas"]
                    print(f'      - areas: {media_info["areas"]}')

                if "style" in media_info:
                    metadata["style"] = media_info["style"]
                    print(f'      - style: {media_info["style"]}')

                if "publisher" in media_info:
                    metadata["publisher"] = media_info["publisher"]
                    print(f'      - publisher: {media_info["publisher"]}')

                if "alias" in media_info:
                    metadata["alias"] = media_info["alias"]
                    print(f'      - alias: {media_info["alias"]}')

                if "brief" in media_info and "description" not in metadata:
                    metadata["description"] = media_info["brief"]
                    print(f'      - brief: {media_info["brief"]}')

                if "ep_size" in media_info:
                    metadata["total_episodes"] = media_info["ep_size"]
                    print(f'      - ep_size: {media_info["ep_size"]}')

                if "cover" in media_info and "image_url" not in metadata:
                    metadata["image_url"] = media_info["cover"]
                    print(f'      - cover: {media_info["cover"]}')

                if "horizontal_cover" in media_info:
                    metadata["horizontal_cover"] = media_info["horizontal_cover"]
                    print(f'      - horizontal_cover: {media_info["horizontal_cover"]}')
        else:
            print("   未找到内联script数据")
        print("")

        # 5. 页面标题和meta描述
        print("5. 页面标题和meta描述:")
        title_tag = soup.find("title")
        if title_tag and "title" not in metadata:
            metadata["title"] = title_tag.get_text().strip()
            print(f'   页面标题: {metadata["title"]}')

        description_meta = soup.find("meta", attrs={"name": "description"})
        if description_meta and "description" not in metadata:
            metadata["description"] = description_meta.get("content", "").strip()
            print(f'   meta描述: {metadata["description"]}')
        print("")

        # 6. 最终提取的元数据
        print("6. 最终提取的元数据:")
        print("=" * 40)
        for key, value in metadata.items():
            print(f"{key}: {value}")

        return metadata

    except Exception as e:
        print(f"提取过程中出错: {e}")
        import traceback

        traceback.print_exc()
        return {}


if __name__ == "__main__":
    # 测试指定URL
    test_url = "https://www.bilibili.com/bangumi/media/md21087073"
    result = extract_metadata_from_url(test_url)
    print(f"\n最终结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
