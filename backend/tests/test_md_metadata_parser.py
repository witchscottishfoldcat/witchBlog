"""
测试MD文件元数据解析器
"""

import os
import sys

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from app.services.md_metadata_parser import MDMetadataParser  # noqa: E402


def test_frontmatter_parser():
    """测试front-matter解析器"""

    # 测试用例1: 带有基本元数据的MD文件
    test_content_1 = """---
title: 我的测试文档
description: 这是一个测试文档，用于验证front-matter解析
tags: [test, frontmatter, metadata]
published: 2023-12-18
category: 技术
pinned: true
author: 测试作者
---

# 我的测试文档

这是一个测试文档的正文内容，用于验证front-matter解析功能。

## 功能特点

1. 支持YAML格式的元数据
2. 自动映射到数据库字段
3. 处理各种数据类型
"""

    print("===== 测试用例1: 基本元数据 =====")
    result = MDMetadataParser.parse_frontmatter(test_content_1)
    print("解析结果:")
    print(f"元数据: {result['metadata']}")
    print(f"正文: {result['content'][:50]}...")
    print()

    # 测试用例2: 没有front-matter的MD文件
    test_content_2 = """# 普通Markdown文档

这是一个普通的Markdown文档，没有front-matter元数据。

## 内容

只有正文内容，没有元数据。"""

    print("===== 测试用例2: 没有front-matter =====")
    result = MDMetadataParser.parse_frontmatter(test_content_2)
    print("解析结果:")
    print(f"元数据: {result['metadata']}")
    print(f"正文: {result['content'][:50]}...")
    print()

    # 测试用例3: 格式不正确的front-matter
    test_content_3 = """---
title: 格式错误的文档
description: 这个front-matter格式不正确
tags: [error, test]
published: 2023-12-18
---
缺少结束标记

# 文档正文

这是一个front-matter格式不正确的文档。"""

    print("===== 测试用例3: 格式不正确的front-matter =====")
    result = MDMetadataParser.parse_frontmatter(test_content_3)
    print("解析结果:")
    print(f"元数据: {result['metadata']}")
    print(f"正文: {result['content'][:50]}...")
    print()

    # 测试用例4: 不同数据类型的元数据
    test_content_4 = """---
title: 数据类型测试
tags: "测试, 数据类型"
pinned: "yes"
encrypted: 0
published: 2023-12-18T10:30:00
author: null
category: ""
---

# 数据类型测试文档

这个文档测试各种数据类型的处理。"""

    print("===== 测试用例4: 不同数据类型的元数据 =====")
    result = MDMetadataParser.parse_frontmatter(test_content_4)
    print("解析结果:")
    print(f"元数据: {result['metadata']}")
    print(f"正文: {result['content'][:50]}...")
    print()


def test_title_extraction():
    """测试标题提取功能"""

    # 测试用例1: front-matter中有title
    test_content_1 = """---
title: Front-Matter标题
---

# H1标题

正文内容..."""

    print("===== 标题提取测试1: Front-Matter中有标题 =====")
    title = MDMetadataParser.extract_title_from_content(test_content_1)
    print(f"提取的标题: {title}")
    print()

    # 测试用例2: front-matter中没有title，正文中有H1
    test_content_2 = """---
description: 没有标题
---

# 正文中的H1标题

正文内容..."""

    print("===== 标题提取测试2: Front-Matter中没有标题 =====")
    title = MDMetadataParser.extract_title_from_content(test_content_2)
    print(f"提取的标题: {title}")
    print()

    # 测试用例3: 既没有front-matter标题，也没有H1
    test_content_3 = """正文开始...

## 二级标题

没有一级标题的文档。"""

    print("===== 标题提取测试3: 既没有Front-Matter标题也没有H1 =====")
    title = MDMetadataParser.extract_title_from_content(test_content_3)
    print(f"提取的标题: {title}")
    print()


def test_has_frontmatter():
    """测试front-matter检测功能"""

    # 有front-matter的内容
    content_1 = """---
title: 测试
---

正文..."""

    # 没有front-matter的内容
    content_2 = """# 文档标题

正文..."""

    print("===== Front-Matter检测测试 =====")
    print(f"内容1有front-matter: {MDMetadataParser.has_frontmatter(content_1)}")
    print(f"内容2有front-matter: {MDMetadataParser.has_frontmatter(content_2)}")
    print()


if __name__ == "__main__":
    print("开始测试MD文件元数据解析器...\n")

    test_frontmatter_parser()
    test_title_extraction()
    test_has_frontmatter()

    print("测试完成！")
