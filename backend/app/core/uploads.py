"""上传文件大小统一校验。

所有接收 UploadFile 的接口都应先调用 ensure_upload_size，
避免超大文件被整读进内存（或写入对象存储）。
"""
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


def ensure_upload_size(file: UploadFile) -> None:
    """校验 UploadFile 实际大小（seek/tell），超过 MAX_UPLOAD_SIZE 抛 413。"""
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"文件太大，请上传小于 {max_mb}MB 的文件",
        )
