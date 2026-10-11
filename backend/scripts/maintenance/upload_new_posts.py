"""一次性脚本：将 new-posts 目录下的 Markdown 文章通过 MDFileService 上传（与管理后台同路径）"""
import argparse
import sys
from pathlib import Path

from app.core.database import SessionLocal
from app.schemas.md_file import MDFileCreate
from app.services.md_file import MDFileService
from app.services.md_metadata_parser import MDMetadataParser


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="上传目录中的 Markdown 文章")
    parser.add_argument("--posts-dir", type=Path, required=True, help="待上传文章目录")
    parser.add_argument("--owner-id", type=int, required=True, help="文章所有者的用户 ID")
    args = parser.parse_args()
    if args.owner_id <= 0:
        parser.error("--owner-id 必须是正整数")
    if not args.posts_dir.is_dir():
        parser.error("--posts-dir 必须是已存在的目录")
    return args


def main() -> None:
    args = parse_args()
    files = sorted(args.posts_dir.glob("*.md"))
    if not files:
        print("未找到待上传文章")
        sys.exit(1)

    db = SessionLocal()
    service = MDFileService()
    created = []
    try:
        for path in files:
            content = path.read_text(encoding="utf-8")
            metadata = MDMetadataParser.parse_frontmatter(content)["metadata"]
            file_data = MDFileCreate(
                title=metadata.get("title") or path.stem,
                description=metadata.get("description"),
                tags=metadata.get("tags")
                if isinstance(metadata.get("tags"), str)
                else None,
                is_public=True,
                published=metadata.get("published"),
                category=metadata.get("category"),
                subcategory=metadata.get("subcategory"),
                pinned=bool(metadata.get("pinned", False)),
                encrypted=bool(metadata.get("encrypted", False)),
                author=metadata.get("author"),
                content=content,
                filename=path.name,
            )
            record = service.create_file(db, file_data, args.owner_id)
            created.append(
                (record.id, record.title, record.category, record.subcategory)
            )
            print(
                f"✓ 已上传 id={record.id} {record.title} ({record.category}/{record.subcategory})"
            )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"\n完成，共上传 {len(created)} 篇")


if __name__ == "__main__":
    main()
