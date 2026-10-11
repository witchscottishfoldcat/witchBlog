from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser
from app.core.database import get_db
from app.core.unified_logging import get_logger
from app.core.uploads import ensure_upload_size
from app.models.user import User
from app.services.minio_service import minio_service

logger = get_logger(__name__)

router = APIRouter()

# 进程内只建一次表：DDL 涉及 MySQL 元数据字典锁，不应每个请求都执行
_about_files_table_ready = False


def _ensure_about_files_table(db: Session) -> None:
    """确保 about_files 记录表存在（每进程仅执行一次）"""
    global _about_files_table_ready
    if _about_files_table_ready:
        return
    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS about_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                object_name VARCHAR(500) NOT NULL,
                file_url VARCHAR(1000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
    """
        )
    )
    db.commit()
    _about_files_table_ready = True


@router.post("/upload")
def upload_about_file(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """上传md文件到about文件夹"""
    # 检查文件扩展名（UploadFile.filename 可能为 None，按不支持扩展名处理）
    filename = file.filename or ""
    if not filename.endswith((".md", ".markdown", ".mdown", ".mkd")):
        raise HTTPException(
            status_code=400, detail="只支持 .md, .markdown, .mdown, .mkd 格式的文件"
        )

    ensure_upload_size(file)
    try:
        content = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="文件内容必须是 UTF-8 编码的 Markdown 文本")
    file.file.seek(0)

    # 上传到MinIO（复用全局单例）
    minio_info = minio_service.upload_content(
        content=content, filename=file.filename or "", folder="about", is_public=True
    )

    # 生成公开URL
    file_url = minio_service.get_file_url(minio_info["object_name"], presigned=False)

    # 保存到简单数据库表（使用原生的SQL）
    try:
        _ensure_about_files_table(db)
        # 插入记录
        result = db.execute(
            text(
                """
            INSERT INTO about_files (title, filename, object_name, file_url)
            VALUES (:title, :filename, :object_name, :file_url)
        """
            ),
            {
                "title": title,
                "filename": file.filename,
                "object_name": minio_info["object_name"],
                "file_url": file_url,
            },
        )

        file_id = result.lastrowid  # type: ignore[attr-defined]
        db.commit()

        return {
            "id": file_id,
            "title": title,
            "filename": file.filename,
            "url": file_url,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"保存文件信息失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="保存文件信息失败")


@router.get("/")
def get_about_files(db: Session = Depends(get_db)) -> Any:
    """获取所有about文件的MinIO链接"""
    try:
        _ensure_about_files_table(db)
        # 查询所有记录
        result = db.execute(
            text(
                """
            SELECT id, title, filename, file_url
            FROM about_files
            ORDER BY created_at DESC
        """
            )
        )

        files = []
        for row in result:
            files.append(
                {"id": row[0], "title": row[1], "filename": row[2], "url": row[3]}
            )

        return files
    except Exception as e:
        logger.error(f"获取文件列表失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="获取文件列表失败")


@router.delete("/{file_id}")
def delete_about_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """删除指定的about文件"""
    try:
        # 查询文件信息
        result = db.execute(
            text(
                """
            SELECT object_name FROM about_files WHERE id = :id
        """
            ),
            {"id": file_id},
        )

        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="文件不存在")

        object_name = row[0]

        # 从MinIO删除文件（复用全局单例）
        if object_name:
            minio_service.delete_file(object_name)

        # 从数据库删除记录
        db.execute(
            text(
                """
            DELETE FROM about_files WHERE id = :id
        """
            ),
            {"id": file_id},
        )

        db.commit()

        return {"message": "文件删除成功"}
    except HTTPException:
        raise  # 重新抛出HTTP异常
    except Exception as e:
        db.rollback()
        logger.error(f"删除文件失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="删除文件失败")
