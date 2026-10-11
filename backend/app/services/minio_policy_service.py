"""
统一的MinIO权限管理服务（全项目唯一的桶策略维护点）

其他模块（minio_service、diary_service 等）不得再写桶策略：
- md_files/* 不列入公开读：MD 文件的公开/私有由数据库 is_public 控制，
  统一经 /api/v1/proxy/oss/* 代理做记录级鉴权后回源，避免桶策略把
  私有文章整目录暴露
- set_public_read_policy 采用"规范重写"：移除所有历史遗留的公开读语句
  （无论何种 Principal 格式），写入唯一权威语句。历史上的多份合并逻辑
  因 Principal 格式互不兼容，会留下互相冲突的语句并让 md_files/* 在
  启动时被重新公开
"""
import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.storage_paths import (
    DIARY_IMAGES_PREFIX,
    DIARY_IMAGES_V2_PREFIX,
    PUBLIC_READ_PREFIXES,
)

logger = logging.getLogger(__name__)

# 公开读语句中"任何人"Principal 的历史变体——统一识别，统一清除
_PUBLIC_PRINCIPALS = ("*", {"AWS": "*"}, {"AWS": ["*"]})

# 必须保持私有的前缀（业务上通过代理记录级鉴权访问，不允许桶级公开读）
_PRIVATE_PREFIXES = ("md_files/",)


def _is_public_get_object_statement(statement: dict) -> bool:
    """判断一条策略语句是否是"任何人可公开读"语句"""
    return (
        statement.get("Effect") == "Allow"
        and "s3:GetObject" in statement.get("Action", [])
        and statement.get("Principal") in _PUBLIC_PRINCIPALS
    )


class MinIOPolicyService:
    """MinIO权限管理服务类，统一管理所有MinIO桶策略"""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def get_all_required_resources(self):
        """获取公开读所需的资源路径（由 PUBLIC_READ_PREFIXES 统一生成）"""
        bucket_name = self.bucket_name
        resources = [
            f"arn:aws:s3:::{bucket_name}/{prefix}*" for prefix in PUBLIC_READ_PREFIXES
        ]
        # 日记图片存在嵌套子目录，需要额外的 */* 通配
        resources += [
            f"arn:aws:s3:::{bucket_name}/{prefix}*/*"
            for prefix in (DIARY_IMAGES_PREFIX, DIARY_IMAGES_V2_PREFIX)
        ]
        return resources

    def get_current_policy(self):
        """获取当前桶策略"""
        try:
            current_policy_json = self.client.get_bucket_policy(self.bucket_name)
            return json.loads(current_policy_json)
        except S3Error:
            # 如果没有策略，返回空策略
            return {"Version": "2012-10-17", "Statement": []}

    def set_public_read_policy(self, resources=None):
        """以规范重写方式设置公开读取策略。

        移除现有全部公开读语句（含各历史格式），写入唯一权威语句；
        非公开读语句原样保留。
        """
        try:
            if resources is None:
                resources = self.get_all_required_resources()

            current_policy = self.get_current_policy()
            statements = current_policy.get("Statement", [])

            removed = [s for s in statements if _is_public_get_object_statement(s)]
            kept = [s for s in statements if not _is_public_get_object_statement(s)]

            kept.append(
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": sorted(set(resources)),
                }
            )
            current_policy["Statement"] = kept

            self.client.set_bucket_policy(self.bucket_name, json.dumps(current_policy))
            logger.info(
                f"公开读策略已规范重写：清理 {len(removed)} 条历史语句，" f"当前公开前缀 {len(set(resources))} 个"
            )
            return True

        except Exception as e:
            logger.error(f"设置公开读取策略失败: {e}")
            return False

    def ensure_bucket_exists(self):
        """确保MinIO桶存在"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"创建MinIO桶: {self.bucket_name}")
            else:
                logger.info(f"MinIO桶已存在: {self.bucket_name}")
            return True
        except S3Error as e:
            logger.error(f"检查/创建MinIO桶失败: {e}")
            return False

    def setup_all_policies(self):
        """设置所有必要的MinIO策略"""
        logger.info("开始设置所有MinIO策略...")

        # 确保桶存在
        if not self.ensure_bucket_exists():
            return False

        # 设置公开读取策略
        if not self.set_public_read_policy():
            return False

        # 验证策略
        if self.verify_policy():
            logger.info("✅ 所有MinIO策略设置成功")
            return True
        else:
            logger.error("❌ MinIO策略验证失败")
            return False

    def _collect_public_resources(self, policy: dict) -> set:
        """收集当前策略中所有公开读覆盖的资源"""
        resources = set()
        for statement in policy.get("Statement", []):
            if _is_public_get_object_statement(statement):
                resources.update(statement.get("Resource", []))
        return resources

    def verify_policy(self):
        """验证策略：必需前缀全部公开 + 必须私有的前缀未被公开"""
        try:
            current_policy = self.get_current_policy()
            existing_resources = self._collect_public_resources(current_policy)
            required_resources = set(self.get_all_required_resources())

            missing_resources = required_resources - existing_resources
            if missing_resources:
                logger.warning(f"缺少以下资源的权限: {list(missing_resources)}")
                return False

            leaked = [
                r
                for r in existing_resources
                if any(f"/{prefix}" in r for prefix in _PRIVATE_PREFIXES)
            ]
            if leaked:
                logger.warning(f"以下私有前缀仍处于公开读，违反访问控制: {leaked}")
                return False

            logger.info("所有必需的权限都已正确设置，且私有前缀未被公开")
            return True

        except Exception as e:
            logger.error(f"验证策略时出错: {e}")
            return False

    def check_permissions(self, resource_path):
        """检查特定路径是否有公开读取权限"""
        try:
            current_policy = self.get_current_policy()
            bucket_prefix = f"arn:aws:s3:::{self.bucket_name}/"

            for resource in self._collect_public_resources(current_policy):
                if resource == f"{bucket_prefix}{resource_path}":
                    return True
                if resource.endswith(
                    "/*"
                ) and f"{bucket_prefix}{resource_path}".startswith(
                    resource.rsplit("/*", 1)[0]
                ):
                    return True

            return False

        except Exception as e:
            logger.error(f"检查权限时出错: {e}")
            return False


# 创建全局服务实例
minio_policy_service = MinIOPolicyService()
