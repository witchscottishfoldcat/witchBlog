"""
恢复追番测试数据的脚本
"""
import time

import requests

API_BASE = "http://localhost:8000/api/v1"

# 测试追番数据列表
test_anime_data = [
    {
        "title": "进击的巨人",
        "url": "https://example.com/attack-on-titan",
        "cover_image_url": "https://picsum.photos/seed/attack-on-titan/300/400.jpg",
        "description": "人类与巨人的生存之战，一部关于自由与希望的史诗",
        "category": "anime",
        "tags": "热血,战斗,悬疑",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 87,
        "total_episodes": 87,
        "rating": 9.0,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 1,
    },
    {
        "title": "鬼灭之刃",
        "url": "https://example.com/demon-slayer",
        "cover_image_url": "https://picsum.photos/seed/demon-slayer/300/400.jpg",
        "description": "大正时期，少年炭治郎为了让变成鬼的妹妹祢豆子变回人类而踏上旅途",
        "category": "anime",
        "tags": "热血,冒险,奇幻",
        "status": "watching",
        "progress": 75.0,
        "current_episode": 18,
        "total_episodes": 26,
        "rating": 8.5,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 2,
    },
    {
        "title": "间谍过家家",
        "url": "https://example.com/spy-family",
        "cover_image_url": "https://picsum.photos/seed/spy-family/300/400.jpg",
        "description": "间谍、杀手和超能力者组成的临时家庭，为了各自的目标而生活",
        "category": "anime",
        "tags": "喜剧,日常,温馨",
        "status": "watching",
        "progress": 40.0,
        "current_episode": 10,
        "total_episodes": 25,
        "rating": 8.8,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 3,
    },
    {
        "title": "中国奇谭",
        "url": "https://example.com/chinese-tales",
        "cover_image_url": "https://picsum.photos/seed/chinese-tales/300/400.jpg",
        "description": "中国动画短片集，展现中国传统文化的现代诠释",
        "category": "anime",
        "tags": "国产,传统文化,短片",
        "status": "want_watch",
        "progress": 0.0,
        "current_episode": None,
        "total_episodes": 8,
        "rating": None,
        "is_favorite": False,
        "is_active": True,
        "sort_order": 4,
    },
    {
        "title": "三体",
        "url": "https://example.com/three-body-problem",
        "cover_image_url": "https://picsum.photos/seed/three-body/300/400.jpg",
        "description": "刘慈欣科幻巨著改编，讲述地球文明与三体文明的宇宙史诗",
        "category": "drama",
        "tags": "科幻,剧情,Netflix",
        "status": "want_watch",
        "progress": 0.0,
        "current_episode": None,
        "total_episodes": 30,
        "rating": None,
        "is_favorite": False,
        "is_active": True,
        "sort_order": 5,
    },
    {
        "title": "怪奇物语",
        "url": "https://example.com/stranger-things",
        "cover_image_url": "https://picsum.photos/seed/stranger-things/300/400.jpg",
        "description": "1980年代小镇，神秘力量与一群孩子们的冒险故事",
        "category": "drama",
        "tags": "科幻,悬疑,惊悚",
        "status": "watching",
        "progress": 60.0,
        "current_episode": 6,
        "total_episodes": 10,
        "rating": 8.7,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 6,
    },
    {
        "title": "星际牛仔",
        "url": "https://example.com/cowboy-bebop",
        "cover_image_url": "https://picsum.photos/seed/cowboy-bebop/300/400.jpg",
        "description": "未来宇宙中的赏金猎人们，追寻各自过去的经典之作",
        "category": "anime",
        "tags": "经典,科幻,爵士",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 26,
        "total_episodes": 26,
        "rating": 9.2,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 7,
    },
    {
        "title": "琅琊榜",
        "url": "https://example.com/nirvana-in-fire",
        "cover_image_url": "https://picsum.photos/seed/nirvana-in-fire/300/400.jpg",
        "description": "架空历史背景下，才子梅长苏为家族冤案平反复仇的传奇故事",
        "category": "drama",
        "tags": "古装,权谋,复仇",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 54,
        "total_episodes": 54,
        "rating": 9.5,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 8,
    },
    {
        "title": "海贼王",
        "url": "https://example.com/one-piece",
        "cover_image_url": "https://picsum.photos/seed/one-piece/300/400.jpg",
        "description": "路飞和他的伙伴们寻找传说中的大秘宝ONE PIECE的冒险故事",
        "category": "anime",
        "tags": "热血,冒险,友情",
        "status": "watching",
        "progress": 30.0,
        "current_episode": 300,
        "total_episodes": 1000,
        "rating": 9.0,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 9,
    },
    {
        "title": "庆余年",
        "url": "https://example.com/joy-of-life",
        "cover_image_url": "https://picsum.photos/seed/joy-of-life/300/400.jpg",
        "description": "现代人范闲穿越到古代，凭借现代知识在古代朝堂中游刃有余",
        "category": "drama",
        "tags": "古装,穿越,权谋",
        "status": "watching",
        "progress": 50.0,
        "current_episode": 23,
        "total_episodes": 46,
        "rating": 8.8,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 10,
    },
]


def restore_anime_data():
    """恢复追番测试数据"""
    print("开始恢复追番测试数据...")
    success_count = 0
    fail_count = 0

    for i, anime in enumerate(test_anime_data):
        try:
            response = requests.post(
                f"{API_BASE}/anime-watchlist/", json=anime, timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ 成功创建: {anime['title']} (ID: {data.get('id')})")
                success_count += 1
            else:
                print(
                    f"❌ 创建失败: {anime['title']} - {response.status_code} - {response.text}"
                )
                fail_count += 1

            # 避免请求过快
            time.sleep(0.1)

        except Exception as e:
            print(f"❌ 请求异常: {anime['title']} - {str(e)}")
            fail_count += 1

    print(f"\n恢复完成: 成功 {success_count} 个，失败 {fail_count} 个")

    # 验证数据
    try:
        response = requests.get(f"{API_BASE}/anime-watchlist/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"\n当前追番列表总数: {len(data)}")

            # 统计各状态数量
            status_count = {}
            category_count = {}

            for item in data:
                status = item.get("status", "unknown")
                category = item.get("category", "unknown")

                status_count[status] = status_count.get(status, 0) + 1
                category_count[category] = category_count.get(category, 0) + 1

            print("\n状态统计:")
            for status, count in status_count.items():
                print(f"  {status}: {count}")

            print("\n分类统计:")
            for category, count in category_count.items():
                print(f"  {category}: {count}")
        else:
            print(f"❌ 获取列表失败: {response.status_code}")

    except Exception as e:
        print(f"❌ 验证异常: {str(e)}")


if __name__ == "__main__":
    restore_anime_data()
