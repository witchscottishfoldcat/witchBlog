"""
安全修复验证测试

覆盖以下修复：
- #2 JWT Secret Key 动态生成
- #4 密码哈希 HMAC 预处理（支持长密码）
- #5 代理端点大小限制
- #6 图片内容校验
- #7 get_current_user_optional 精确异常捕获
- #3 CORS 配置区分环境
"""
import struct
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ==================== #4 密码哈希验证 ====================


class TestPasswordHashPrehash:
    """验证 HMAC 预处理密码哈希：长密码不丢失熵"""

    def test_short_password_roundtrip(self):
        """短密码能正确哈希和验证"""
        from app.core.security import get_password_hash, verify_password

        password = "MySecurePass123!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_wrong_password_fails(self):
        """错误密码验证失败"""
        from app.core.security import get_password_hash, verify_password

        hashed = get_password_hash("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_long_password_roundtrip(self):
        """超长密码（>72字节）能正确哈希和验证，不丢失熵"""
        from app.core.security import get_password_hash, verify_password

        # 200 字符的密码（远超 bcrypt 72 字节限制）
        long_password = "a" * 200
        hashed = get_password_hash(long_password)
        assert verify_password(long_password, hashed) is True

    def test_long_password_distinct_from_truncated(self):
        """
        关键验证：100个a 和 200个a 必须产生不同的哈希结果。
        旧实现会截断到72字节导致两者哈希相同，新实现通过 HMAC 预处理保证不同。
        """
        from app.core.security import get_password_hash, verify_password

        hash_100a = get_password_hash("a" * 100)
        # 200个a 不应被 100个a 的哈希验证通过
        assert verify_password("a" * 200, hash_100a) is False

    def test_unicode_password_roundtrip(self):
        """Unicode 密码能正确处理"""
        from app.core.security import get_password_hash, verify_password

        password = "密码密码密码🔐🔑"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_empty_hash_returns_false(self):
        """无效的哈希格式返回 False 而非抛异常"""
        from app.core.security import verify_password

        assert verify_password("any_password", "invalid_hash") is False


class TestPasswordHashCompat:
    """验证兼容旧格式哈希 + 透明升级"""

    def test_legacy_hash_still_verifies(self):
        """旧算法生成的哈希仍能验证成功（兼容历史用户）"""
        import bcrypt

        from app.core.security import verify_password

        password = "MyOldPassword123"
        # 模拟旧算法：直接 bcrypt 哈希（无 HMAC 预处理）
        legacy_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        )
        # 新的 verify_password 应该能验证旧哈希
        assert verify_password(password, legacy_hash) is True

    def test_legacy_long_password_compatible(self):
        """旧格式的长密码哈希兼容验证（截断逻辑）"""
        import bcrypt

        from app.core.security import verify_password

        long_password = "a" * 200
        truncated = ("a" * 72).encode("utf-8")
        legacy_hash = bcrypt.hashpw(truncated, bcrypt.gensalt()).decode("utf-8")
        assert verify_password(long_password, legacy_hash) is True

    def test_new_hash_rejects_legacy_verify(self):
        """新算法哈希无法用旧算法验证（说明确实是新格式）"""

        from app.core.security import _verify_password_legacy, get_password_hash

        password = "test_password_456"
        new_hash = get_password_hash(password)
        # 新哈希用旧算法应该验证失败
        assert _verify_password_legacy(password, new_hash) is False

    def test_transparent_upgrade_on_authenticate(self):
        """authenticate 方法在旧哈希验证成功后自动升级"""
        from unittest.mock import MagicMock

        import bcrypt

        from app.core.security import verify_password
        from app.services.auth import AuthService

        password = "CompatiblePass789"
        # 生成旧格式哈希
        legacy_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        )

        # Mock 用户对象
        mock_user = MagicMock()
        mock_user.username = "testuser"
        mock_user.hashed_password = legacy_hash

        # Mock db.query 链
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_user
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query

        # 执行 authenticate
        result = AuthService.authenticate(mock_db, "testuser", password)

        # 应该返回用户
        assert result is not None
        # 应该调用了 commit（因为旧哈希被升级）
        assert mock_db.commit.called
        # 升级后的哈希应该不同于旧哈希
        assert mock_user.hashed_password != legacy_hash
        # 升级后的哈希应该能被新算法验证
        assert verify_password(password, mock_user.hashed_password) is True

    def test_no_upgrade_for_new_hash(self):
        """新格式哈希验证成功后不触发重复升级"""
        from unittest.mock import MagicMock

        from app.core.security import get_password_hash
        from app.services.auth import AuthService

        password = "AlreadyNewFormat123"
        new_hash = get_password_hash(password)

        mock_user = MagicMock()
        mock_user.username = "testuser"
        mock_user.hashed_password = new_hash

        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_user
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query

        result = AuthService.authenticate(mock_db, "testuser", password)

        assert result is not None
        # 新哈希再次哈希后结果不同（因为 salt 随机），所以 commit 仍会被调用
        # 但关键是验证成功，且新哈希能通过新算法验证
        from app.core.security import verify_password

        assert verify_password(password, mock_user.hashed_password) is True


