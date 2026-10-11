#!/usr/bin/env python3
"""
创建测试日记
"""

import requests
import json

# API基础URL
BASE_URL = "http://localhost:8001/api/v1"

def create_test_diary():
    """创建测试日记"""
    print("准备创建测试日记...")
    
    # 测试日记内容
    diary_data = {
        "title": "我的第一篇测试日记",
        "content": """# 美好的一天

今天是个阳光明媚的好日子，心情也格外愉快。

## 早晨

早上醒来，阳光透过窗户洒进房间，感觉整个人都充满了活力。

## 上午

去公园散步，看到了很多美丽的花朵，拍了几张照片记录这美好的瞬间。

## 下午

和朋友一起喝茶聊天，度过了一个愉快的下午。我们聊了很多关于生活和工作的话题，收获颇丰。

## 晚上

回到家，做了一顿丰盛的晚餐，然后看了一部电影，放松心情。

## 总结

这是充实而美好的一天，期待明天也是如此！

**今天的心情指数：** ⭐⭐⭐⭐⭐

**今日天气：** 🌞 晴天
""",
        "weather": "晴天",
        "mood": "开心",
        "tags": ["心情", "生活", "美好的一天"],
        "is_public": True
    }
    
    try:
        # 发送请求创建日记
        response = requests.post(f"{BASE_URL}/diaries/", json=diary_data, timeout=10)
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 201:
            diary = response.json()
            print("✅ 日记创建成功！")
            print(f"📝 日记ID: {diary['id']}")
            print(f"📌 日记标题: {diary['title']}")
            print(f"🌤️ 天气: {diary['weather']}")
            print(f"😊 心情: {diary['mood']}")
            print(f"🏷️ 标签: {', '.join(diary['tags'])}")
            print(f"🌐 公开状态: {'公开' if diary['is_public'] else '私有'}")
            
            # 获取日记详情验证
            detail_response = requests.get(f"{BASE_URL}/diaries/{diary['id']}")
            if detail_response.status_code == 200:
                print("\n✅ 日记详情获取成功，验证通过！")
                
                # 获取日记列表验证
                list_response = requests.get(f"{BASE_URL}/diaries/")
                if list_response.status_code == 200:
                    diaries = list_response.json()
                    print(f"✅ 日记列表获取成功，共有 {diaries['total']} 篇日记")
                    print("\n🎉 所有测试通过！日记API工作正常。")
                else:
                    print(f"❌ 日记列表获取失败: {list_response.status_code}")
            else:
                print(f"❌ 日记详情获取失败: {detail_response.status_code}")
            
            return diary['id']
        else:
            print(f"❌ 日记创建失败: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"❌ 无法连接到服务器 {BASE_URL}")
        print("请确保服务器正在运行：python start_test_server.py 或 python main.py")
        return None
    except Exception as e:
        print(f"❌ 发生错误: {e}")
        return None

if __name__ == "__main__":
    print("🚀 开始创建测试日记...\n")
    diary_id = create_test_diary()
    
    if diary_id:
        print(f"\n📖 你可以访问以下链接查看日记:")
        print(f"  API文档: http://localhost:8001/docs")
        print(f"  日记详情: http://localhost:8001/api/v1/diaries/{diary_id}")
        print(f"  日记列表: http://localhost:8001/api/v1/diaries/")
    
    print("\n✨ 完成！")