import io
import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import HTTPException
from minio import Minio
from minio.error import S3Error
from PIL import Image
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.storage_paths import DIARY_IMAGES_V2_PREFIX
from app.models.diary import Diary, DiaryImage
from app.schemas.diary import (
    DiaryCreate,
    DiaryImageCreate,
    DiaryUpdate,
    ImageUploadUrlResponse,
)

logger = logging.getLogger(__name__)


class DiaryService:
    """日记服务类，处理日记相关业务逻辑"""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def _generate_diary_path(self, diary_id: int, user_id: Optional[int] = None) -> str:
        """生成日记存储路径 - 使用新的 diary-imagesV2 文件夹"""
        date_str = datetime.now().strftime("%Y/%m")
        # 所有日记图片都存储在新的公开路径下
        return f"{DIARY_IMAGES_V2_PREFIX}public/{date_str}/{diary_id}"

    def _get_image_dimensions(self, image_data: bytes) -> Tuple[int, int]:
        """获取图片尺寸"""
        try:
            img = Image.open(io.BytesIO(image_data))
            return img.size  # 返回 (width, height)
        except Exception as e:
            logger.error(f"获取图片尺寸失败: {e}")
            return 0, 0

    def create_diary(
        self, db: Session, diary: DiaryCreate, user_id: Optional[int] = None
    ) -> Diary:
        """创建日记"""
        db_diary = Diary(
            title=diary.title,
            content=diary.content,
            user_id=user_id,
            weather=diary.weather,
            mood=diary.mood,
            tags=diary.tags,
            is_public=diary.is_public,
        )
        db.add(db_diary)
        db.commit()
        db.refresh(db_diary)
        return db_diary

    def update_diary(
        self,
        db: Session,
        diary_id: int,
        diary: DiaryUpdate,
        user_id: Optional[int] = None,
        is_superuser: bool = False,
    ) -> Optional[Diary]:
        """更新日记"""
        db_diary = db.query(Diary).filter(Diary.id == diary_id).first()

        if not db_diary:
            return None

        # 检查权限：仅日记所有者或超级管理员可修改（公开不等于可编辑）
        if db_diary.user_id != user_id and not is_superuser:
            return None

        # 更新字段
        if diary.title is not None:
            db_diary.title = diary.title
        if diary.content is not None:
            db_diary.content = diary.content
        if diary.weather is not None:
            db_diary.weather = diary.weather
        if diary.mood is not None:
            db_diary.mood = diary.mood
        if diary.tags is not None:
            db_diary.tags = diary.tags
        if diary.is_public is not None:
            db_diary.is_public = diary.is_public

        db.commit()
        db.refresh(db_diary)
        return db_diary

    def get_diary_by_id(
        self, db: Session, diary_id: int, user_id: Optional[int] = None
    ) -> Optional[Diary]:
        """根据ID获取日记"""
        db_diary = db.query(Diary).filter(Diary.id == diary_id).first()

        if not db_diary:
            return None

        # 检查权限：如果日记不属于当前用户，且不是公开的，则拒绝
        if db_diary.user_id != user_id and not db_diary.is_public:
            return None

        return db_diary

    def get_diaries(
        self,
        db: Session,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Diary]:
        """获取日记列表"""
        query = db.query(Diary)

        # 根据用户ID或公开状态筛选
        if user_id is not None:
            query = query.filter(Diary.user_id == user_id)
        elif is_public is not None:
            query = query.filter(Diary.is_public == is_public)
        else:
            # 如果没有指定用户ID和公开状态，只返回公开日记
            query = query.filter(Diary.is_public.is_(True))

        # 预加载 images 关系，避免列表循环时 N+1 查询
        query = query.options(selectinload(Diary.images))

        return query.order_by(Diary.created_at.desc()).offset(skip).limit(limit).all()

    def count_diaries(
        self,
        db: Session,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
    ) -> int:
        """统计日记数量"""
        query = db.query(Diary)

        # 根据用户ID或公开状态筛选
        if user_id is not None:
            query = query.filter(Diary.user_id == user_id)
        elif is_public is not None:
            query = query.filter(Diary.is_public == is_public)
        else:
            # 如果没有指定用户ID和公开状态，只统计公开日记
            query = query.filter(Diary.is_public.is_(True))

        return query.count()

    def delete_diary(
        self, db: Session, diary_id: int, user_id: Optional[int] = None
    ) -> bool:
        """删除日记"""
        db_diary = db.query(Diary).filter(Diary.id == diary_id).first()

        if not db_diary:
            return False

        # 检查权限：只有日记所有者可以删除
        if db_diary.user_id != user_id:
            return False

        # 删除日记的所有图片
        for image in db_diary.images:
            self._delete_diary_image(image)

        # 删除日记记录
        db.delete(db_diary)
        db.commit()
        return True

    def generate_upload_urls(
        self, diary_id: int, user_id: Optional[int] = None, file_count: int = 1
    ) -> List[ImageUploadUrlResponse]:
        """生成图片预签名上传URL"""
        results = []
        diary_path = self._generate_diary_path(diary_id, user_id)

        for i in range(file_count):
            # 生成唯一的对象名称
            timestamp = int(datetime.now().timestamp())
            random_str = uuid.uuid4().hex[:8]
            object_name = f"{diary_path}/{timestamp}_{random_str}.jpg"

            # 生成预签名上传URL，有效期1小时
            upload_url = self.client.presigned_put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=timedelta(hours=1),
            )

            results.append(
                ImageUploadUrlResponse(
                    upload_url=upload_url,
                    object_name=object_name,
                    thumbnail_object_name=None,  # 不再使用缩略图
                    expires_in=3600,  # 1小时
                )
            )

        return results

    def save_diary_image(
        self,
        db: Session,
        diary_id: int,
        image_create: DiaryImageCreate,
        minio_object_name: str,
        thumbnail_minio_object_name: Optional[str] = None,
    ) -> DiaryImage:
        """保存日记图片信息"""
        db_diary = self.get_diary_by_id(db, diary_id)
        if not db_diary:
            raise HTTPException(status_code=404, detail="日记不存在")

        # 检查必要字段
        if not minio_object_name:
            raise HTTPException(status_code=400, detail="minio_object_name 不能为空")

        db_image = DiaryImage(
            diary_id=diary_id,
            minio_bucket=self.bucket_name,
            minio_object_name=minio_object_name,
            original_filename=image_create.original_filename,
            file_size=image_create.file_size,
            mime_type=image_create.mime_type,
            width=image_create.width,
            height=image_create.height,
            thumbnail_minio_object_name=thumbnail_minio_object_name,
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)

        # 验证图片权限
        if not self._verify_diary_image_permissions(minio_object_name):
            logger.warning(f"图片权限验证失败，已尝试修复: {minio_object_name}")
        else:
            logger.info(f"图片权限验证通过: {minio_object_name}")

        return db_image

    def get_image_url(self, object_name: str, is_thumbnail: bool = False) -> str:
        """获取图片URL（走后端代理，隐藏 OSS 真实地址）"""
        from app.services.minio_service import build_proxy_url

        return build_proxy_url(object_name)

    def _verify_diary_image_permissions(self, object_name: str) -> bool:
        """验证日记图片是否可公开访问（委托桶策略唯一权威判定）"""
        from app.services.minio_policy_service import minio_policy_service

        return minio_policy_service.check_permissions(object_name)

    def _delete_diary_image(self, image: DiaryImage) -> None:
        """删除日记图片文件"""
        try:
            # 只删除原图，不再有缩略图
            self.client.remove_object(self.bucket_name, image.minio_object_name)

        except S3Error as e:
            logger.error(f"删除图片文件失败: {e}")


# 创建全局日记服务实例
diary_service = DiaryService()
