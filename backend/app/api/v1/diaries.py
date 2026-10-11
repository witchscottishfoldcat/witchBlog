from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_current_user_optional, get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.diary import (
    DiaryCreate,
    DiaryImageCreate,
    DiaryImageInfo,
    DiaryImageResponse,
    DiaryListResponse,
    DiaryResponse,
    DiaryUpdate,
    ImageUploadUrlResponse,
)
from app.services.diary_service import diary_service

logger = get_logger(__name__)

router = APIRouter()


@router.post("/", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_diary(
    diary: DiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建日记"""
    user_id = current_user.id
    db_diary = diary_service.create_diary(db, diary, user_id)
    return _convert_diary_to_response(db_diary)


@router.get("/", response_model=DiaryListResponse)
async def get_diaries(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=1000, description="每页记录数"),
    public_only: bool = Query(True, description="是否只获取公开日记"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取日记列表"""
    # 如果用户已登录且不限制为公开日记，则获取用户的所有日记
    if current_user and not public_only:
        user_id = current_user.id
        is_public = None
    else:
        user_id = None
        is_public = True

    diaries = diary_service.get_diaries(db, user_id, is_public, skip, limit)
    total = diary_service.count_diaries(db, user_id, is_public)

    diary_responses = []
    for diary in diaries:
        try:
            logger.debug(f"开始转换日记: {diary.id}, 标题: {diary.title}")

            # 检查图片数量
            logger.debug(f"日记 {diary.id} 有 {len(diary.images)} 张图片")

            # 转换图片
            image_infos = []
            for img in diary.images:
                logger.debug(f"转换图片: {img.id}, 文件名: {img.original_filename}")
                try:
                    image_info = _convert_image_to_info(img)
                    image_infos.append(image_info)
                    logger.debug(f"图片 {img.id} 转换成功")
                except Exception as img_e:
                    logger.error(f"图片 {img.id} 转换失败: {img_e}", exception=img_e)
                    raise

            # 创建响应
            logger.debug(f"创建日记 {diary.id} 的响应")
            diary_response = DiaryResponse(
                id=diary.id,
                title=diary.title,
                content=diary.content,
                user_id=diary.user_id,
                weather=diary.weather,
                mood=diary.mood,
                tags=diary.tags or [],
                is_public=diary.is_public,
                created_at=diary.created_at,
                updated_at=diary.updated_at,
                images=image_infos,
            )
            diary_responses.append(diary_response)
            logger.info(f"日记 {diary.id} 转换成功")
        except Exception:
            logger.exception(f"转换日记失败: {diary.id}")
            raise

    return DiaryListResponse(
        diaries=diary_responses, total=total, page=skip // limit + 1, per_page=limit
    )


@router.get("/{diary_id}", response_model=DiaryResponse)
async def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取单篇日记详情"""
    user_id = current_user.id if current_user else None
    db_diary = diary_service.get_diary_by_id(db, diary_id, user_id)

    if not db_diary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在或无权访问")

    return _convert_diary_to_response(db_diary)


@router.put("/{diary_id}", response_model=DiaryResponse)
async def update_diary(
    diary_id: int,
    diary: DiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新日记"""
    user_id = current_user.id
    db_diary = diary_service.update_diary(
        db, diary_id, diary, user_id, is_superuser=bool(current_user.is_superuser)
    )

    if not db_diary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在或无权修改")

    return _convert_diary_to_response(db_diary)


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除日记"""
    user_id = current_user.id
    success = diary_service.delete_diary(db, diary_id, user_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在或无权删除")


@router.post(
    "/{diary_id}/images/upload-urls", response_model=List[ImageUploadUrlResponse]
)
async def get_image_upload_urls(
    diary_id: int,
    file_count: int = Query(1, ge=1, le=10, description="上传文件数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取图片预签名上传URL（仅日记 owner / 超级管理员）"""
    # 写操作授权：读取用的 get_diary_by_id 允许访问公开日记，
    # 这里必须校验归属，防止向他人日记注入图片
    user_id = current_user.id
    db_diary = diary_service.get_diary_by_id(db, diary_id, user_id)

    if not db_diary or (db_diary.user_id != user_id and not current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在或无权访问")

    # 生成预签名上传URL
    upload_urls = diary_service.generate_upload_urls(diary_id, user_id, file_count)
    return upload_urls


@router.get("/{diary_id}/images", response_model=List[DiaryImageResponse])
async def get_diary_images(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取日记的所有图片"""
    # 检查日记是否存在
    user_id = current_user.id if current_user else None
    db_diary = diary_service.get_diary_by_id(db, diary_id, user_id)

    if not db_diary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在或无权访问")

    # 获取并返回所有图片
    image_responses = [_convert_image_to_response(image) for image in db_diary.images]
    return image_responses


@router.post(
    "/{diary_id}/images",
    response_model=DiaryImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def save_image_info(
    diary_id: int,
    image_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """保存图片信息（仅日记 owner / 超级管理员）"""
    # 写操作授权：同 upload-urls，校验日记归属
    user_id = current_user.id
    db_diary = diary_service.get_diary_by_id(db, diary_id, user_id)

    if not db_diary or (db_diary.user_id != user_id and not current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在或无权访问")

    # 保存图片信息
    minio_object_name = image_data.get("minio_object_name")

    # 检查必要的字段是否存在
    if not minio_object_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="minio_object_name 不能为空"
        )

    # 不再使用缩略图，设置为 None
    thumbnail_minio_object_name = None

    # 验证必填字段
    original_filename = image_data.get("original_filename")
    file_size = image_data.get("file_size")
    mime_type = image_data.get("mime_type")

    if not original_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="original_filename 不能为空"
        )

    if file_size is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="file_size 不能为空"
        )

    if not mime_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="mime_type 不能为空"
        )

    # 创建图片信息对象
    image_create = DiaryImageCreate(
        original_filename=original_filename,
        file_size=int(file_size),  # 确保转换为整数
        mime_type=mime_type,
        width=image_data.get("width"),
        height=image_data.get("height"),
    )

    db_image = diary_service.save_diary_image(
        db, diary_id, image_create, minio_object_name, thumbnail_minio_object_name
    )

    # 不再需要图片验证步骤，因为图片上传流程已经确保了图片的存在性

    return _convert_image_to_response(db_image)


def _convert_diary_to_response(diary) -> DiaryResponse:
    """将日记模型转换为响应模型"""
    image_responses = [_convert_image_to_info(image) for image in diary.images]

    return DiaryResponse(
        id=diary.id,
        title=diary.title,
        content=diary.content,
        user_id=diary.user_id,
        weather=diary.weather,
        mood=diary.mood,
        tags=diary.tags or [],
        is_public=diary.is_public,
        created_at=diary.created_at,
        updated_at=diary.updated_at,
        images=image_responses,
    )


def _convert_image_to_response(image) -> DiaryImageResponse:
    """将图片模型转换为响应模型"""
    image_url = diary_service.get_image_url(image.minio_object_name)

    return DiaryImageResponse(
        id=image.id,
        diary_id=image.diary_id,
        minio_bucket=image.minio_bucket,
        minio_object_name=image.minio_object_name,
        original_filename=image.original_filename,
        file_size=image.file_size,
        mime_type=image.mime_type,
        width=image.width,
        height=image.height,
        image_url=image_url,
        created_at=image.created_at,
    )


def _convert_image_to_info(image) -> DiaryImageInfo:
    """将图片模型转换为信息模型（用于日记响应）"""
    image_url = diary_service.get_image_url(image.minio_object_name)

    return DiaryImageInfo(
        id=image.id,
        minio_bucket=image.minio_bucket,
        minio_object_name=image.minio_object_name,
        original_filename=image.original_filename,
        file_size=image.file_size,
        mime_type=image.mime_type,
        width=image.width,
        height=image.height,
        image_url=image_url,
        created_at=image.created_at,
    )
