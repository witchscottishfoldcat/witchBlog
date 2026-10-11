# -*- coding: utf-8 -*-

import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "需要运行中的本地服务：启动服务并设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )
import io
import re
import sys
import xml.etree.ElementTree as ET

import requests

# 设置标准输出编码为UTF-8
if __name__ == "__main__":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


def test_rss_feed():
    """测试RSS feed输出"""
    try:
        # 获取RSS feed
        url = "http://127.0.0.1:8000/api/v1/rss/feed"
        response = requests.get(url)

        if response.status_code != 200:
            print(f"获取RSS feed失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return

        xml_content = response.text
        print("RSS feed获取成功")
        print(f"XML内容长度: {len(xml_content)}")

        # 解析XML
        root = ET.fromstring(xml_content)

        # 查找所有item
        items = root.findall(".//item")
        print(f"找到 {len(items)} 篇文章")

        for i, item in enumerate(items[:2], 1):  # 只显示前2篇
            sys.stdout.write(f"\n文章 {i}:\n")

            # 获取标题
            t = item.find("title")
            title = (t.text or "") if t is not None else ""
            sys.stdout.write(f"标题: {title}\n")

            # 获取描述
            d = item.find("description")
            description = (d.text or "") if d is not None else None
            if description:
                sys.stdout.write(f"描述长度: {len(description)}\n")
                sys.stdout.write(f"描述预览: {description[:100]}...\n")

            # 获取content:encoded
            content_element = item.find(
                "{http://purl.org/rss/1.0/modules/content/}encoded"
            )
            if content_element is not None and content_element.text:
                content = content_element.text
                sys.stdout.write(f"正文内容长度: {len(content)}\n")

                # 检查是否有HTML标签
                if re.search(r"<[^>]+>", content):
                    sys.stdout.write("包含HTML标签 - 格式正常\n")
                else:
                    sys.stdout.write("不包含HTML标签 - 可能有问题\n")

                # 显示前200个字符
                sys.stdout.write(f"正文内容预览: {content[:200]}...\n")

                # 检查是否有转义字符
                if "&" in content and ";" in content:
                    sys.stdout.write("包含转义字符 - 需要检查\n")
                else:
                    sys.stdout.write("不包含转义字符 - 格式正常\n")

            sys.stdout.write("-" * 50 + "\n")

    except Exception as e:
        print(f"测试过程中发生错误: {e}")


if __name__ == "__main__":
    test_rss_feed()
