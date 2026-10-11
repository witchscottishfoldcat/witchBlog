"""测试RSS缓存自动清除功能的脚本"""
import time

from loguru import logger

from app.core.database import SessionLocal
from app.schemas.md_file import MDFileCreate, MDFileUpdate
from app.services.md_file import MDFileService
from app.services.rss import rss_service


def print_cache_info(title: str):
    """打印当前缓存信息"""
    cache_info = rss_service.get_cache_info()
    print(f"\n{title}")
    print(f"  缓存数量: {cache_info['cache_count']}")
    print(f"  缓存键: {cache_info['cache_keys']}")
    print(f"  TTL: {cache_info['ttl_minutes']} 分钟")
    return cache_info["cache_count"]


def generate_rss_once():
    """生成一次RSS feed以建立缓存"""
    db = SessionLocal()
    try:
        logger.info("生成RSS feed以建立缓存...")
        rss_xml = rss_service.generate_rss_feed(
            db=db, feed_url="http://localhost:8000/rss/feed", limit=10
        )
        logger.info(f"RSS feed生成成功，长度: {len(rss_xml)} 字符")
        return True
    except Exception as e:
        logger.error(f"生成RSS feed失败: {e}")
        return False
    finally:
        db.close()


def test_create_public_file():
    """测试1: 创建公开文章时清除RSS缓存"""
    print("\n" + "=" * 60)
    print("测试1: 创建公开文章时清除RSS缓存")
    print("=" * 60)

    # 先建立缓存
    generate_rss_once()
    cache_count_before = print_cache_info("创建前的缓存状态")

    # 创建公开文章
    db = SessionLocal()
    try:
        md_file_service = MDFileService()
        file_data = MDFileCreate(
            title="测试文章 - RSS缓存测试",
            description="这是一篇用于测试RSS缓存自动清除功能的文章",
            content="# 测试文章\n\n这是正文内容，用于测试RSS缓存。\n\n## 测试章节\n\n这是一个测试。",
            filename="test_rss_cache.md",
            tags="测试,RSS",
            is_public=True,
        )

        logger.info("创建公开文章...")
        new_file = md_file_service.create_file(db, file_data, owner_id=1)
        logger.info(f"文章创建成功: ID={new_file.id}, 标题={new_file.title}")

        # 等待一小会儿确保缓存清除操作完成
        time.sleep(0.1)

        # 检查缓存是否被清除
        cache_count_after = print_cache_info("创建后的缓存状态")

        if cache_count_after < cache_count_before:
            print("✅ 测试通过: 缓存已清除")
            return True, new_file.id
        else:
            print("❌ 测试失败: 缓存未被清除")
            return False, new_file.id

    except Exception as e:
        logger.error(f"测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False, None
    finally:
        db.close()


def test_update_public_file():
    file_id = 1
    """测试2: 更新公开文章时清除RSS缓存"""
    print("\n" + "=" * 60)
    print("测试2: 更新公开文章时清除RSS缓存")
    print("=" * 60)

    # 先建立缓存
    generate_rss_once()
    cache_count_before = print_cache_info("更新前的缓存状态")

    # 更新文章
    db = SessionLocal()
    try:
        md_file_service = MDFileService()
        update_data = MDFileUpdate(title="测试文章 - 已更新（RSS缓存测试）", description="这是更新后的描述")

        logger.info(f"更新文章 ID={file_id}...")
        updated_file = md_file_service.update_file(db, file_id, update_data, user_id=1)
        logger.info(f"文章更新成功: 标题={updated_file.title}")

        # 等待一小会儿确保缓存清除操作完成
        time.sleep(0.1)

        # 检查缓存是否被清除
        cache_count_after = print_cache_info("更新后的缓存状态")

        if cache_count_after < cache_count_before:
            print("✅ 测试通过: 缓存已清除")
            return True
        else:
            print("❌ 测试失败: 缓存未被清除")
            return False

    except Exception as e:
        logger.error(f"测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False
    finally:
        db.close()


def test_delete_file():
    file_id = 1
    """测试3: 删除文章时清除RSS缓存"""
    print("\n" + "=" * 60)
    print("测试3: 删除文章时清除RSS缓存")
    print("=" * 60)

    # 先建立缓存
    generate_rss_once()
    cache_count_before = print_cache_info("删除前的缓存状态")

    # 删除文章
    db = SessionLocal()
    try:
        md_file_service = MDFileService()
        logger.info(f"删除文章 ID={file_id}...")
        md_file_service.delete_file(db, file_id, user_id=1)
        logger.info("文章删除成功")

        # 等待一小会儿确保缓存清除操作完成
        time.sleep(0.1)

        # 检查缓存是否被清除
        cache_count_after = print_cache_info("删除后的缓存状态")

        if cache_count_after < cache_count_before:
            print("✅ 测试通过: 缓存已清除")
            return True
        else:
            print("❌ 测试失败: 缓存未被清除")
            return False

    except Exception as e:
        logger.error(f"测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False
    finally:
        db.close()


def test_toggle_public_status():
    file_id: int | None = 1
    """测试4: 切换文章公开状态时清除RSS缓存"""
    print("\n" + "=" * 60)
    print("测试4: 切换文章公开状态时清除RSS缓存")
    print("=" * 60)

    # 先创建一个私有文章
    db = SessionLocal()
    file_id = None
    try:
        md_file_service = MDFileService()
        file_data = MDFileCreate(
            title="测试文章 - 公开状态切换测试",
            description="这是一篇用于测试公开状态切换的文章",
            content="# 测试公开状态切换\n\n这是正文内容。",
            filename="test_toggle_public.md",
            tags="测试,公开状态",
            is_public=False,  # 初始为私有
        )

        logger.info("创建私有文章...")
        new_file = md_file_service.create_file(db, file_data, owner_id=1)
        file_id = new_file.id
        logger.info(f"私有文章创建成功: ID={file_id}")

    except Exception as e:
        logger.error(f"创建文章失败: {e}")
        return False
    finally:
        db.close()

    # 等待一小会儿
    time.sleep(0.1)

    # 建立缓存
    generate_rss_once()
    cache_count_before = print_cache_info("切换公开状态前的缓存状态")

    # 切换为公开
    db = SessionLocal()
    try:
        md_file_service = MDFileService()
        update_data = MDFileUpdate(is_public=True)

        logger.info(f"将文章 ID={file_id} 切换为公开...")
        updated_file = md_file_service.update_file(db, file_id, update_data, user_id=1)
        logger.info(f"文章已切换为公开: is_public={updated_file.is_public}")

        # 等待一小会儿确保缓存清除操作完成
        time.sleep(0.1)

        # 检查缓存是否被清除
        cache_count_after = print_cache_info("切换公开状态后的缓存状态")

        if cache_count_after < cache_count_before:
            print("✅ 测试通过: 缓存已清除")
            result = True
        else:
            print("❌ 测试失败: 缓存未被清除")
            result = False

    except Exception as e:
        logger.error(f"测试失败: {e}")
        import traceback

        traceback.print_exc()
        result = False
    finally:
        # 清理：删除测试文章
        try:
            md_file_service.delete_file(db, file_id, user_id=1)
            logger.info("测试文章已清理")
        except Exception:
            pass
        db.close()

    return result


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("RSS缓存自动清除功能测试")
    print("=" * 60)

    # 清除所有缓存，从干净状态开始
    rss_service.clear_cache()
    logger.info("已清除所有缓存，准备开始测试")

    results = []

    # 测试1: 创建公开文章
    success, file_id = test_create_public_file()
    results.append(("创建公开文章", success))

    if file_id:
        # 测试2: 更新公开文章
        success = test_update_public_file()
        results.append(("更新公开文章", success))

        # 测试3: 删除文章
        success = test_delete_file()
        results.append(("删除文章", success))
    else:
        print("\n跳过测试2和测试3，因为测试1未通过")
        results.append(("更新公开文章", False))
        results.append(("删除文章", False))

    # 测试4: 切换公开状态
    success = test_toggle_public_status()
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

    # 清理：清除所有缓存
    rss_service.clear_cache()
    logger.info("测试完成，已清除所有缓存")


if __name__ == "__main__":
    main()
