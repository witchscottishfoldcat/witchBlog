"""
测试站点统计API
"""
import time

import requests

# API 基础URL
BASE_URL = "http://127.0.0.1:8000"


def test_site_stats():
    """测试站点统计API"""
    print("开始测试站点统计API...")

    # 1. 先发送一些请求，增加统计数据
    print("\n1. 发送一些请求...")
    endpoints = ["/", "/api/v1/albums/", "/docs", "/health"]

    for endpoint in endpoints:
        for _ in range(3):  # 每个端点请求3次
            try:
                response = requests.get(f"{BASE_URL}{endpoint}")
                print(f"   请求 {endpoint}: {response.status_code}")
                time.sleep(0.1)  # 短暂延迟
            except Exception as e:
                print(f"   请求 {endpoint} 失败: {e}")

    # 2. 获取基本站点统计
    print("\n2. 获取基本站点统计...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/site-stats/")
        if response.status_code == 200:
            stats = response.json()
            print("✅ 基本统计获取成功:")
            print(f"   运行时间: {stats['uptime_days']} 天 {stats['uptime_hours']} 小时")
            print(f"   启动时间: {stats['start_time']}")
            print(f"   总请求数: {stats['total_requests']}")
            print(f"   今日请求数: {stats['today_requests']}")
            print(f"   总访问者: {stats['total_visitors']}")
            print(f"   今日访问者: {stats['today_visitors']}")
            print(f"   平均每日请求数: {stats['average_requests_per_day']}")
            print(f"   热门页面: {stats['top_pages']}")
            print(f"   相册数量: {stats['album_count']}")
            print(f"   照片数量: {stats['photo_count']}")
            print(f"   日记数量: {stats['diary_count']}")
            print(f"   内存使用: {stats['memory_usage_mb']} MB")
            print(f"   数据库连接数: {stats['db_connections']}")
        else:
            print(f"❌ 获取基本统计失败: {response.status_code}")
            print(f"   响应内容: {response.text}")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

    # 3. 获取详细统计
    print("\n3. 获取详细统计...")
    for period in ["7days", "30days"]:
        try:
            response = requests.get(
                f"{BASE_URL}/api/v1/site-stats/detailed?period={period}"
            )
            if response.status_code == 200:
                detailed_stats = response.json()
                print(f"✅ {period} 详细统计获取成功:")
                print(f"   统计周期: {detailed_stats['period']}")
                print(f"   开始日期: {detailed_stats['start_date']}")
                print(f"   结束日期: {detailed_stats['end_date']}")
                print(f"   每日请求数据点数: {len(detailed_stats['requests_by_day'])}")
                print(f"   每日访问者数据点数: {len(detailed_stats['visitors_by_day'])}")
                print(f"   热门页面数: {len(detailed_stats['popular_pages'])}")
                print(f"   来源网站数: {len(detailed_stats['referrers'])}")

                # 显示前几天的数据
                if detailed_stats["requests_by_day"]:
                    print("   前3天请求数据:")
                    for day_data in detailed_stats["requests_by_day"][:3]:
                        print(f"     {day_data['date']}: {day_data['requests']} 次请求")

                # 显示热门页面
                if detailed_stats["popular_pages"]:
                    print("   前3个热门页面:")
                    for page_data in detailed_stats["popular_pages"][:3]:
                        print(f"     {page_data['path']}: {page_data['visits']} 次访问")
            else:
                print(f"❌ 获取 {period} 详细统计失败: {response.status_code}")
        except Exception as e:
            print(f"❌ 请求失败: {e}")

    print("\n测试完成！")


if __name__ == "__main__":
    test_site_stats()
