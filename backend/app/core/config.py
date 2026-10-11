import json
import os
import secrets
from typing import Any, Dict, List, Optional, Union
from zoneinfo import ZoneInfo

from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings


def _resolve_env_file() -> str:
    """
    解析当前应加载的环境文件。

    - 显式 ENV_FILE 优先
    - 本地存在 .env.local 时优先（开发机 SSH 映射）
    - 否则使用 .env（服务器 / Jenkins）

    Jenkins 通过 docker --env-file ".env" 注入真实环境变量；
    load_dotenv 不会覆盖已有变量，因此服务器行为不受 .env.local 逻辑影响。
    """
    explicit = os.getenv("ENV_FILE")
    if explicit:
        return explicit
    if os.path.isfile(".env.local"):
        return ".env.local"
    return ".env"


# 模块加载时解析一次，保证 load_dotenv 与 pydantic env_file 一致
_ENV_FILE = _resolve_env_file()
_ENV_LOADED = False


def _load_env_file_once() -> None:
    """
    在 Pydantic Settings 之前先把指定 env 文件注入进程环境变量，
    使 os.getenv() 也能读到配置（仅本地直接运行有意义；
    容器/CI 通常已通过 --env-file 注入真实环境变量，此处为幂等操作）。
    """
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    # python-dotenv 的 load_dotenv 只把不存在的 key 写入 os.environ，不会覆盖
    # 已有的真实环境变量，因此对 docker run --env-file 场景安全。
    try:
        from dotenv import load_dotenv

        load_dotenv(_ENV_FILE)
        _ENV_LOADED = True
    except ImportError:
        # 依赖未安装时不影响：退化为只读真实环境变量（与原行为一致）
        _ENV_LOADED = True


def _get_secret_key() -> str:
    """
    获取JWT密钥。
    优先从环境变量读取；若未设置，开发环境自动生成随机密钥并警告，
    生产环境必须显式提供，否则启动失败。
    """
    # 关键：必须在 os.getenv 之前加载 .env，否则本地直接运行时
    # 进程环境变量里没有 SECRET_KEY，会误报“未设置”。
    _load_env_file_once()

    env_key = os.getenv("SECRET_KEY", "")
    if env_key and not env_key.startswith("your-"):
        return env_key

    env = os.getenv("ENVIRONMENT", "production").lower()
    if env == "production":
        raise ValueError(
            "SECRET_KEY must be set via environment variable in production. "
            "Generate one with: "
            'python -c "import secrets; print(secrets.token_urlsafe(32))"'
        )

    # 开发/测试环境：生成临时随机密钥（每次重启会变，旧token失效）
    import warnings

    warnings.warn(
        "SECRET_KEY not set or is a placeholder. "
        "A random temporary key has been generated for development. "
        "Set SECRET_KEY environment variable for stable sessions.",
        RuntimeWarning,
        stacklevel=2,
    )
    return secrets.token_urlsafe(32)


