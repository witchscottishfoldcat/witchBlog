"""简单的RSS缓存自动清除功能测试脚本"""
from loguru import logger

from app.core.database import SessionLocal
from app.schemas.md_file import MDFileCreate, MDFileUpdate
from app.services.md_file import MDFileService
from app.services.rss import rss_service


def test_rss_cache_invalidation():
    """测试RSS缓存自动清除功能"""
    print("\n" + "=" * 70)
    print("RSS缓存自动清除功能测试")
    print("=" * 70)

    db = SessionLocal()

    try:
        md_file_service = MDFileService()

        # ==================== 测试1: 创建公开文章 ====================
        print("\n【测试1】创建公开文章时清除RSS缓存")
        print("-" * 70)

        # 生成RSS feed建立缓存
        logger.info("步骤1: 生成RSS feed建立缓存...")
        rss_service.generate_rss_feed(
            db=db, feed_url="http://localhost:8000/rss/feed", limit=10
        )
        cache_info1 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info1['cache_count']}")
        print(f"  缓存键: {cache_info1['cache_keys']}")

        # 创建公开文章
        logger.info("步骤2: 创建公开文章...")
        file_data = MDFileCreate(
            title=f"测试文章 - {__import__('time').time()}",
            description="测试RSS缓存自动清除",
            content="# 测试\n\n内容",
            filename="test_rss_cache.md",
            tags="测试",
            is_public=True,
        )
        article = md_file_service.create_file(db, file_data, owner_id=1)
        print(f"  文章创建成功: ID={article.id}")

        # 检查缓存是否被清除
        logger.info("步骤3: 检查缓存是否被清除...")
        cache_info2 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info2['cache_count']}")
        print(f"  缓存键: {cache_info2['cache_keys']}")

        test1_result = cache_info2["cache_count"] < cache_info1["cache_count"]
        print(f"\n  结果: {'✅ 通过' if test1_result else '❌ 失败'}")
        if not test1_result:
            print(
                f"    原因: 缓存未从 {cache_info1['cache_count']} 减少到 {cache_info2['cache_count']}"  # noqa: E501
            )

        # ==================== 测试2: 更新公开文章 ====================
        print("\n【测试2】更新公开文章时清除RSS缓存")
        print("-" * 70)

        # 重新生成RSS feed建立缓存
        logger.info("步骤1: 重新生成RSS feed建立缓存...")
        rss_service.generate_rss_feed(
            db=db, feed_url="http://localhost:8000/rss/feed", limit=10
        )
        cache_info3 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info3['cache_count']}")

        # 更新文章
        logger.info("步骤2: 更新文章...")
        update_data = MDFileUpdate(
            title=f"更新后的标题 - {__import__('time').time()}", description="更新后的描述"
        )
        md_file_service.update_file(db, article.id, update_data, user_id=1)
        print("  文章更新成功")

        # 检查缓存是否被清除
        logger.info("步骤3: 检查缓存是否被清除...")
        cache_info4 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info4['cache_count']}")

        test2_result = cache_info4["cache_count"] < cache_info3["cache_count"]
        print(f"\n  结果: {'✅ 通过' if test2_result else '❌ 失败'}")
        if not test2_result:
            print(
                f"    原因: 缓存未从 {cache_info3['cache_count']} 减少到 {cache_info4['cache_count']}"  # noqa: E501
            )

        # ==================== 测试3: 切换公开状态（私有->公开）====================
        print("\n【测试3】将文章从私有切换为公开时清除RSS缓存")
        print("-" * 70)

        # 创建一个私有文章
        logger.info("步骤1: 创建私有文章...")
        private_file_data = MDFileCreate(
            title="私有测试文章",
            description="这是一篇私有文章",
            content="# 私有内容",
            filename="private_test.md",
            tags="测试",
            is_public=False,
        )
        private_article = md_file_service.create_file(db, private_file_data, owner_id=1)
        print(f"  私有文章创建成功: ID={private_article.id}")

        # 重新生成RSS feed建立缓存
        logger.info("步骤2: 重新生成RSS feed建立缓存...")
        rss_service.generate_rss_feed(
            db=db, feed_url="http://localhost:8000/rss/feed", limit=10
        )
        cache_info5 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info5['cache_count']}")

        # 切换为公开
        logger.info("步骤3: 将私有文章切换为公开...")
        update_data2 = MDFileUpdate(is_public=True)
        md_file_service.update_file(db, private_article.id, update_data2, user_id=1)
        print("  文章已切换为公开")

        # 检查缓存是否被清除
        logger.info("步骤4: 检查缓存是否被清除...")
        cache_info6 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info6['cache_count']}")

        test3_result = cache_info6["cache_count"] < cache_info5["cache_count"]
        print(f"\n  结果: {'✅ 通过' if test3_result else '❌ 失败'}")
        if not test3_result:
            print(
                f"    原因: 缓存未从 {cache_info5['cache_count']} 减少到 {cache_info6['cache_count']}"  # noqa: E501
            )

        # 清理：删除私有文章
        md_file_service.delete_file(db, private_article.id, user_id=1)
        print("  私有文章已清理")

        # ==================== 测试4: 删除文章 ====================
        print("\n【测试4】删除文章时清除RSS缓存")
        print("-" * 70)

        # 重新生成RSS feed建立缓存
        logger.info("步骤1: 重新生成RSS feed建立缓存...")
        rss_service.generate_rss_feed(
            db=db, feed_url="http://localhost:8000/rss/feed", limit=10
        )
        cache_info7 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info7['cache_count']}")

        # 删除文章
        logger.info("步骤2: 删除文章...")
        md_file_service.delete_file(db, article.id, user_id=1)
        print(f"  文章已删除: ID={article.id}")

        # 检查缓存是否被清除
        logger.info("步骤3: 检查缓存是否被清除...")
        cache_info8 = rss_service.get_cache_info()
        print(f"  缓存数量: {cache_info8['cache_count']}")

        test4_result = cache_info8["cache_count"] < cache_info7["cache_count"]
        print(f"\n  结果: {'✅ 通过' if test4_result else '❌ 失败'}")
        if not test4_result:
            print(
                f"    原因: 缓存未从 {cache_info7['cache_count']} 减少到 {cache_info8['cache_count']}"  # noqa: E501
            )

        # ==================== 测试结果汇总 ====================
        print("\n" + "=" * 70)
        print("测试结果汇总")
        print("=" * 70)

        results = [
            ("创建公开文章", test1_result),
            ("更新公开文章", test2_result),
            ("切换公开状态（私有->公开）", test3_result),
            ("删除文章", test4_result),
        ]

        passed = sum(1 for _, result in results if result)
        len(results) - passed

        for test_name, result in results:
            status = "✅ 通过" if result else "❌ 失败"
            print(f"  {test_name}: {status}")

        print(f"\n总计: {passed}/{len(results)} 个测试通过")
        print("=" * 70)

        return passed == len(results)

    except Exception as e:
        logger.error(f"测试过程中发生异常: {e}")
        import traceback

        traceback.print_exc()
        return False

    finally:
        # 清理：清除所有RSS缓存
        rss_service.clear_cache()
        print("\n已清除所有RSS缓存")
        db.close()


if __name__ == "__main__":
    success = test_rss_cache_invalidation()
    exit(0 if success else 1)
