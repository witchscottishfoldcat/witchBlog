"""
简单测试技能创建脚本
"""
import os
import sys
from datetime import datetime

from app.core.database import SessionLocal
from app.crud.crud_skill import skill
from app.models.skill import SkillCategory, SkillLevel


def create_test_skill():
    """
    创建一个测试技能
    """
    db = SessionLocal()
    try:
        # 创建测试技能
        from app.schemas.skill import SkillCreate

        skill_data = SkillCreate(
            name="Java", category=SkillCategory.BACKEND.value, description="Java编程语言"
        )

        # 检查技能是否已存在
        existing_skill = skill.get_by_name(db, name="Java")
        if existing_skill:
            print(f"技能已存在: {existing_skill.name}")
            print(f"技能详情: {existing_skill.__dict__}")
            return existing_skill

        # 创建新技能
        created_skill = skill.create(db=db, obj_in=skill_data)
        print(f"创建技能: {created_skill.name}")
        print(f"技能详情: {created_skill.__dict__}")
        return created_skill

    except Exception as e:
        print(f"创建技能时出错: {e}")
        import traceback

        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()


if __name__ == "__main__":
    create_test_skill()