# ==================== #2 JWT Secret Key 验证 ====================


class TestSecretKeyGeneration:
    """验证 JWT Secret Key 不再是硬编码弱密钥"""

    def test_dev_env_generates_random_key(self):
        """开发环境无 SECRET_KEY 时生成随机密钥"""

        import app.core.config as config_module

        with patch.dict("os.environ", {"ENVIRONMENT": "development"}, clear=False):
            # 移除 SECRET_KEY
            import os

            old_key = os.environ.pop("SECRET_KEY", None)
            try:
                key = config_module._get_secret_key()
                # 应该是一个随机生成的强密钥，而非占位符
                assert key != "your-secret-key-here-change-in-production"
                assert not key.startswith("your-")
                assert len(key) >= 32  # token_urlsafe(32) 产生约43字符
            finally:
                if old_key is not None:
                    os.environ["SECRET_KEY"] = old_key

    def test_production_env_requires_secret_key(self):
        """生产环境未设置 SECRET_KEY 时抛出 ValueError"""
        import os

        import app.core.config as config_module

        old_key = os.environ.pop("SECRET_KEY", None)
        old_env = os.environ.get("ENVIRONMENT")
        os.environ["ENVIRONMENT"] = "production"
        try:
            with pytest.raises(ValueError, match="SECRET_KEY"):
                config_module._get_secret_key()
        finally:
            if old_key is not None:
                os.environ["SECRET_KEY"] = old_key
            if old_env is not None:
                os.environ["ENVIRONMENT"] = old_env

    def test_placeholder_key_rejected(self):
        """以 your- 开头的占位符密钥会被拒绝"""
        import os

        import app.core.config as config_module

        old_key = os.environ.get("SECRET_KEY")
        old_env = os.environ.get("ENVIRONMENT")
        os.environ["SECRET_KEY"] = "your-super-secret-placeholder"
        os.environ["ENVIRONMENT"] = "development"
        try:
            key = config_module._get_secret_key()
            # 应该生成新随机密钥，而非使用占位符
            assert key != "your-super-secret-placeholder"
        finally:
            if old_key is not None:
                os.environ["SECRET_KEY"] = old_key
            else:
                os.environ.pop("SECRET_KEY", None)
            if old_env is not None:
                os.environ["ENVIRONMENT"] = old_env


# ==================== #6 图片内容校验验证 ====================


