from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SiteConfigBase(BaseModel):
    """站点配置基础模型"""

    site_name: Optional[str] = Field(None, description="站点名称", max_length=100)
    site_signature: Optional[str] = Field(None, description="站点签名", max_length=200)
    site_announcement: Optional[str] = Field(None, description="站点公告")
    site_icon: Optional[str] = Field(None, description="站点图标URL", max_length=500)
    profile_image: Optional[str] = Field(None, description="个人头像URL", max_length=500)
    is_active: Optional[bool] = Field(True, description="是否启用")


class SiteConfigCreate(SiteConfigBase):
    """创建站点配置"""

    site_name: str = Field(..., description="站点名称", max_length=100)


class SiteConfigUpdate(SiteConfigBase):
    """更新站点配置"""


class SiteConfigInDB(SiteConfigBase):
    """数据库中的站点配置"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SiteConfig(SiteConfigInDB):
    """站点配置响应模型"""


class SiteConfigPublic(BaseModel):
    """公开的站点配置信息（对外展示用）"""

    site_name: str
    site_signature: Optional[str] = None
    site_announcement: Optional[str] = None
    site_icon: Optional[str] = None
    profile_image: Optional[str] = None
    rss_url: str = Field(..., description="RSS订阅链接")

    class Config:
        from_attributes = True
