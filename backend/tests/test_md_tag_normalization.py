from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.schemas.md_file import MDFileUpdate
from app.services.md_file import MDFileService
from app.services.md_metadata_parser import MDMetadataParser


def test_parse_frontmatter_splits_legacy_adjacent_quoted_tags():
    content = """---
tags: [“kimi”“ai”“Plan”]
---
body
"""

    result = MDMetadataParser.parse_frontmatter(content)

    assert result["metadata"]["tags"] == "kimi,ai,Plan"


def test_parse_frontmatter_keeps_standard_tag_array_items():
    content = """---
tags: ["kimi", "ai", "Plan"]
---
body
"""

    result = MDMetadataParser.parse_frontmatter(content)

    assert result["metadata"]["tags"] == "kimi,ai,Plan"


def test_update_file_reparses_frontmatter_after_content_is_uploaded():
    content = """---
tags: ["kimi", "ai", "Plan"]
---
body
"""
    md_file = SimpleNamespace(
        id=31,
        owner_id=1,
        is_public=True,
        object_name="md_files/old.md",
        original_filename="article.md",
        proxy_url="/api/proxy/md/31",
    )
    service = MDFileService.__new__(MDFileService)
    service.get_file = MagicMock(return_value=md_file)  # type: ignore[method-assign]
    service.minio_service = MagicMock()
    service.minio_service.upload_content.return_value = {
        "object_name": "md_files/new.md",
        "size": len(content),
        "etag": "new-etag",
    }
    service.minio_service.get_file_url.return_value = "http://backend/md_files/new.md"
    db = MagicMock()

    with (
        patch("app.services.md_file.invalidate_cache_on_file_update"),
        patch(
            "app.services.md_file.MDMetadataService.parse_and_store_metadata"
        ) as parse_metadata,
    ):
        service.update_file(
            db,
            file_id=31,
            file_update=MDFileUpdate(content=content),
            user_id=1,
        )

    parse_metadata.assert_called_once_with(db, md_file, content)
