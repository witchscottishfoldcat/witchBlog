from app.models.md_file import MDFile
from app.models.md_file_archive import MDFileArchive
from app.services.md_metadata_parser import MDMetadataParser


def test_parser_normalizes_primary_and_secondary_categories():
    content = """---
category: " 技术 "
sub_category: " 人工智能 "
---
正文
"""

    metadata = MDMetadataParser.parse_frontmatter(content)["metadata"]

    assert metadata["category"] == "技术"
    assert metadata["subcategory"] == "人工智能"


def test_models_expose_optional_subcategory_columns():
    assert MDFile.__table__.columns["subcategory"].nullable is True
    assert MDFileArchive.__table__.columns["subcategory"].nullable is True
