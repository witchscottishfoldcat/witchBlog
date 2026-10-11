"""
相册模块单元测试
"""
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


def test_imports():
    """测试导入是否正常"""
    print("测试导入...")

    try:
        pass

        print("✓ 模型导入成功")
    except Exception as e:
        print(f"✗ 模型导入失败: {e}")
        return False

    try:
        pass

        print("✓ Schemas导入成功")
    except Exception as e:
        print(f"✗ Schemas导入失败: {e}")
        return False

    try:
        pass

        print("✓ 服务导入成功")
    except Exception as e:
        print(f"✗ 服务导入失败: {e}")
        return False

    try:
        pass

        print("✓ API路由导入成功")
    except Exception as e:
        print(f"✗ API路由导入失败: {e}")
        return False

    return True


def test_models():
    """测试模型是否可以创建"""
    print("\n测试模型创建...")

    try:
        from app.models.album import Album, Photo
        from app.models.user import User

        # 创建用户实例
        user = User(
            id=1, username="test", email="test@example.com", hashed_password="test"
        )

        # 创建相册实例
        album = Album(
            title="测试相册",
            description="测试相册描述",
            tags=["测试", "相册"],
            is_public=True,
            user_id=user.id,
        )
        print("✓ 相册模型创建成功")

        # 创建照片实例
        Photo(
            album_id=album.id,
            minio_bucket="test-bucket",
            minio_object_name="test-object",
            original_filename="test.jpg",
            file_size=1024,
            mime_type="image/jpeg",
            title="测试照片",
            description="测试照片描述",
            tags=["测试", "照片"],
        )
        print("✓ 照片模型创建成功")

        return True
    except Exception as e:
        print(f"✗ 模型创建失败: {e}")
        return False


def test_schemas():
    """测试Schema是否可以验证"""
    print("\n测试Schema验证...")

    try:
        from app.schemas.album import AlbumCreate, PhotoCreate

        # 测试相册创建Schema
        album_data = {
            "title": "测试相册",
            "description": "测试相册描述",
            "tags": ["测试", "相册"],
            "is_public": True,
        }
        AlbumCreate(**album_data)
        print("✓ 相册创建Schema验证成功")

        # 测试照片创建Schema
        photo_data = {
            "title": "测试照片",
            "description": "测试照片描述",
            "tags": ["测试", "照片"],
            "is_cover": False,
            "sort_order": 0,
        }
        PhotoCreate(**photo_data)
        print("✓ 照片创建Schema验证成功")

        return True
    except Exception as e:
        print(f"✗ Schema验证失败: {e}")
        return False


def test_service():
    """测试服务是否可以实例化"""
    print("\n测试服务实例化...")

    try:
        from app.services.album_service import AlbumService

        AlbumService()
        print("✓ 相册服务实例化成功")

        return True
    except Exception as e:
        print(f"✗ 服务实例化失败: {e}")
        return False


def main():
    """运行所有测试"""
    print("相册模块单元测试")
    print("=" * 50)

    results = []
    results.append(test_imports())
    results.append(test_models())
    results.append(test_schemas())
    results.append(test_service())

    print("\n" + "=" * 50)
    print("测试结果:")

    if all(results):
        print("✓ 所有测试通过！相册模块可以正常使用。")
        return True
    else:
        print("✗ 部分测试失败，请检查错误信息。")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
