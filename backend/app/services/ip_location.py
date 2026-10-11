"""IP 归属地查询服务：基于离线纯真 IP 库（qqwry.dat）解析访客 IP 的地理归属。

数据文件来自 metowolf/qqwry.dat 镜像（国家–省份–城市，en-dash 分隔），
路径由 settings.QQWRY_DAT_PATH 配置。查询结果进程内缓存；库文件缺失或
损坏时降级为「未知」，不影响统计主流程。纯真库仅支持 IPv4 查询。
"""
import ipaddress
import threading
from typing import TYPE_CHECKING, Dict, Optional, Set

from app.core.config import settings

if TYPE_CHECKING:
    from qqwry import QQwry
from app.core.unified_logging import get_logger

logger = get_logger(__name__)

UNKNOWN_LOCATION = "未知"
LOCAL_NETWORK = "本地网络"
OVERSEAS_LOCATION = "海外"
CHINA_COUNTRY = "中国"

# 中国省级行政区短名（地图分布聚合口径，与归一化输出的省份短名一致）
CHINA_PROVINCES: Set[str] = {
    "北京",
    "天津",
    "河北",
    "山西",
    "内蒙古",
    "辽宁",
    "吉林",
    "黑龙江",
    "上海",
    "江苏",
    "浙江",
    "安徽",
    "福建",
    "江西",
    "山东",
    "河南",
    "湖北",
    "湖南",
    "广东",
    "广西",
    "海南",
    "重庆",
    "四川",
    "贵州",
    "云南",
    "西藏",
    "陕西",
    "甘肃",
    "青海",
    "宁夏",
    "新疆",
    "香港",
    "澳门",
    "台湾",
}

# 归属地缓存上限：超过后整体清空重建（访客 IP 量级远小于此值，简单策略足够）
_LOCATION_CACHE_MAX = 10_000


def split_province(location: str) -> Optional[str]:
    """国内归属地返回省份短名（如「江苏 南京」→「江苏」），非省级归属（海外/未知/本地）返回 None"""
    first = location.split(" ")[0] if location else ""
    return first if first in CHINA_PROVINCES else None


def to_province_bucket(location: str) -> str:
    """归属地 → 地图聚合桶：国内为省份短名；本地网络/未知保持原样；其余归「海外」"""
    province = split_province(location)
    if province:
        return province
    if location in (LOCAL_NETWORK, UNKNOWN_LOCATION):
        return location
    return OVERSEAS_LOCATION


def to_country_bucket(location: str) -> str:
    """归属地 → 国家维度聚合桶：国内（含省/市/港澳台）统一为「中国」；
    国外保持中文国家名（qqwry 归一化后即国家名）；本地网络/未知/空值归「未知」或原样"""
    if split_province(location):
        return CHINA_COUNTRY
    if not location or location == UNKNOWN_LOCATION:
        return UNKNOWN_LOCATION
    return location


class IpLocationService:
    """离线 IP 归属地查询（线程安全；单例由 get_ip_location_service 提供）"""

    def __init__(self, dat_path: str):
        self._dat_path = dat_path
        self._library: "Optional[QQwry]" = None
        self._load_failed = False
        self._cache: Dict[str, str] = {}
        self._lock = threading.Lock()

    def lookup(self, ip: str) -> str:
        """返回归属地描述，如「江苏 南京」「美国」「本地网络」；无法解析返回「未知」"""
        if not ip:
            return UNKNOWN_LOCATION
        cached = self._cache.get(ip)
        if cached is not None:
            return cached
        location = self._resolve(ip)
        self._remember(ip, location)
        return location

    def _resolve(self, ip: str) -> str:
        try:
            parsed = ipaddress.ip_address(ip)
        except ValueError:
            return UNKNOWN_LOCATION
        # 内网/环回/CGNAT 地址没有公开归属地，单独归类
        if parsed.is_private:
            return LOCAL_NETWORK
        library = self._get_library()
        if library is None:
            return UNKNOWN_LOCATION
        try:
            result = library.lookup(ip)
        except Exception:
            return UNKNOWN_LOCATION
        if not result:
            return UNKNOWN_LOCATION
        return self._normalize(result[0])

    @staticmethod
    def _normalize(region: str) -> str:
        """归一化「国家–省份–城市」为展示用简称：国内取「省份 城市」（省市同名去重），国外只保留国家"""
        if not region:
            return UNKNOWN_LOCATION
        parts = [p.strip() for p in region.replace("-", "–").split("–") if p.strip()]
        if not parts:
            return UNKNOWN_LOCATION
        if parts[0] != "中国":
            return parts[0]
        if len(parts) == 1:
            return parts[0]
        province = parts[1]
        city = parts[2] if len(parts) > 2 else ""
        if city and city != province:
            return f"{province} {city}"
        return province

    def _get_library(self):
        """惰性加载纯真库；失败只告警一次，后续查询直接走降级"""
        if self._library is not None:
            return self._library
        if self._load_failed:
            return None
        with self._lock:
            if self._library is not None or self._load_failed:
                return self._library
            try:
                from qqwry import QQwry

                library = QQwry()
                if not library.load_file(self._dat_path):
                    raise OSError(f"load_file 返回 False: {self._dat_path}")
                self._library = library
                logger.info(f"纯真 IP 库加载成功: {self._dat_path}")
                return self._library
            except Exception as e:
                self._load_failed = True
                logger.warning(f"纯真 IP 库加载失败，IP 归属地降级为「未知」: {e}")
                return None

    def _remember(self, ip: str, location: str) -> None:
        with self._lock:
            if len(self._cache) >= _LOCATION_CACHE_MAX:
                self._cache.clear()
            self._cache[ip] = location


_ip_location_service: Optional[IpLocationService] = None


def get_ip_location_service() -> IpLocationService:
    """获取 IP 归属地查询服务单例"""
    global _ip_location_service
    if _ip_location_service is None:
        _ip_location_service = IpLocationService(settings.QQWRY_DAT_PATH)
    return _ip_location_service
