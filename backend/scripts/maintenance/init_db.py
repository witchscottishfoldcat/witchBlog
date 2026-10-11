#!/usr/bin/env python3
"""
初始化数据库脚本
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models import Base
from app.models.user import User
from scripts.maintenance.create_admin_user import parse_args, resolve_password


def create_tables():
    """创建数据库表"""
    print("创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")


def create_superuser(username: str, email: str, password: str):
    """创建超级用户"""
    db: Session = SessionLocal()

    try:
        # 检查是否已存在超级用户
        existing_superuser = db.query(User).filter(User.is_superuser == True).first()
        if existing_superuser:
            print("超级用户已存在！")
            return

        # 创建超级用户
        superuser = User(
            username=username,
            email=email,
            full_name="Administrator",
            hashed_password=get_password_hash(password),
            is_superuser=True,
            is_active=True,
        )

        db.add(superuser)
        db.commit()
        db.refresh(superuser)

        print("超级用户创建成功！")
        print(f"用户名: {username}")
        print("密码: (已设置，不回显)")
        print(f"邮箱: {email}")

    except Exception as e:
        print(f"创建超级用户失败: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """主函数"""
    args = parse_args()
    password = resolve_password(args)
    print("开始初始化数据库...")

    # 创建表
    create_tables()

    # 创建超级用户
    create_superuser(args.username, args.email, password)

    print("数据库初始化完成！")


if __name__ == "__main__":
    main()
