"""测试RSS功能的脚本"""
from app.core.database import SessionLocal
from app.services.rss import rss_service


def test_rss():
    db = SessionLocal()
    try:
        rss_xml = rss_service.generate_rss_feed(
            db=db, feed_url="http://localhost:8000/api/v1/rss/feed", limit=1
        )
        print(rss_xml)
    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


test_rss()
