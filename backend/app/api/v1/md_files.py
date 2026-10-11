from typing import Any, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_current_active_user
from app.core.database import get_db
from app.core.unified_logging import get_logger
from app.core.uploads import ensure_upload_size
from app.models.user import User
from app.schemas.md_file import (
    MDFile,
    MDFileCreate,
    MDFileList,
    MDFileUpdate,
    MDFileWithContent,
)
from app.services.frontend_cache import notify_frontend_revalidate
from app.services.md_file import MDFileService

logger = get_logger(__name__)

router = APIRouter()


@router.post("/", response_model=MDFile)
def create_md_file(
    file_data: MDFileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """创建MD文件（通过JSON输入内容）"""
    user_id = current_user.id
    md_file_service = MDFileService()

    return md_file_service.create_file(db, file_data, user_id)


@router.post("/upload", response_model=MDFile)
def upload_md_file(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_public: Optional[bool] = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """上传MD文件（通过文件上传）"""
    user_id = current_user.id

    # 检查文件扩展名（UploadFile.filename 可能为 None，按不支持扩展名处理）
    filename = file.filename or ""
    if not filename.endswith((".md", ".markdown", ".mdown", ".mkd")):
        raise HTTPException(
            status_code=400, detail="只支持 .md, .markdown, .mdown, .mkd 格式的文件"
        )

    # 大小与内容校验
    ensure_upload_size(file)
    try:
        content = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="文件内容必须是 UTF-8 编码的 Markdown 文本",
        )

    # 创建文件数据对象
    file_data = MDFileCreate(
        title=title,
        description=description,
        content=content,
        filename=file.filename,
        tags=tags,
        is_public=is_public,
    )

    md_file_service = MDFileService()
    return md_file_service.create_file(db, file_data, user_id)


@router.get("/", response_model=MDFileList)
def list_md_files(
    response: Response,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    is_public: Optional[bool] = Query(None, description="是否公开"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取MD文件列表（超级管理员可见全部；普通用户仅公开文件）"""
    # 非超级管理员强制只返回公开文件，防止普通登录用户枚举他人私有文件
    if not current_user.is_superuser:
        is_public = True
    user_id = None

    md_file_service = MDFileService()
    # 列表场景不刷新预签名 URL：前端读内容走 /{id}/content 或 proxy_url，
    # 列表仅用于展示元信息；刷新会对每个私有文件发起一次串行 MinIO 签名请求，
    # 是列表页“加载慢”的主因。
    files, total = md_file_service.get_files(
        db,
        skip=skip,
        limit=limit,
        owner_id=user_id,
        search=search,
        is_public=is_public,
        refresh_private_urls=False,
    )

    response.headers["Cache-Control"] = "no-store"
    return MDFileList(files=files, total=total)


@router.get("/public", response_model=MDFileList)
def list_public_md_files(
    response: Response,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
) -> Any:
    """获取公开MD文件列表"""
    md_file_service = MDFileService()
    # 公开列表同理：不刷新预签名 URL（公开文件本就不需要私有签名）
    files, total = md_file_service.get_files(
        db,
        skip=skip,
        limit=limit,
        is_public=True,
        search=search,
        refresh_private_urls=False,
    )

    response.headers["Cache-Control"] = "no-store"
    return MDFileList(files=files, total=total)


@router.get("/{file_id}", response_model=MDFile)
def get_md_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取MD文件信息（私有文件仅 owner / 超级管理员）"""
    # 超级管理员不限制；普通用户传入自己的ID触发归属/公开校验
    user_id = None if current_user.is_superuser else current_user.id

    md_file_service = MDFileService()
    return md_file_service.get_file(db, file_id, user_id, refresh_url=True)


@router.get("/{file_id}/content", response_model=MDFileWithContent)
def get_md_file_content(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取MD文件内容（私有文件仅 owner / 超级管理员）"""
    # 超级管理员不限制；普通用户传入自己的ID触发归属/公开校验
    user_id = None if current_user.is_superuser else current_user.id

    # 创建服务实例
    md_file_service = MDFileService()

    # 获取文件信息
    file = md_file_service.get_file(db, file_id, user_id)

    # 获取文件内容
    content = md_file_service.get_file_content(db, file_id, user_id)

    # 返回带内容的文件信息
    return MDFileWithContent(**file.__dict__, content=content)


@router.put("/{file_id}", response_model=MDFile)
def update_md_file(
    file_id: int,
    file_update: MDFileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """更新MD文件"""
    user_id = current_user.id

    md_file_service = MDFileService()
    return md_file_service.update_file(
        db, file_id, file_update, user_id, bool(current_user.is_superuser)
    )


@router.post("/{file_id}/toggle-public")
def toggle_file_public_status(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """切换MD文件的公开状态"""
    user_id = current_user.id

    md_file_service = MDFileService()
    file = md_file_service.get_file(
        db, file_id, user_id, check_permission=current_user.is_superuser is False
    )

    # 切换公开状态
    new_public_status = not file.is_public

    # 更新文件
    from app.schemas.md_file import MDFileUpdate

    update_data = MDFileUpdate(is_public=new_public_status)
    updated_file = md_file_service.update_file(
        db, file_id, update_data, user_id, bool(current_user.is_superuser)
    )

    # 如果文件变为公开，清除RSS缓存
    if new_public_status:
        try:
            from app.services.rss import rss_service

            rss_service.clear_cache()
        except Exception as rss_error:
            from loguru import logger

            logger.error(f"清除RSS缓存失败: {rss_error}")

    return {
        "message": f"文件已更新为{'公开' if new_public_status else '私有'}",
        "file_id": updated_file.id,
        "title": updated_file.title,
        "is_public": updated_file.is_public,
        "file_url": updated_file.file_url,
    }


@router.get("/{file_id}/download")
def download_md_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """下载MD文件"""
    # 超级管理员不限制；普通用户传入自己的ID触发归属/公开校验
    user_id = None if current_user.is_superuser else current_user.id

    # 创建服务实例
    md_file_service = MDFileService()

    # 获取文件信息
    file = md_file_service.get_file(db, file_id, user_id)

    # 获取文件内容
    content = md_file_service.get_file_content(db, file_id, user_id)

    # 文件名由用户上传时指定，需编码防止响应头注入/乱码
    from urllib.parse import quote

    safe_filename = quote(file.original_filename or f"file_{file_id}.md")
    return Response(
        content=content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": (f"attachment; filename*=UTF-8''{safe_filename}")
        },
    )


@router.post("/{file_id}/archive")
def archive_md_file(
    file_id: int,
    archive_reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """归档MD文件"""
    user_id = current_user.id

    # 导入归档服务
    from app.services.md_file_archive import md_file_archive_service

    try:
        archive = md_file_archive_service.archive_file(
            db=db,
            file_id=file_id,
            archive_reason=archive_reason,
            user_id=user_id,
            is_superuser=bool(current_user.is_superuser),
        )
        # 归档改变了前台 /archive 页数据，尽力立即刷新前台 ISR 缓存
        notify_frontend_revalidate()
        return {
            "message": "MD文件归档成功",
            "archive_id": archive.id,
            "title": archive.title,
            "archive_date": archive.archive_date,
        }
    except Exception as e:
        logger.error(f"MD文件归档失败: file_id={file_id}, error: {e}")
        raise HTTPException(status_code=500, detail="MD文件归档失败")


@router.delete("/{file_id}")
def delete_md_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """删除MD文件"""
    user_id = current_user.id

    md_file_service = MDFileService()
    md_file_service.delete_file(db, file_id, user_id, bool(current_user.is_superuser))

    return {"message": "MD文件删除成功"}