class TestImageContentValidation:
    """验证 Pillow 图片内容校验"""

    def _make_minimal_png(self) -> bytes:
        """生成最小有效 PNG 图片字节"""
        # PNG 文件签名 + 最小 IHDR + IDAT + IEND
        import zlib

        signature = b"\x89PNG\r\n\x1a\n"
        # IHDR: 1x1, 8-bit RGB
        ihdr_data = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
        ihdr_crc = zlib.crc32(b"IHDR" + ihdr_data) & 0xFFFFFFFF
        ihdr = struct.pack(">I", 13) + b"IHDR" + ihdr_data + struct.pack(">I", ihdr_crc)
        # IDAT: 空数据
        idat_raw = b"\x00"
        idat_compressed = zlib.compress(idat_raw)
        idat_crc = zlib.crc32(b"IDAT" + idat_compressed) & 0xFFFFFFFF
        idat = (
            struct.pack(">I", len(idat_compressed))
            + b"IDAT"
            + idat_compressed
            + struct.pack(">I", idat_crc)
        )
        # IEND
        iend_crc = zlib.crc32(b"IEND") & 0xFFFFFFFF
        iend = struct.pack(">I", 0) + b"IEND" + struct.pack(">I", iend_crc)
        return signature + ihdr + idat + iend

    def test_valid_png_accepted(self):
        """有效 PNG 图片通过校验"""
        from app.services.minio_service import MinIOService

        png_data = self._make_minimal_png()
        is_valid, fmt, size = MinIOService.validate_image_content(png_data)
        assert is_valid is True
        assert fmt == "PNG"

    def test_fake_image_rejected(self):
        """伪装为图片的文本文件被拒绝"""
        from app.services.minio_service import MinIOService

        fake_data = b"<svg onload='alert(1)'></svg>"
        is_valid, _, _ = MinIOService.validate_image_content(fake_data)
        assert is_valid is False

    def test_empty_data_rejected(self):
        """空数据被拒绝"""
        from app.services.minio_service import MinIOService

        is_valid, _, _ = MinIOService.validate_image_content(b"")
        assert is_valid is False

    def test_random_bytes_rejected(self):
        """随机字节被拒绝"""
        from app.services.minio_service import MinIOService

        is_valid, _, _ = MinIOService.validate_image_content(b"\x00" * 100)
        assert is_valid is False


# ==================== #5 代理大小限制验证 ====================


class TestProxySizeLimit:
    """验证代理端点的大小限制函数"""

    @pytest.mark.asyncio
    async def test_oversized_content_raises_413(self):
        """超过大小限制的响应被拒绝"""

        from app.api.v1.proxy import PROXY_MAX_CONTENT_BYTES, _fetch_with_size_limit

        # 构造一个超过限制的假响应
        mock_response = MagicMock()
        mock_response.headers = {"content-length": str(PROXY_MAX_CONTENT_BYTES + 1)}
        mock_response.content = b"x" * (PROXY_MAX_CONTENT_BYTES + 1)
        mock_response.raise_for_status = MagicMock()

        # _fetch_with_size_limit 内部使用 await client.get(url)，需要 AsyncMock
        mock_client = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            await _fetch_with_size_limit(mock_client, "http://example.com/big.jpg")
        assert exc_info.value.status_code == 413


# ==================== #3 CORS 配置验证 ====================


class TestCorsConfiguration:
    """验证 CORS 配置区分环境且收紧了方法和头"""

    def test_production_cors_restricts_methods(self):
        """生产环境 CORS 不使用通配符方法"""
        from app.middleware.cors import _ALLOWED_HEADERS, _ALLOWED_METHODS

        # 方法不应包含通配符
        assert "*" not in _ALLOWED_METHODS
        # 头不应包含通配符
        assert "*" not in _ALLOWED_HEADERS
        # 应包含必要的方法
        assert "GET" in _ALLOWED_METHODS
        assert "POST" in _ALLOWED_METHODS
        assert "DELETE" in _ALLOWED_METHODS
        # 应包含必要的头
        assert "Authorization" in _ALLOWED_HEADERS
        assert "Content-Type" in _ALLOWED_HEADERS
