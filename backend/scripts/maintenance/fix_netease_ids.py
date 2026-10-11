"""
网易云歌曲 ID 修复脚本

独立运行，扫描数据库中 netease_id 非纯数字的歌曲，
通过网易云搜索 API 自动匹配并更新为真实 ID。

使用方式:
    # 预览将要修复的歌曲（不实际修改）
    python scripts/fix_netease_ids.py --dry-run

    # 执行修复
    python scripts/fix_netease_ids.py
"""

import argparse
import asyncio
import os
import sys

# 将项目根目录加入 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description="修复数据库中无效的网易云歌曲 ID")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="预览模式，只输出将要修复的内容，不实际修改数据库",
    )
    return parser.parse_args()


async def main():
    args = parse_args()

    from app.core.database import SessionLocal
    from app.services.netease_id_resolver import backfill_database, get_invalid_tracks

    print("=" * 60)
    print("  🎵 网易云歌曲 ID 修复工具")
    print("=" * 60)

    if args.dry_run:
        print("📋 预览模式：不会修改数据库\n")
    else:
        print("⚠️  执行模式：将修改数据库中的数据\n")

    db = SessionLocal()
    try:
        # 先统计需要修复的歌曲数量
        invalid_tracks = get_invalid_tracks(db)
        print(f"发现 {len(invalid_tracks)} 首歌曲的 netease_id 无效：")

        if not invalid_tracks:
            print("\n✅ 所有歌曲的 netease_id 均有效，无需修复！")
            return

        for track in invalid_tracks:
            print(
                f"  - [{track.id}] {track.title} - {track.artist} "
                f"(当前ID: {track.netease_id})"
            )

        print(f"\n开始{'预览' if args.dry_run else '修复'}...\n")

        # 执行修复
        result = await backfill_database(db, dry_run=args.dry_run)

        # 输出结果
        print("\n" + "=" * 60)
        print("  📊 修复结果")
        print("=" * 60)

        if result["success"]:
            print(f"\n✅ 成功: {len(result['success'])} 首")
            for item in result["success"]:
                print(f"  - [{item['id']}] {item['title']} - {item['artist']}")
                print(f"    {item['old_netease_id']} -> {item['new_netease_id']}")

        if result["failed"]:
            print(f"\n❌ 失败: {len(result['failed'])} 首")
            for item in result["failed"]:
                print(f"  - [{item['id']}] {item['title']} - {item['artist']}")
                print(f"    原因: {item.get('reason', '未知')}")

        if result["skipped"]:
            print(f"\n⚠️  跳过: {len(result['skipped'])} 首")
            for item in result["skipped"]:
                print(f"  - [{item['id']}] {item['title']} - {item['artist']}")
                print(f"    原因: {item.get('reason', '未知')}")

        total = len(result["success"]) + len(result["failed"]) + len(result["skipped"])
        print(f"\n总计: {total} 首歌曲")

        if args.dry_run:
            print("\n💡 这是预览模式，如要执行修复请去掉 --dry-run 参数")

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
