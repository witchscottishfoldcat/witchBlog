#!/usr/bin/env python3
"""
测试B站番剧页面的图片提取功能
"""
import json
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


def test_extract_from_url():
    url = "https://www.bilibili.com/video/BV1xx411c7mD"
    print(f"开始测试URL: {url}")
    print("=" * 60)

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
        print("=" * 60)

        # 1. 检查Open Graph标签
        print("1. Open Graph标签:")
        og_title = soup.find("meta", property="og:title")
        og_image = soup.find("meta", property="og:image")
        og_description = soup.find("meta", property="og:description")
        og_url = soup.find("meta", property="og:url")

        print(f'   - og_title: {og_title["content"] if og_title else "未找到"}')
        print(f'   - og_image: {og_image["content"] if og_image else "未找到"}')
        print(
            f'   - og_description: {og_description["content"] if og_description else "未找到"}'  # noqa: E501
        )
        print(f'   - og_url: {og_url["content"] if og_url else "未找到"}')
        print("")

        # 2. 检查Twitter Card标签
        print("2. Twitter Card标签:")
        twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        twitter_description = soup.find("meta", attrs={"name": "twitter:description"})

        print(
            f'   - twitter_title: {twitter_title["content"] if twitter_title else "未找到"}'  # noqa: E501
        )
        print(
            f'   - twitter_image: {twitter_image["content"] if twitter_image else "未找到"}'  # noqa: E501
        )
        print(
            f'   - twitter_description: {twitter_description["content"] if twitter_description else "未找到"}'  # noqa: E501
        )
        print("")

        # 3. 查找JSON-LD数据
        print("3. JSON-LD结构化数据:")
        json_scripts = soup.find_all("script", type="application/ld+json")
        if json_scripts:
            for i, script in enumerate(json_scripts):
                try:
                    data = json.loads(script.string)
                    print(f"   JSON-LD {i+1}:")
                    if "image" in data:
                        print(f'      - image: {data["image"]}')
                    if "name" in data:
                        print(f'      - name: {data["name"]}')
                    if "description" in data:
                        print(f'      - description: {data["description"]}')
                except Exception as e:
                    print(f"   JSON-LD {i+1} 解析失败: {e}")
        else:
            print("   未找到JSON-LD数据")
        print("")

        # 4. 查找内联script数据
        print("4. 内联script数据:")
        scripts = soup.find_all("script")
        window_data = None
        for script in scripts:
            if script.string and (
                "__INITIAL_STATE__" in script.string
                or "window.__INITIAL_STATE__" in script.string
            ):
                # 简单提取
                start = script.string.find("{")
                end = script.string.rfind("}") + 1
                if start > -1 and end > 0:
                    try:
                        data_str = script.string[start:end]
                        window_data = json.loads(data_str)
                        print("   找到window.__INITIAL_STATE__数据")
                        break
                    except Exception:
                        print("   找到window.__INITIAL_STATE__但解析失败")
                        break

        if window_data:
            # 尝试从数据中提取图片
            if "mediaInfo" in window_data:
                media_info = window_data["mediaInfo"]
                print("   mediaInfo:")
                if "cover" in media_info:
                    print(f'      - cover: {media_info["cover"]}')
                if "horizontal_cover" in media_info:
                    print(f'      - horizontal_cover: {media_info["horizontal_cover"]}')
        else:
            print("   未找到内联script数据")
        print("")

        # 5. 查找CSS选择器
        print("5. CSS选择器查找:")
        # 尝试多种常见选择器
        selectors = [
            "img.cover",
            ".cover img",
            ".poster img",
            ".bangumi-image img",
            ".media-cover img",
            'img[src*="cover"]',
            'img[alt*="封面"]',
            'img[alt*="海报"]',
            ".cover-wrapper img",
        ]

        found_images = set()
        for selector in selectors:
            imgs = soup.select(selector)
            for img in imgs:
                src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
                if src:
                    if not src.startswith("http"):
                        src = urljoin(url, src)
                    found_images.add(src)

        if found_images:
            print(f"   找到 {len(found_images)} 个潜在封面图片:")
            for img in list(found_images)[:5]:  # 只显示前5个
                print(f"      - {img}")
        else:
            print("   未找到匹配的图片")

        # 6. 提取最终图片URL
        final_image_url = None

        # 优先级顺序：og:image -> twitter:image -> 其他
        if og_image and og_image.get("content"):
            final_image_url = og_image["content"]
            print(f"\n最终选择 (og:image): {final_image_url}")
        elif twitter_image and twitter_image.get("content"):
            final_image_url = twitter_image["content"]
            print(f"\n最终选择 (twitter:image): {final_image_url}")
        elif found_images:
            final_image_url = list(found_images)[0]
            print(f"\n最终选择 (CSS选择器): {final_image_url}")
        else:
            print("\n未能提取到图片URL")

        # 7. 尝试下载图片
        if final_image_url:
            print("\n尝试下载图片...")
            try:
                img_response = requests.get(
                    final_image_url, headers=headers, timeout=10
                )
                print(f"图片响应状态码: {img_response.status_code}")
                print(
                    f'图片Content-Type: {img_response.headers.get("Content-Type", "未知")}'
                )
                print(f"图片大小: {len(img_response.content)} 字节")

                # 保存图片到本地用于测试
                if img_response.status_code == 200:
                    img_path = "test_extracted_image.jpg"
                    with open(img_path, "wb") as f:
                        f.write(img_response.content)
                    print(f"图片已保存到: {img_path}")
            except Exception as e:
                print(f"下载图片失败: {e}")

        return final_image_url

    except Exception as e:
        print(f"测试过程中出错: {e}")
        return None


if __name__ == "__main__":
    # 测试指定URL
    test_url = "https://www.bilibili.com/bangumi/media/md25581526"
    result = test_extract_from_url()
    print(f"\n最终结果: {result}")
