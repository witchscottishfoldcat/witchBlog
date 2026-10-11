"""
初始化站点配置脚本
"""
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.schemas.site_config import SiteConfigCreate
from app.services.site_config import site_config_service


def init_site_config():
    """初始化站点配置"""
    db = SessionLocal()
    try:
        # 检查是否已有站点配置
        existing_config = site_config_service.get_active_site_config(db)
        if existing_config:
            print(f"已存在激活的站点配置: {existing_config.site_name}")
            return

        # 创建默认站点配置
        default_config = SiteConfigCreate(
            site_name="WitchCat",
            site_signature="你的博客签名",
            site_announcement="欢迎来到我的博客，分享技术、生活和思考",
            is_active=True,
        )

        config = site_config_service.create_site_config(db, obj_in=default_config)
        print(f"成功创建默认站点配置: {config.site_name}")

    except Exception as e:
        print(f"创建站点配置失败: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    init_site_config()
