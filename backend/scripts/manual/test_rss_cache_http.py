"""通过HTTP请求测试RSS缓存自动清除功能的脚本"""
import time

import requests
from loguru import logger

BASE_URL = "http://localhost:8000"


def get_rss_feed(use_cache: bool = True):
    """获取RSS feed"""
    url = f"{BASE_URL}/rss/feed"
    if not use_cache:
        url += "?refresh=true"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            logger.info(
                f"获取RSS feed成功 (use_cache={use_cache}), 长度: {len(response.text)}"
            )
            return response.text
        else:
            logger.error(f"获取RSS feed失败: HTTP {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"获取RSS feed异常: {e}")
        return None


def create_public_article():
    """创建一篇公开文章"""
    url = f"{BASE_URL}/api/v1/md-files"
    data = {
        "title": f"RSS缓存测试文章 - {int(time.time())}",
        "description": "这是一篇用于测试RSS缓存自动清除功能的文章",
        "content": "# 测试文章\n\n这是正文内容，用于测试RSS缓存。\n\n## 测试章节\n\n这是一个测试。",
        "filename": "test_rss_cache.md",
        "tags": "测试,RSS",
        "is_public": True,
    }

    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            article = response.json()
            logger.info(f"创建文章成功: ID={article['id']}, 标题={article['title']}")
            return article
        else:
            logger.error(f"创建文章失败: HTTP {response.status_code}, {response.text}")
            return None
    except Exception as e:
        logger.error(f"创建文章异常: {e}")
        return None


def update_article(article_id: int):
    """更新文章"""
    url = f"{BASE_URL}/api/v1/md-files/{article_id}"
    data = {"title": f"RSS缓存测试文章（已更新） - {int(time.time())}", "description": "这是更新后的描述"}

    try:
        response = requests.put(url, json=data)
        if response.status_code == 200:
            article = response.json()
            logger.info(f"更新文章成功: 标题={article['title']}")
            return True
        else:
            logger.error(f"更新文章失败: HTTP {response.status_code}, {response.text}")
            return False
    except Exception as e:
        logger.error(f"更新文章异常: {e}")
        return False


def delete_article(article_id: int):
    """删除文章"""
    url = f"{BASE_URL}/api/v1/md-files/{article_id}"

    try:
        response = requests.delete(url)
        if response.status_code == 200:
            logger.info("删除文章成功")
            return True
        else:
            logger.error(f"删除文章失败: HTTP {response.status_code}, {response.text}")
            return False
    except Exception as e:
        logger.error(f"删除文章异常: {e}")
        return False


def toggle_public_status(article_id: int):
    """切换文章公开状态"""
    url = f"{BASE_URL}/api/v1/md-files/{article_id}/toggle-public"

    try:
        response = requests.post(url)
        if response.status_code == 200:
            result = response.json()
            logger.info(f"切换公开状态成功: {result['message']}")
            return True
        else:
            logger.error(f"切换公开状态失败: HTTP {response.status_code}, {response.text}")
            return False
    except Exception as e:
        logger.error(f"切换公开状态异常: {e}")
        return False


def measure_cache_effectiveness(test_name: str, operation_func):
    """测量缓存有效性"""
    print(f"\n{'=' * 60}")
    print(f"测试: {test_name}")
    print("=" * 60)

    # 第一次请求（建立缓存）
    logger.info("第一次请求RSS feed（建立缓存）...")
    start_time = time.time()
    rss1 = get_rss_feed(use_cache=True)
    time1 = time.time() - start_time

    if not rss1:
        print(f"❌ 测试失败: 无法获取RSS feed")
        return False

    print(f"第一次请求耗时: {time1:.4f} 秒")

    # 执行操作（应该清除缓存）
    logger.info("执行操作...")
    result = operation_func()

    if not result:
        print(f"❌ 操作失败")
        return False

    # 短暂等待
    time.sleep(0.2)

    # 第二次请求（应该是重新生成，因为没有缓存了）
    logger.info("第二次请求RSS feed（缓存应该已被清除）...")
    start_time = time.time()
    rss2 = get_rss_feed(use_cache=True)
    time2 = time.time() - start_time

    if not rss2:
        print(f"❌ 测试失败: 无法获取RSS feed")
        return False

    print(f"第二次请求耗时: {time2:.4f} 秒")

    # 比较两次请求的RSS内容
    # 如果缓存被清除了，第二次应该生成新的RSS，内容可能会不同
    if rss1 != rss2:
        print(f"✅ 测试通过: RSS内容已更新（缓存被清除）")
        print(f"   RSS1长度: {len(rss1)}, RSS2长度: {len(rss2)}")
        return True
    else:
        print(f"⚠️  测试结果不确定: RSS内容相同（可能缓存未被清除，或者内容未变化）")
        print(f"   RSS1长度: {len(rss1)}, RSS2长度: {len(rss2)}")

        # 通过响应时间来判断
        # 如果第二次请求明显比第一次慢，说明是重新生成的
        if time2 > time1 * 1.5:
            print(f"✅ 响应时间表明: 第二次请求明显较慢，缓存被清除")
            return True
        else:
            print(f"❌ 响应时间表明: 缓存可能未被清除")
            return False


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("RSS缓存自动清除功能测试（HTTP方式）")
    print("=" * 60)

    # 检查服务器是否运行
    try:
        response = requests.get(f"{BASE_URL}/api/v1/site-config/public", timeout=5)
        if response.status_code != 200:
            print("❌ 服务器响应异常，请检查服务器是否正常运行")
            return
        print("✅ 服务器正常运行")
    except Exception as e:
        print(f"❌ 无法连接到服务器: {e}")
        print("请确保服务器正在运行 (http://localhost:8000)")
        return

    results = []
    article_id = None

    # 测试1: 创建公开文章
    def create_test():
        nonlocal article_id
        article = create_public_article()
        if article:
            article_id = article["id"]
            return article
        return None

    success = measure_cache_effectiveness("创建公开文章时清除RSS缓存", create_test)
    results.append(("创建公开文章", success))

    if article_id:
        # 测试2: 更新公开文章
        def update_test():
            return update_article(article_id)

        success = measure_cache_effectiveness("更新公开文章时清除RSS缓存", update_test)
        results.append(("更新公开文章", success))

        # 测试3: 删除文章
        def delete_test():
            return delete_article(article_id)

        success = measure_cache_effectiveness("删除文章时清除RSS缓存", delete_test)
        results.append(("删除文章", success))
    else:
        print("\n跳过测试2和测试3，因为测试1未通过")
        results.append(("更新公开文章", False))
        results.append(("删除文章", False))

    # 测试4: 切换公开状态
    def toggle_test():
        # 先创建一个私有文章
        url = f"{BASE_URL}/api/v1/md-files"
        data = {
            "title": f"RSS缓存测试文章（私有） - {int(time.time())}",
            "description": "这是一篇用于测试公开状态切换的文章",
            "content": "# 测试公开状态切换\n\n这是正文内容。",
            "filename": "test_toggle_public.md",
            "tags": "测试,公开状态",
            "is_public": False,
        }

        response = requests.post(url, json=data)
        if response.status_code != 200:
            logger.error(f"创建私有文章失败: {response.text}")
            return None

        article = response.json()
        logger.info(f"私有文章创建成功: ID={article['id']}")

        # 切换为公开
        success = toggle_public_status(article["id"])

        # 清理：删除测试文章
        if success:
            delete_article(article["id"])

        return success

    success = measure_cache_effectiveness("切换文章公开状态时清除RSS缓存", toggle_test)
    results.append(("切换公开状态", success))

    # 打印测试结果汇总
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)

    passed = 0
    failed = 0
    for test_name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{test_name}: {status}")
        if success:
            passed += 1
        else:
            failed += 1

    print(f"\n总计: {passed} 个通过, {failed} 个失败")
    print("=" * 60)


if __name__ == "__main__":
    main()
