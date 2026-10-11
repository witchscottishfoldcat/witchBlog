import requests

# 基础URL
BASE_URL = "http://localhost:8001/api/v1/links"


def test_links_api():
    """测试链接API"""

    # 创建测试数据
    test_links = [
        {
            "name": "示例站点",
            "url": "https://example.com",
            "description": "一个专注于技术分享的博客网站",
            "image_url": "https://example.com/logo.png",
            "tags": "技术,博客,前端",
            "category": "friend",
            "sort_order": 10,
        },
        {
            "name": "Vue.js教程视频",
            "url": "https://example.com/vue-tutorial",
            "description": "Vue.js入门到精通视频教程",
            "image_url": "https://example.com/vue-cover.jpg",
            "tags": "Vue,前端,视频教程",
            "category": "video",
            "sort_order": 5,
        },
        {
            "name": "React官方文档",
            "url": "https://react.dev",
            "description": "React官方文档",
            "image_url": "https://react.dev/logo.png",
            "tags": "React,前端,文档",
            "category": "friend",
            "sort_order": 15,
        },
    ]

    print("=== 测试链接API ===")

    # 1. 创建链接
    print("\n1. 创建链接")
    created_links = []
    for link_data in test_links:
        try:
            response = requests.post(BASE_URL, json=link_data)
            if response.status_code == 200:
                created_link = response.json()
                created_links.append(created_link)
                print(f"✅ 成功创建链接: {created_link['name']} (ID: {created_link['id']})")
            else:
                print(
                    f"❌ 创建链接失败: {link_data['name']}, 状态码: {response.status_code}, 错误: {response.text}"  # noqa: E501
                )
        except Exception as e:
            print(f"❌ 创建链接异常: {link_data['name']}, 错误: {str(e)}")

    # 2. 获取所有链接
    print("\n2. 获取所有链接")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            all_links = response.json()
            print(f"✅ 成功获取所有链接，共 {len(all_links)} 个")
            for link in all_links:
                print(f"   - {link['name']} ({link['category']})")
        else:
            print(f"❌ 获取链接列表失败，状态码: {response.status_code}, 错误: {response.text}")
    except Exception as e:
        print(f"❌ 获取链接列表异常: {str(e)}")

    # 3. 按分类获取链接
    print("\n3. 按分类获取链接")
    for category in ["friend", "video"]:
        try:
            response = requests.get(f"{BASE_URL}?category={category}")
            if response.status_code == 200:
                links = response.json()
                print(f"✅ 成功获取 {category} 类链接，共 {len(links)} 个")
                for link in links:
                    print(f"   - {link['name']} (标签: {link['tags']})")
            else:
                print(f"❌ 获取 {category} 类链接失败，状态码: {response.status_code}")
        except Exception as e:
            print(f"❌ 获取 {category} 类链接异常: {str(e)}")

    # 4. 获取分类统计
    print("\n4. 获取分类统计")
    try:
        response = requests.get(f"{BASE_URL}/categories/stats")
        if response.status_code == 200:
            stats = response.json()
            print("✅ 成功获取分类统计:")
            for stat in stats:
                print(f"   - {stat['category']}: {stat['count']} 个")
        else:
            print(f"❌ 获取分类统计失败，状态码: {response.status_code}")
    except Exception as e:
        print(f"❌ 获取分类统计异常: {str(e)}")

    # 5. 获取所有标签
    print("\n5. 获取所有标签")
    try:
        response = requests.get(f"{BASE_URL}/tags/all")
        if response.status_code == 200:
            tags = response.json()
            print(f"✅ 成功获取所有标签，共 {len(tags)} 个:")
            print(f"   - {', '.join(tags)}")
        else:
            print(f"❌ 获取所有标签失败，状态码: {response.status_code}")
    except Exception as e:
        print(f"❌ 获取所有标签异常: {str(e)}")

    # 6. 按标签搜索链接
    print("\n6. 按标签搜索链接 (前端)")
    try:
        response = requests.get(f"{BASE_URL}/by-tags/list?tags=前端")
        if response.status_code == 200:
            links = response.json()
            print(f"✅ 成功按标签搜索链接，共 {len(links)} 个:")
            for link in links:
                print(f"   - {link['name']} ({link['url']})")
        else:
            print(f"❌ 按标签搜索链接失败，状态码: {response.status_code}")
    except Exception as e:
        print(f"❌ 按标签搜索链接异常: {str(e)}")

    # 7. 获取随机链接
    print("\n7. 获取随机链接")
    try:
        response = requests.get(f"{BASE_URL}/random?limit=2")
        if response.status_code == 200:
            links = response.json()
            print(f"✅ 成功获取随机链接，共 {len(links)} 个:")
            for link in links:
                print(f"   - {link['name']} ({link['category']})")
        else:
            print(f"❌ 获取随机链接失败，状态码: {response.status_code}")
    except Exception as e:
        print(f"❌ 获取随机链接异常: {str(e)}")

    # 8. 更新链接
    if created_links:
        print("\n8. 更新链接")
        link_id = created_links[0]["id"]
        update_data = {"name": "示例站点(已更新)", "sort_order": 20}
        try:
            response = requests.put(f"{BASE_URL}/{link_id}", json=update_data)
            if response.status_code == 200:
                updated_link = response.json()
                print(f"✅ 成功更新链接: {updated_link['name']} (ID: {updated_link['id']})")
            else:
                print(f"❌ 更新链接失败，状态码: {response.status_code}, 错误: {response.text}")
        except Exception as e:
            print(f"❌ 更新链接异常: {str(e)}")

    # 9. 获取单个链接
    if created_links:
        print("\n9. 获取单个链接")
        link_id = created_links[0]["id"]
        try:
            response = requests.get(f"{BASE_URL}/{link_id}")
            if response.status_code == 200:
                link = response.json()
                print(f"✅ 成功获取链接: {link['name']} (ID: {link['id']})")
            else:
                print(f"❌ 获取链接失败，状态码: {response.status_code}")
        except Exception as e:
            print(f"❌ 获取链接异常: {str(e)}")

    print("\n=== 测试完成 ===")


if __name__ == "__main__":
    # 确保服务器运行在 http://localhost:8001
    test_links_api()
