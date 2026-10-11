#!/usr/bin/env python3
"""
创建时间线表脚本
"""

import sys
import os

# 添加项目根目录到系统路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models import Timeline

if __name__ == "__main__":
    print("正在创建时间线表...")
    # 只创建时间线表
    Timeline.__table__.create(engine, checkfirst=True)
    print("时间线表创建完成")