class BaseConfig(BaseSettings):
    """基础配置类，包含所有环境的通用配置"""

    # 项目基础配置
    PROJECT_NAME: str = "WitchCat Enterprise API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    # 不再使用硬编码弱默认值，由 _get_secret_key 动态提供
    SECRET_KEY: str = _get_secret_key()

    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    # 后端对外可访问的基础地址，用于拼接代理URL（隐藏OSS直链地址）
    # 部署时必须设置，例如 http://your-domain.com 或 http://1.2.3.4:8000
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "")

    # 前台站点（Next.js）地址与缓存刷新密钥：后台保存站点配置后，
    # 由后端代为调用前台的 POST /api/site-config/revalidate 立即清缓存。
    # 密钥须与前台的 REVALIDATE_SECRET 一致；两者任一留空视为未接入，
    # 刷新接口会明确报错而非静默失败。密钥只保存在服务端，禁止下发到前端。
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "")
    FRONTEND_REVALIDATE_SECRET: str = os.getenv("FRONTEND_REVALIDATE_SECRET", "")

    # 纯真 IP 离线库（qqwry.dat）路径：访客统计的 IP 归属地解析用。
    # 文件缺失时归属地降级为「未知」，不影响统计主流程。
    QQWRY_DAT_PATH: str = os.getenv("QQWRY_DAT_PATH", "data/qqwry.dat")
    # 访客统计额外排除的 IP（逗号分隔）：内部监控、测试客户端等非真实游客流量
    VISITOR_EXCLUDED_IPS: str = os.getenv("VISITOR_EXCLUDED_IPS", "")
    # SSRF 防护放行 198.18.0.0/15（Clash 等代理 fake-ip 模式的解析结果）。
    # 仅限本地开发显式开启（=1），生产/CI 保持默认关闭。
    SSRF_ALLOW_BENCHMARK_IPS: str = os.getenv("SSRF_ALLOW_BENCHMARK_IPS", "0")

    # 数据库配置
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "witchcat"

    # MySQL配置（从环境变量读取，无默认值）
    MYSQL_SERVER: str = os.getenv("MYSQL_SERVER", "localhost")
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "witchcat")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str) and v.strip():
            return v
        # 从环境变量构建数据库URL
        password = values.get("MYSQL_PASSWORD", "")
        if not password:
            # 开发/测试环境允许空密码，生产环境在启动时检查
            env = os.getenv("ENVIRONMENT", "production").lower()
            if env == "production":
                raise ValueError(
                    "MYSQL_PASSWORD must be set via environment variable in production"
                )
        return (
            f"mysql+pymysql://{values.get('MYSQL_USER', 'root')}:{password}"
            f"@{values.get('MYSQL_SERVER', 'localhost')}"
            f"/{values.get('MYSQL_DB', 'witchcat')}"
        )

    # Redis配置
    REDIS_URL: str = "redis://localhost:6379"

    # JWT配置
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 hours
    # 刷新令牌有效期（天）：访问令牌过期后用它换取新令牌，无需重新登录
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    ALGORITHM: str = "HS256"

    # CORS配置
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        elif isinstance(v, str) and v.startswith("["):
            # 处理JSON格式的字符串
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError(v)
        raise ValueError(v)

    # 环境配置
    # Fail closed: local development must explicitly opt in via ENVIRONMENT=development.
    ENVIRONMENT: str = "production"

    # 可信反向代理跳数：0=直连（只信传输层地址，默认）；1=部署在一层 nginx/CDN 后
    # （取 X-Forwarded-From 右起第 1 跳）。限流、统计、日志共用此口径。
    TRUSTED_PROXY_HOPS: int = 0

    # 注册开关：个人博客默认关闭自助注册，需要时通过环境变量显式开启
    ENABLE_OPEN_REGISTRATION: bool = False

    # AI 接口限流（每用户每分钟次数 / 每用户每日总量），防止付费 API Key 被盗刷
    AI_RATE_LIMIT_PER_MINUTE: int = 5
    AI_DAILY_QUOTA_PER_USER: int = 50

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "logs/app.log"

    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".txt", ".pdf", ".doc", ".docx"]

    @validator("ALLOWED_EXTENSIONS", pre=True)
    def assemble_allowed_extensions(
        cls, v: Union[str, List[str]]
    ) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        elif isinstance(v, str) and v.startswith("["):
            # 处理JSON格式的字符串
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError(v)
        raise ValueError(v)

    # 邮件配置
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # 缓存配置
    CACHE_TTL: int = 3600  # 1 hour

    # 限流配置
    RATE_LIMIT_PER_MINUTE: int = 60

    # 监控配置
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090

    # 定时任务时区：cron 触发时间按该时区解释
    # （容器基础镜像默认 UTC，不配置会让"凌晨 3 点"的任务跑在北京时间中午）
    SCHEDULER_TIMEZONE: str = os.getenv("SCHEDULER_TIMEZONE", "Asia/Shanghai")

    @validator("SCHEDULER_TIMEZONE")
    def validate_scheduler_timezone(cls, v: str) -> str:
        """启动即校验：无效时区名直接失败，避免 cron 任务协程静默死亡"""
        try:
            ZoneInfo(v)
        except Exception as e:
            raise ValueError(
                f"SCHEDULER_TIMEZONE 无效: {v!r}，需为 IANA 时区名（如 Asia/Shanghai）"
            ) from e
        return v

    # MinIO配置（从环境变量读取）
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    MINIO_BUCKET_NAME: str = os.getenv("MINIO_BUCKET_NAME", "witchcat-files")

    # AI模型配置
    AI_DEFAULT_PROVIDER: str = os.getenv("AI_DEFAULT_PROVIDER", "glm")

    # GLM配置（从环境变量读取）
    GLM_API_KEY: str = os.getenv("GLM_API_KEY", "")
    GLM_API_URL: str = os.getenv(
        "GLM_API_URL", "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    )
    GLM_MODEL: str = os.getenv("GLM_MODEL", "GLM-4.6V-Flash")
    GLM_TIMEOUT: int = int(os.getenv("GLM_TIMEOUT", "60"))

    # DeepSeek配置（预留）
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_API_URL: str = os.getenv(
        "DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions"
    )
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_TIMEOUT: int = int(os.getenv("DEEPSEEK_TIMEOUT", "60"))

    # Kimi配置（预留）
    KIMI_API_KEY: str = os.getenv("KIMI_API_KEY", "")
    KIMI_API_URL: str = os.getenv(
        "KIMI_API_URL", "https://api.moonshot.cn/v1/chat/completions"
    )
    KIMI_MODEL: str = os.getenv("KIMI_MODEL", "moonshot-v1-8k")
    KIMI_TIMEOUT: int = int(os.getenv("KIMI_TIMEOUT", "60"))

    # 网易云音乐API配置
    NETEASE_API_BASE: str = "http://localhost:3000"
    NETEASE_API_TIMEOUT: int = 30

    # Steam API配置（从 .env 文件中读取）
    STEAM_API_KEY: str = ""
    STEAM_DEFAULT_USER_ID: str = ""

    # 基类安全默认值，子类按环境覆盖；main.py 的 settings.DEBUG 消费依赖基类类型上存在该属性
    DEBUG: bool = False

    class Config:
        case_sensitive = True
        # .env.local（本地开发）优先，否则 .env（服务器）；可用 ENV_FILE 覆盖
        env_file = _ENV_FILE


class DevelopmentConfig(BaseConfig):
    """开发环境配置"""

    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"
    ENABLE_METRICS: bool = False
    ENVIRONMENT: str = "development"


class TestingConfig(BaseConfig):
    """测试环境配置"""

    DEBUG: bool = False
    LOG_LEVEL: str = "WARNING"
    ENABLE_METRICS: bool = False
    ENVIRONMENT: str = "testing"
    MYSQL_DB: str = os.getenv("MYSQL_DB_TEST", "witchcat_test")
    DATABASE_URL: str = os.getenv("DATABASE_URL_TEST", "")
    MINIO_BUCKET_NAME: str = os.getenv("MINIO_BUCKET_NAME_TEST", "witchcat-test-files")
    REDIS_URL: str = os.getenv("REDIS_URL_TEST", "redis://localhost:6379/1")


class ProductionConfig(BaseConfig):
    """生产环境配置"""

    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True
    ENVIRONMENT: str = "production"

    class Config:
        case_sensitive = True
        env_file = _ENV_FILE
        # 生产环境必须从环境变量加载敏感配置
        secrets_file = ".env.prod"


class ConfigFactory:
    """配置工厂类，根据环境变量返回对应的配置类实例"""

    @staticmethod
    def get_config() -> BaseConfig:
        """
        根据ENVIRONMENT环境变量返回对应的配置实例
        未设置时默认生产配置，避免意外公开调试端点和异常堆栈。
        """
        env = os.getenv("ENVIRONMENT", "production").lower()

        if env == "production":
            return ProductionConfig()
        elif env == "testing":
            return TestingConfig()
        elif env == "development":
            return DevelopmentConfig()
        raise ValueError("ENVIRONMENT must be one of: production, development, testing")

    @staticmethod
    def get_settings() -> BaseConfig:
        """获取配置实例的别名方法，保持向后兼容"""
        return ConfigFactory.get_config()


# 全局配置实例，根据当前环境自动创建
settings = ConfigFactory.get_settings()
