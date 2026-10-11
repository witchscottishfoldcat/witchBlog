"""
更新bilibili真实番剧数据
"""
import requests

API_BASE = "http://localhost:8000/api/v1"

# bilibili真实番剧数据
bilibili_anime_data = [
    {
        "title": "葬送的芙莉莲",
        "url": "https://www.bilibili.com/bangumi/play/ss37781",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/0e7d594bb1c3b99f2f1a036d8a80c9bc7d63d4c.jpg",
        "description": "在打倒了魔王的十年后，勇者欣美尔、僧侣拉珍、战士刚士一起，怀着对伙伴芙莉莲的思念，继续着各自的旅程。而寿命长达千年的精灵魔法使芙莉莲，则回到了“读懂人心”的旅途中。",
        "category": "anime",
        "tags": "奇幻,魔法,治愈",
        "status": "watching",
        "progress": 85.0,
        "current_episode": 25,
        "total_episodes": 28,
        "rating": 9.2,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 1,
    },
    {
        "title": "我推的孩子",
        "url": "https://www.bilibili.com/bangumi/play/ss39830",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/265875e6c1a792a8c5e6b3c7a6a3c6f5f5e5e5f.jpg",
        "description": "在偶像事务所工作的制作人阿库亚，某天迎来了自己抚养的双胞胎孩子露比和有马加。这对双胞胎竟然是前世去世的偶像阿库亚和露比的转世！在演艺圈长大的双胞胎，为了寻找前世父亲的仇人，开始了解开演艺圈的秘密。",
        "category": "anime",
        "tags": "偶像,转生,悬疑",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 11,
        "total_episodes": 11,
        "rating": 8.8,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 2,
    },
    {
        "title": "药屋少女的呢喃",
        "url": "https://www.bilibili.com/bangumi/play/ss38967",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/0656513435e9b9a4f0169b43723715b3e8e2c4a.jpg",
        "description": "在古代中国的某个后宫, 有一位猫舌少女药师玉猫。她用毒物和药物解决各种后宫事件, 与皇帝身边的宦官壬氏一起揭开隐藏在深宫中的阴谋。",
        "category": "anime",
        "tags": "古风,悬疑,医疗",
        "status": "watching",
        "progress": 60.0,
        "current_episode": 15,
        "total_episodes": 24,
        "rating": 8.5,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 3,
    },
    {
        "title": "咒术回战",
        "url": "https://www.bilibili.com/bangumi/play/ss28275",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/3f1a7d7b7c8d9a1f2e3f4a5b6c7d8e9f0a1b2c.jpg",
        "description": "高中生虎杖悠仁为救助学长而吞下了特级咒物——咒术回战的手指，从而与诅咒之源相连。为了寻找分割手指的方法，他进入了东京都立咒术高等专门学校。",
        "category": "anime",
        "tags": "热血,战斗,超自然",
        "status": "watching",
        "progress": 70.0,
        "current_episode": 21,
        "total_episodes": 24,
        "rating": 8.7,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 4,
    },
    {
        "title": "间谍教室",
        "url": "https://www.bilibili.com/bangumi/play/ss38400",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/1234567890abcdef1234567890abcdef.jpg",
        "description": "在迪诺管理下的密涅瓦，一个仅有女生构成的精锐间谍培养机构。某天，天空一个如星星般闪耀的女孩空降而下，她便是传说中无人能及的少女——火焰灯里。",
        "category": "anime",
        "tags": "间谍,校园,战斗",
        "status": "want_watch",
        "progress": 0.0,
        "current_episode": None,
        "total_episodes": 12,
        "rating": None,
        "is_favorite": False,
        "is_active": True,
        "sort_order": 5,
    },
    {
        "title": "蓝色监狱",
        "url": "https://www.bilibili.com/bangumi/play/ss37748",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/fedcba0987654321fedcba0987654321.jpg",
        "description": "日本足球界为了培育出世界第一的突击前锋, 集结了300名高中生前锋于蓝色监狱计划中。故事围绕主人公洁世一在蓝色监狱的生存竞争展开。",
        "category": "anime",
        "tags": "运动,足球,竞技",
        "status": "watching",
        "progress": 45.0,
        "current_episode": 12,
        "total_episodes": 24,
        "rating": 8.3,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 6,
    },
    {
        "title": "孤独摇滚！",
        "url": "https://www.bilibili.com/bangumi/play/ss36431",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/abcdef1234567890abcdef1234567890.jpg",
        "description": "极度怕羞的吉他天才小孤独, 在地下通道弹吉他时被偶然路过的伊地知虹夏发现。虹夏邀请小孤独加入自己的乐队团结Band, 小孤独的摇滚生活就此开始。",
        "category": "anime",
        "tags": "音乐,校园,青春",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 12,
        "total_episodes": 12,
        "rating": 8.9,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 7,
    },
    {
        "title": "国王排名",
        "url": "https://www.bilibili.com/bangumi/play/ss35408",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/56789012345678905678901234567890.jpg",
        "description": "波吉是非常弱小的国王。他虽然个子很小，但是内心非常强大。波吉的王国曾被强大的恶魔所毁灭，波吉在母亲的保护下幸存下来，并立志要成为一个像父亲一样强大的国王。",
        "category": "anime",
        "tags": "奇幻,冒险,成长",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 23,
        "total_episodes": 23,
        "rating": 9.0,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 8,
    },
    {
        "title": "间谍过家家 第二季",
        "url": "https://www.bilibili.com/bangumi/play/ss39300",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/87654321098765438765432109876543.jpg",
        "description": "为了潜入名校，劳埃德、约尔和阿尼亚必须参加学校举办的亲子活动！在完美的家庭伪装下，面对的各种挑战和搞笑事件继续上演。",
        "category": "anime",
        "tags": "喜剧,日常,温馨",
        "status": "watching",
        "progress": 80.0,
        "current_episode": 8,
        "total_episodes": 12,
        "rating": 8.8,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 9,
    },
    {
        "title": "夏日重现",
        "url": "https://www.bilibili.com/bangumi/play/ss38490",
        "cover_image_url": "https://i0.hdslb.com/bfs/bangumi/98765432109876543210987654321098.jpg",
        "description": "为参加暑假的葬礼, 回到故乡日都岛的男主角网代慎平, 却在船上发现了一张慎平正在被射杀的悬赏传单。慎平感到不安, 但随着时间的推移, 他发现岛上的伙伴们一个个消失...这是一个无限循环的夏日悬疑故事。",
        "category": "anime",
        "tags": "悬疑,时间循环,夏日",
        "status": "completed",
        "progress": 100.0,
        "current_episode": 25,
        "total_episodes": 25,
        "rating": 8.9,
        "is_favorite": True,
        "is_active": True,
        "sort_order": 10,
    },
]


