"""IP 归属地服务单元测试

覆盖：归属地字符串归一化、内网/环回地址分类、库缺失降级、真实库解析、省份分桶。
"""
import pytest

from app.services.ip_location import (
    CHINA_COUNTRY,
    LOCAL_NETWORK,
    OVERSEAS_LOCATION,
    UNKNOWN_LOCATION,
    IpLocationService,
    split_province,
    to_country_bucket,
    to_province_bucket,
)


class TestProvinceBucket:
    """归属地 → 省份聚合桶（地图分布用）"""

    def test_domestic_province_with_city(self):
        assert split_province("江苏 南京") == "江苏"

    def test_municipality_without_city(self):
        assert split_province("北京") == "北京"

    def test_autonomous_region(self):
        assert split_province("内蒙古 呼和浩特") == "内蒙古"

    def test_overseas_returns_none(self):
        assert split_province("美国") is None

    def test_unknown_and_local_return_none(self):
        assert split_province(UNKNOWN_LOCATION) is None
        assert split_province(LOCAL_NETWORK) is None
        assert split_province("") is None

    def test_bucket_keeps_local_and_unknown(self):
        assert to_province_bucket(LOCAL_NETWORK) == LOCAL_NETWORK
        assert to_province_bucket(UNKNOWN_LOCATION) == UNKNOWN_LOCATION

    def test_bucket_merges_overseas(self):
        assert to_province_bucket("美国") == OVERSEAS_LOCATION
        assert to_province_bucket("亚太地区") == OVERSEAS_LOCATION

    def test_bucket_domestic_passthrough(self):
        assert to_province_bucket("浙江 杭州") == "浙江"


class TestCountryBucket:
    """归属地 → 国家聚合桶（世界地图分布用）"""

    def test_domestic_locations_merge_into_china(self):
        assert to_country_bucket("江苏 南京") == CHINA_COUNTRY
        assert to_country_bucket("北京") == CHINA_COUNTRY
        assert to_country_bucket("台湾") == CHINA_COUNTRY

    def test_overseas_keeps_country_name(self):
        assert to_country_bucket("美国") == "美国"
        assert to_country_bucket("德国") == "德国"

    def test_local_and_unknown_preserved(self):
        assert to_country_bucket(LOCAL_NETWORK) == LOCAL_NETWORK
        assert to_country_bucket(UNKNOWN_LOCATION) == UNKNOWN_LOCATION
        assert to_country_bucket("") == UNKNOWN_LOCATION


class TestNormalize:
    """metowolf 版纯真库返回「国家–省份–城市」（en-dash 分隔），归一化为展示用简称"""

    def test_domestic_province_city(self):
        assert IpLocationService._normalize("中国–江苏–南京") == "江苏 南京"

    def test_domestic_province_city_same_name(self):
        # 直辖市省市同名，去重只保留一个
        assert IpLocationService._normalize("中国–北京–北京") == "北京"

    def test_domestic_province_only(self):
        assert IpLocationService._normalize("中国–浙江") == "浙江"

    def test_foreign_keeps_country(self):
        assert IpLocationService._normalize("美国–加利福尼亚州–圣克拉拉–山景城") == "美国"

    def test_empty_string(self):
        assert IpLocationService._normalize("") == UNKNOWN_LOCATION

    def test_separator_variant_ascii_dash(self):
        # 兼容部分数据源使用 ASCII 连字符
        assert IpLocationService._normalize("中国-广东-深圳") == "广东 深圳"


class TestLookup:
    def test_loopback_is_local_network(self):
        service = IpLocationService(dat_path="data/nonexistent.dat")
        assert service.lookup("127.0.0.1") == LOCAL_NETWORK

    def test_private_ip_is_local_network(self):
        service = IpLocationService(dat_path="data/nonexistent.dat")
        for ip in ("10.0.0.5", "192.168.1.100", "172.16.8.8", "::1"):
            assert service.lookup(ip) == LOCAL_NETWORK

    def test_invalid_ip_is_unknown(self):
        service = IpLocationService(dat_path="data/nonexistent.dat")
        assert service.lookup("not-an-ip") == UNKNOWN_LOCATION
        assert service.lookup("") == UNKNOWN_LOCATION

    def test_missing_dat_degrades_to_unknown(self):
        # 库文件缺失时不得抛异常，统一降级为「未知」
        service = IpLocationService(dat_path="data/nonexistent.dat")
        assert service.lookup("114.114.114.114") == UNKNOWN_LOCATION

    def test_cache_returns_same_result(self):
        service = IpLocationService(dat_path="data/nonexistent.dat")
        first = service.lookup("8.8.8.8")
        second = service.lookup("8.8.8.8")
        assert first == second == UNKNOWN_LOCATION
        assert "8.8.8.8" in service._cache


@pytest.mark.skipif(
    not __import__("os").path.exists("data/qqwry.dat"),
    reason="本地无 qqwry.dat 数据文件",
)
class TestLookupWithRealLibrary:
    def test_public_ip_resolves_location(self):
        service = IpLocationService(dat_path="data/qqwry.dat")
        location = service.lookup("114.114.114.114")
        assert location not in (UNKNOWN_LOCATION, LOCAL_NETWORK)
        assert "江苏" in location

    def test_lookup_is_repeatable_and_cached(self):
        service = IpLocationService(dat_path="data/qqwry.dat")
        assert service.lookup("114.114.114.114") == service.lookup("114.114.114.114")
