import logging
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.site_config import SiteConfig as SiteConfigModel
from app.schemas.site_config import SiteConfigCreate, SiteConfigUpdate
from app.services.minio_service import minio_service as _minio_singleton
from app.services.minio_service import to_proxy_url

logger = logging.getLogger(__name__)


def _rewrite_config_urls(
    config: Optional[SiteConfigModel],
) -> Optional[SiteConfigModel]:
    """
    将站点配置中的 OSS 直链改写为代理 URL（DB 数据保持不变，仅改返回值）。
    覆盖历史持久化的 OSS 直链数据。
    """
    if config is None:
        return None
    config.site_icon = to_proxy_url(config.site_icon)
    config.profile_image = to_proxy_url(config.profile_image)
    return config


class SiteConfigService:
    """站点配置服务类"""

    def __init__(self):
        self.minio_service = _minio_singleton

    def get_site_config(self, db: Session, config_id: int) -> Optional[SiteConfigModel]:
        """获取单个站点配置"""
        return db.query(SiteConfigModel).filter(SiteConfigModel.id == config_id).first()

    def get_active_site_config(self, db: Session) -> Optional[SiteConfigModel]:
        """获取当前激活的站点配置"""
        return (
            db.query(SiteConfigModel)
            .filter(SiteConfigModel.is_active.is_(True))
            .first()
        )

    def get_all_site_configs(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> List[SiteConfigModel]:
        """获取所有站点配置"""
        return db.query(SiteConfigModel).offset(skip).limit(limit).all()

    def create_site_config(
        self, db: Session, obj_in: SiteConfigCreate
    ) -> SiteConfigModel:
        """创建站点配置"""
        # 如果创建新的激活配置，需要将其他配置设为非激活
        if obj_in.is_active:
            db.query(SiteConfigModel).filter(
                SiteConfigModel.is_active.is_(True)
            ).update({"is_active": False})

        db_obj = SiteConfigModel(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        logger.info(f"创建站点配置成功: {db_obj.site_name}")
        return db_obj

    def update_site_config(
        self, db: Session, db_obj: SiteConfigModel, obj_in: SiteConfigUpdate
    ) -> SiteConfigModel:
        """更新站点配置"""
        # 如果设置为激活配置，需要将其他配置设为非激活
        update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("is_active", False):
            db.query(SiteConfigModel).filter(
                and_(
                    SiteConfigModel.is_active.is_(True), SiteConfigModel.id != db_obj.id
                )
            ).update({"is_active": False})

        for field in update_data:
            setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        logger.info(f"更新站点配置成功: {db_obj.site_name}")
        return db_obj

    def delete_site_config(self, db: Session, config_id: int) -> bool:
        """删除站点配置"""
        db_obj = self.get_site_config(db, config_id=config_id)
        if not db_obj:
            return False

        db.delete(db_obj)
        db.commit()
        logger.info(f"删除站点配置成功: {db_obj.site_name}")
        return True

    def upload_site_icon(self, db: Session, config_id: int, file) -> Optional[str]:
        """上传站点图标"""
        # 确保配置存在
        db_obj = self.get_site_config(db, config_id=config_id)
        if not db_obj:
            return None

        # 上传文件到MinIO的site_images文件夹
        file_info = self.minio_service.upload_file(
            file=file, folder="site_images/icons", is_public=True  # 站点图标应该是公开的
        )

        # 更新数据库中的URL
        db_obj.site_icon = file_info["url"]
        db.commit()
        db.refresh(db_obj)

        logger.info(f"上传站点图标成功: {file_info['url']}")
        return file_info["url"]

    def upload_profile_image(self, db: Session, config_id: int, file) -> Optional[str]:
        """上传个人头像"""
        # 确保配置存在
        db_obj = self.get_site_config(db, config_id=config_id)
        if not db_obj:
            return None

        # 上传文件到MinIO的site_images文件夹
        file_info = self.minio_service.upload_file(
            file=file, folder="site_images/profile", is_public=True  # 个人头像应该是公开的
        )

        # 更新数据库中的URL
        db_obj.profile_image = file_info["url"]
        db.commit()
        db.refresh(db_obj)

        logger.info(f"上传个人头像成功: {file_info['url']}")
        return file_info["url"]

    def get_public_site_config(self, db: Session) -> Optional[SiteConfigModel]:
        """获取公开的站点配置信息（不包含敏感信息）"""
        return self.get_active_site_config(db)


# 创建服务实例
site_config_service = SiteConfigService()