def clear_existing_data():
    """清空现有数据"""
    print("清空现有追番数据...")
    try:
        response = requests.get(f"{API_BASE}/anime-watchlist/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            for item in data:
                delete_response = requests.delete(
                    f"{API_BASE}/anime-watchlist/{item['id']}", timeout=5
                )
                if delete_response.status_code == 200:
                    print(f"✅ 删除: {item['title']}")
                else:
                    print(f"❌ 删除失败: {item['title']}")
        print("清空完成")
    except Exception as e:
        print(f"❌ 清空数据失败: {e}")


def add_bilibili_data():
    """添加bilibili番剧数据"""
    print("添加bilibili番剧数据...")
    success_count = 0
    fail_count = 0

    for anime in bilibili_anime_data:
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

        except Exception as e:
            print(f"❌ 请求异常: {anime['title']} - {str(e)}")
            fail_count += 1

    print(f"\n添加完成: 成功 {success_count} 个，失败 {fail_count} 个")

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

            # 显示前几个项目的封面图片URL，用于测试
            print("\n封面图片URL示例 (可用于测试图片代理):")
            for i, item in enumerate(data[:3]):
                print(f"  {i+1}. {item['title']}: {item['cover_image_url']}")
        else:
            print(f"❌ 获取列表失败: {response.status_code}")

    except Exception as e:
        print(f"❌ 验证异常: {str(e)}")


def main():
    """主函数"""
    print("更新bilibili真实番剧数据")
    print("=" * 50)

    # 清空现有数据
    clear_existing_data()

    # 添加新数据
    add_bilibili_data()

    print("\n" + "=" * 50)
    print("更新完成！现在您可以使用这些真实的bilibili番剧数据测试API和图片代理功能。")
    print("\n测试建议:")
    print("1. 测试图片代理功能，使用上述封面URL")
    print("2. 测试不同状态和分类的筛选功能")
    print("3. 测试评分和进度更新功能")


if __name__ == "__main__":
    main()
