"""
测试修复后的图片上传功能
"""

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_db
from app.main import app

client = TestClient(app)


def test_diary_image_upload_validation():
    """测试图片上传时字段验证"""
    # 测试缺少必填字段的情况
    # 模拟认证用户
    app.dependency_overrides[get_current_user] = lambda: {"id": 1, "username": "test"}

    # 测试数据：缺少 original_filename
    test_data_1 = {
        "file_size": 1024,
        "mime_type": "image/jpeg",
        "width": 100,
        "height": 100,
        "minio_object_name": "test.jpg",
    }

    response = client.post("/api/v1/diaries/11/images", json=test_data_1)
    assert response.status_code == 400
    assert "original_filename 不能为空" in response.json()["detail"]

    # 测试数据：缺少 file_size
    test_data_2 = {
        "original_filename": "test.jpg",
        "mime_type": "image/jpeg",
        "width": 100,
        "height": 100,
        "minio_object_name": "test.jpg",
    }

    response = client.post("/api/v1/diaries/11/images", json=test_data_2)
    assert response.status_code == 400
    assert "file_size 不能为空" in response.json()["detail"]

    # 测试数据：缺少 mime_type
    test_data_3 = {
        "original_filename": "test.jpg",
        "file_size": 1024,
        "width": 100,
        "height": 100,
        "minio_object_name": "test.jpg",
    }

    response = client.post("/api/v1/diaries/11/images", json=test_data_3)
    assert response.status_code == 400
    assert "mime_type 不能为空" in response.json()["detail"]

    # 测试数据：缺少 minio_object_name
    test_data_4 = {
        "original_filename": "test.jpg",
        "file_size": 1024,
        "mime_type": "image/jpeg",
        "width": 100,
        "height": 100,
    }

    response = client.post("/api/v1/diaries/11/images", json=test_data_4)
    assert response.status_code == 400
    assert "minio_object_name 不能为空" in response.json()["detail"]

    # 清理依赖
    app.dependency_overrides.clear()


if __name__ == "__main__":
    test_diary_image_upload_validation()
    print("所有测试通过！")
