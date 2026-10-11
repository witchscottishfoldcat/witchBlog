#!/usr/bin/env python3
"""
调试日记API的脚本
"""

from app.core.database import get_db
from app.models.diary import Diary
from app.schemas.diary import DiaryResponse, DiaryImageInfo

def debug_diary():
    """调试日记功能"""
    db = next(get_db())
    
    try:
        # 导入转换函数
        from app.api.v1.diaries import _convert_diary_to_response
        
        # 获取多篇日记（模拟API查询）
        diaries = db.query(Diary).order_by(Diary.created_at.desc()).limit(20).all()
        print(f"找到 {len(diaries)} 篇日记")
        
        # 对每篇日记尝试转换
        for i, diary in enumerate(diaries):
            print(f"\n处理第 {i+1} 篇日记: {diary.title}")
            try:
                diary_response = _convert_diary_to_response(diary)
                print(f"第 {i+1} 篇日记转换成功")
            except Exception as e:
                print(f"第 {i+1} 篇日记转换失败: {e}")
                import traceback
                traceback.print_exc()
        
        return  # 提前返回，不再执行后面的代码
        if not diary:
            print("没有找到日记")
            return
        
        print(f"找到日记: {diary.title}")
        print(f"日记ID: {diary.id}")
        print(f"图片数量: {len(diary.images)}")
        
        # 检查图片信息
        for img in diary.images:
            print(f"图片: {img.original_filename}, ID: {img.id}")
        
        # 尝试手动转换图片
        image_infos = []
        if diary.images:
            for img in diary.images:
                image_info = DiaryImageInfo(
                    id=img.id,
                    minio_bucket=img.minio_bucket,
                    minio_object_name=img.minio_object_name,
                    original_filename=img.original_filename,
                    file_size=img.file_size,
                    mime_type=img.mime_type,
                    width=img.width,
                    height=img.height,
                    thumbnail_minio_object_name=img.thumbnail_minio_object_name,
                    image_url="http://example.com/image.jpg",
                    thumbnail_url="http://example.com/thumb.jpg" if img.thumbnail_minio_object_name else None,
                    created_at=img.created_at
                )
                image_infos.append(image_info)
            print("图片信息转换成功")
        
        # 尝试创建DiaryResponse
        try:
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
                images=image_infos
            )
            print("DiaryResponse创建成功")
        except Exception as e:
            print(f"DiaryResponse创建失败: {e}")
            import traceback
            traceback.print_exc()
        
        # 尝试使用_convert_diary_to_response函数
        from app.api.v1.diaries import _convert_diary_to_response
        
        try:
            diary_response2 = _convert_diary_to_response(diary)
            print("使用_convert_diary_to_response创建成功")
        except Exception as e:
            print(f"使用_convert_diary_to_response失败: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    debug_diary()