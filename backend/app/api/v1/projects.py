from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.unified_logging import get_logger
from app.crud.crud_project_info import crud_project_info, crud_project_language
from app.models.user import User
from app.services.project_parser import project_parser_service

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=List[Dict])
def get_projects(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    platform: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """获取项目列表，支持筛选和搜索"""
    try:
        projects = crud_project_info.get_multi(
            db=db,
            skip=skip,
            limit=limit,
            platform=platform,
            tag=tag,
            language=language,
            search=search,
        )

        # 转换为响应格式
        result = []
        for project in projects:
            languages = crud_project_language.get_by_project_id(
                db, project_id=project.id
            )

            project_data = {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "url": project.url,
                "platform": project.platform,
                "tag": project.tag,
                "avatar_url": project.avatar_url,
                "stars_count": project.stars_count,
                "forks_count": project.forks_count,
                "owner": project.owner,
                "repository_name": project.repository_name,
                "language_stats": project.language_stats,
                "created_at": project.created_at,
                "updated_at": project.updated_at,
                "languages": [
                    {
                        "language": lang.language,
                        "percentage": lang.percentage,
                        "bytes_count": lang.bytes_count,
                    }
                    for lang in languages
                ],
            }
            result.append(project_data)

        return result

    except Exception as e:
        logger.error(f"获取项目列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取项目列表失败")


@router.get("/{project_id}", response_model=Dict)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """获取单个项目详情"""
    try:
        project = crud_project_info.get(db=db, id=project_id)
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")

        # 获取语言统计
        languages = crud_project_language.get_by_project_id(db, project_id=project.id)

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "url": project.url,
            "platform": project.platform,
            "tag": project.tag,
            "avatar_url": project.avatar_url,
            "stars_count": project.stars_count,
            "forks_count": project.forks_count,
            "owner": project.owner,
            "repository_name": project.repository_name,
            "language_stats": project.language_stats,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "languages": [
                {
                    "language": lang.language,
                    "percentage": lang.percentage,
                    "bytes_count": lang.bytes_count,
                }
                for lang in languages
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取项目详情失败: {e}")
        raise HTTPException(status_code=500, detail="获取项目详情失败")


@router.post("/", response_model=Dict)
def create_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    project_url: str,
    tag: str = "策划中",
):
    """通过项目URL创建新项目记录（仅超级管理员）"""
    try:
        # 检查项目是否已存在
        existing_project = crud_project_info.get_by_url(db=db, url=project_url)
        if existing_project:
            raise HTTPException(status_code=400, detail="该项目已存在")

        # 解析项目信息
        logger.info(f"开始解析项目URL: {project_url}")
        project_data = project_parser_service.extract_project_info(project_url)

        # 设置标签
        project_data["tag"] = tag

        # 创建项目记录
        project = crud_project_info.create(db=db, obj_in=project_data)

        # 获取语言统计
        languages = crud_project_language.get_by_project_id(db, project_id=project.id)

        logger.info(f"成功创建项目记录: {project.name}")

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "url": project.url,
            "platform": project.platform,
            "tag": project.tag,
            "avatar_url": project.avatar_url,
            "stars_count": project.stars_count,
            "forks_count": project.forks_count,
            "owner": project.owner,
            "repository_name": project.repository_name,
            "language_stats": project.language_stats,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "languages": [
                {
                    "language": lang.language,
                    "percentage": lang.percentage,
                    "bytes_count": lang.bytes_count,
                }
                for lang in languages
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建项目记录失败: {e}")
        raise HTTPException(status_code=500, detail="创建项目记录失败")


@router.put("/{project_id}", response_model=Dict)
def update_project(
    project_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    tag: Optional[str] = None,
):
    """更新项目信息（目前只支持更新标签，仅超级管理员）"""
    try:
        project = crud_project_info.get(db=db, id=project_id)
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")

        update_data = {}
        if tag is not None:
            update_data["tag"] = tag

        # 更新项目
        project = crud_project_info.update(db=db, db_obj=project, obj_in=update_data)

        # 获取语言统计
        languages = crud_project_language.get_by_project_id(db, project_id=project.id)

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "url": project.url,
            "platform": project.platform,
            "tag": project.tag,
            "avatar_url": project.avatar_url,
            "stars_count": project.stars_count,
            "forks_count": project.forks_count,
            "owner": project.owner,
            "repository_name": project.repository_name,
            "language_stats": project.language_stats,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "languages": [
                {
                    "language": lang.language,
                    "percentage": lang.percentage,
                    "bytes_count": lang.bytes_count,
                }
                for lang in languages
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新项目失败: {e}")
        raise HTTPException(status_code=500, detail="更新项目失败")


@router.delete("/{project_id}", response_model=Dict)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除项目（仅超级管理员）"""
    try:
        project = crud_project_info.get(db=db, id=project_id)
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")

        crud_project_info.remove(db=db, id=project_id)

        return {"message": "项目已删除"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除项目失败: {e}")
        raise HTTPException(status_code=500, detail="删除项目失败")


@router.get("/stats/platform", response_model=List[Dict])
def get_platform_stats(db: Session = Depends(get_db)):
    """获取各平台项目数量统计"""
    try:
        stats = crud_project_info.get_platform_stats(db=db)
        return stats

    except Exception as e:
        logger.error(f"获取平台统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取平台统计失败")


@router.get("/stats/tag", response_model=List[Dict])
def get_tag_stats(db: Session = Depends(get_db)):
    """获取各标签项目数量统计"""
    try:
        stats = crud_project_info.get_tag_stats(db=db)
        return stats

    except Exception as e:
        logger.error(f"获取标签统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取标签统计失败")


@router.get("/stats/language", response_model=List[Dict])
def get_language_stats(
    db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)
):
    """获取使用最多的编程语言统计"""
    try:
        stats = crud_project_info.get_language_stats(db=db, limit=limit)
        return stats

    except Exception as e:
        logger.error(f"获取语言统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取语言统计失败")


@router.post("/refresh/{project_id}", response_model=Dict)
def refresh_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """刷新项目信息（重新从远程获取最新数据，仅超级管理员）"""
    try:
        project = crud_project_info.get(db=db, id=project_id)
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")

        # 重新解析项目信息
        logger.info(f"刷新项目信息: {project.url}")
        project_data = project_parser_service.extract_project_info(project.url)

        # 保留原有的标签
        project_data["tag"] = project.tag

        # 更新项目
        project = crud_project_info.update(db=db, db_obj=project, obj_in=project_data)

        # 获取语言统计
        languages = crud_project_language.get_by_project_id(db, project_id=project.id)

        logger.info(f"成功刷新项目记录: {project.name}")

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "url": project.url,
            "platform": project.platform,
            "tag": project.tag,
            "avatar_url": project.avatar_url,
            "stars_count": project.stars_count,
            "forks_count": project.forks_count,
            "owner": project.owner,
            "repository_name": project.repository_name,
            "language_stats": project.language_stats,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "languages": [
                {
                    "language": lang.language,
                    "percentage": lang.percentage,
                    "bytes_count": lang.bytes_count,
                }
                for lang in languages
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"刷新项目失败: {e}")
        raise HTTPException(status_code=500, detail="刷新项目失败")
