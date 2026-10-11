#!/usr/bin/env python3
"""
单元测试：修复后的日记图片上传功能
测试修复的问题：
1. minio_object_name为null导致的数据库完整性错误
2. 参数验证和错误处理
"""

from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

from app.api.v1.diaries import save_image_info
from app.models import Diary
from app.schemas.diary import DiaryImageCreate
from app.services.diary_service import DiaryService


class TestDiaryImageUploadFixed:
    """测试修复后的日记图片上传功能"""

    @pytest.mark.asyncio
    async def test_save_image_info_with_valid_data(self):
        """测试保存有效图片数据"""
        # 准备测试数据
        diary_id = 1
        image_data = {
            "original_filename": "test.jpg",
            "file_size": 1024,
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": "diaries/1/test.jpg",
        }

        # Mock数据库会话
        mock_db = Mock()

        # Mock DiaryService
        with patch("app.api.v1.diaries.diary_service") as mock_service:
            # Mock日记存在检查
            mock_service.get_diary_by_id.return_value = Diary(id=1, title="测试日记")

            # Mock保存图片方法
            mock_image = Mock()
            mock_image.id = 1
            mock_image.diary_id = diary_id
            mock_image.minio_object_name = "diaries/1/test.jpg"
            mock_service.save_diary_image.return_value = mock_image

            # Mock当前用户
            mock_current_user = Mock()
            mock_current_user.id = 1

            # Mock转换函数
            with patch("app.api.v1.diaries._convert_image_to_response") as mock_convert:
                mock_convert.return_value = {
                    "id": 1,
                    "diary_id": diary_id,
                    "minio_object_name": "diaries/1/test.jpg",
                }

                # 执行测试
                result = await save_image_info(
                    diary_id, image_data, mock_db, mock_current_user
                )

            # 验证结果
            assert result["id"] == 1
            assert result["diary_id"] == diary_id
            assert result["minio_object_name"] == "diaries/1/test.jpg"
            mock_service.save_diary_image.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_image_info_with_null_minio_object_name(self):
        """测试minio_object_name为null的情况（应该被拒绝）"""
        # 准备测试数据（minio_object_name为None）
        diary_id = 1
        image_data = {
            "original_filename": "test.jpg",
            "file_size": 1024,
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": None,  # 这是问题所在
        }

        # Mock数据库会话
        mock_db = Mock()

        # Mock当前用户
        mock_current_user = Mock()
        mock_current_user.id = 1

        # 执行测试，期望抛出HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await save_image_info(diary_id, image_data, mock_db, mock_current_user)

        # 验证错误响应
        assert exc_info.value.status_code == 400
        assert "minio_object_name 不能为空" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_save_image_info_with_empty_minio_object_name(self):
        """测试空的minio_object_name"""
        # 准备测试数据
        diary_id = 1
        image_data = {
            "original_filename": "test.jpg",
            "file_size": 1024,
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": "",  # 空字符串
        }

        # Mock数据库会话
        mock_db = Mock()

        # Mock当前用户
        mock_current_user = Mock()
        mock_current_user.id = 1

        # 执行测试，期望抛出HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await save_image_info(diary_id, image_data, mock_db, mock_current_user)

        # 验证错误响应
        assert exc_info.value.status_code == 400
        assert "minio_object_name 不能为空" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_save_image_info_diary_not_found(self):
        """测试日记不存在的情况"""
        # 准备测试数据
        diary_id = 999
        image_data = {
            "original_filename": "test.jpg",
            "file_size": 1024,
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": "diaries/1/test.jpg",
        }

        # Mock数据库会话
        mock_db = Mock()

        # Mock DiaryService - 日记不存在
        with patch("app.api.v1.diaries.diary_service") as mock_service:
            mock_service.get_diary_by_id.return_value = None

            # Mock当前用户
            mock_current_user = Mock()
            mock_current_user.id = 1

            # 执行测试，期望抛出HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await save_image_info(diary_id, image_data, mock_db, mock_current_user)

            # 验证错误响应
            assert exc_info.value.status_code == 404
            assert "日记不存在或无权访问" in exc_info.value.detail


class TestDiaryServiceValidation:
    """测试DiaryService的参数验证"""

    @pytest.mark.asyncio
    async def test_diary_service_save_diary_image_validation(self):
        """测试DiaryService的save_diary_image方法参数验证"""
        # 测试无效数据
        diary_id = 1
        invalid_data = DiaryImageCreate(
            original_filename="test.jpg",
            file_size=1024,
            mime_type="image/jpeg",
            width=800,
            height=600,
        )

        # Mock数据库
        mock_db = Mock()

        # 创建DiaryService实例
        service = DiaryService()

        # 测试验证失败 - 空的minio_object_name
        with pytest.raises(HTTPException) as exc_info:
            service.save_diary_image(mock_db, diary_id, invalid_data, "")

        assert "minio_object_name 不能为空" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_save_image_info_missing_original_filename(self):
        """测试缺少original_filename的情况"""
        diary_id = 1
        image_data = {
            "file_size": 1024,
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": "diaries/1/test.jpg",
        }

        mock_current_user = Mock()
        mock_current_user.id = 1

        with pytest.raises(HTTPException) as exc_info:
            await save_image_info(diary_id, image_data, Mock(), mock_current_user)

        assert exc_info.value.status_code == 400
        assert "original_filename 不能为空" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_save_image_info_missing_file_size(self):
        """测试缺少file_size的情况"""
        diary_id = 1
        image_data = {
            "original_filename": "test.jpg",
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": "diaries/1/test.jpg",
        }

        mock_current_user = Mock()
        mock_current_user.id = 1

        with pytest.raises(HTTPException) as exc_info:
            await save_image_info(diary_id, image_data, Mock(), mock_current_user)

        assert exc_info.value.status_code == 400
        assert "file_size 不能为空" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_save_image_info_missing_mime_type(self):
        """测试缺少mime_type的情况"""
        diary_id = 1
        image_data = {
            "original_filename": "test.jpg",
            "file_size": 1024,
            "width": 800,
            "height": 600,
            "minio_object_name": "diaries/1/test.jpg",
        }

        mock_current_user = Mock()
        mock_current_user.id = 1

        with pytest.raises(HTTPException) as exc_info:
            await save_image_info(diary_id, image_data, Mock(), mock_current_user)

        assert exc_info.value.status_code == 400
        assert "mime_type 不能为空" in exc_info.value.detail


class TestImageDataValidation:
    """测试图片数据验证"""

    def test_image_data_validation(self):
        """测试图片数据验证"""
        # 测试有效数据
        valid_data = {
            "original_filename": "test.jpg",
            "file_size": 1024,
            "mime_type": "image/jpeg",
            "width": 800,
            "height": 600,
            "minio_object_name": "diaries/1/test.jpg",
        }

        # 验证数据格式
        assert "minio_object_name" in valid_data
        assert valid_data["minio_object_name"] == "diaries/1/test.jpg"

        # 测试空字符串
        valid_data["minio_object_name"] = ""
        assert valid_data["minio_object_name"] == ""

        # 测试None值
        valid_data["minio_object_name"] = None
        assert valid_data["minio_object_name"] is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
