"""对象存储路径前缀、代理 URL 与上传参数的唯一权威定义。

新增存储目录时只需在此登记：桶策略（minio_policy_service）、
OSS 代理白名单（proxy / image_cache_service）与各业务模块的
对象名拼接统一引用本模块，避免同一前缀散落多处导致漏改
（历史上桶策略与代理白名单各维护一份，曾把 md_files 误公开）。
"""

# —— 对象存储目录前缀 ——
MD_FILES_PREFIX = "md_files/"
ALBUMS_PREFIX = "albums/"
SITE_IMAGES_PREFIX = "site_images/"
LINK_IMAGES_PREFIX = "link-images/"
ANIME_COVERS_PREFIX = "anime-covers/"
ANIME_POSTERS_PREFIX = "anime-posters/"
AVATAR_PREFIX = "avatar/"
ABOUT_PREFIX = "about/"
DIARY_IMAGES_PREFIX = "diary-images/"
DIARY_IMAGES_V2_PREFIX = "diary-imagesV2/"

# OSS 代理允许读取的前缀白名单（防止任意读取桶内对象）
PROXY_ALLOWED_PREFIXES = (
    DIARY_IMAGES_V2_PREFIX,
    LINK_IMAGES_PREFIX,
    ANIME_COVERS_PREFIX,
    MD_FILES_PREFIX,
    SITE_IMAGES_PREFIX,
    ABOUT_PREFIX,
    ALBUMS_PREFIX,
)

# 需要按数据库记录做访问控制的前缀（匿名仅可访问公开记录，
# 私有对象仅 owner / 超级管理员可读）
ACCESS_CONTROLLED_PREFIXES = (MD_FILES_PREFIX, ALBUMS_PREFIX)

# 桶策略中允许匿名公开读的前缀。注意不含 MD_FILES_PREFIX：
# MD 文件公开/私有由数据库 is_public 控制，经代理记录级鉴权访问
PUBLIC_READ_PREFIXES = (
    SITE_IMAGES_PREFIX,
    LINK_IMAGES_PREFIX,
    ANIME_COVERS_PREFIX,
    ABOUT_PREFIX,
    DIARY_IMAGES_PREFIX,
    DIARY_IMAGES_V2_PREFIX,
    ANIME_POSTERS_PREFIX,
    AVATAR_PREFIX,
)

# —— 代理 URL ——
MD_PROXY_URL_PREFIX = "/api/proxy/md/"

# —— 上传参数 ——
UPLOAD_PART_SIZE = 10 * 1024 * 1024
