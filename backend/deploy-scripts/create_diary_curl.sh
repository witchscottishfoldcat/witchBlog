#!/bin/bash

# 创建简单测试日记的curl命令
echo "创建简单测试日记..."
curl -X POST "http://localhost:8001/api/v1/diaries/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇测试日记",
    "content": "# 美好的一天\n\n今天是个阳光明媚的好日子，心情也格外愉快。\n\n## 早晨\n\n早上醒来，阳光透过窗户洒进房间，感觉整个人都充满了活力。\n\n## 上午\n\n去公园散步，看到了很多美丽的花朵。\n\n## 下午\n\n和朋友一起喝茶聊天，度过了一个愉快的下午。\n\n## 总结\n\n这是充实而美好的一天，期待明天也是如此！",
    "weather": "晴天",
    "mood": "开心",
    "tags": ["心情", "生活"],
    "is_public": true
  }'

echo -e "\n\n创建详细测试日记..."
curl -X POST "http://localhost:8001/api/v1/diaries/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "丰富多彩的一天",
    "content": "# 丰富多彩的一天\n\n> \"生活就像一盒巧克力，你永远不知道下一颗是什么味道。\" —— 《阿甘正传》\n\n今天是我人生中非常特别的一天，有很多值得记录的时刻。\n\n## 🌅 清晨 - 新的开始\n\n早上6点30分，我被窗外的鸟鸣声唤醒。拉开窗帘，看到晨光中的城市轮廓，整个世界仿佛刚刚苏醒。\n\n## 🍽️ 中午 - 美食与休息\n\n午餐是今天的亮点之一！我尝试了新发现的餐馆，点了他们的招牌菜：麻辣香锅和清蒸鲈鱼。\n\n## 🌸 下午 - 自然之美\n\n下午我去了植物园，欣赏春天的花卉展览。樱花、郁金香、牡丹竞相开放，美不胜收。\n\n## 📚 晚间 - 学习与反思\n\n晚上我读了一本很有趣的书，《原子习惯》。书中的一些观点让我印象深刻：\"微小改变带来巨大成果。每天进步1%，一年后你将进步37倍。\"",
    "weather": "晴天",
    "mood": "愉快",
    "tags": ["生活记录", "成长", "正能量"],
    "is_public": true
  }'

echo -e "\n\n获取日记列表..."
curl -X GET "http://localhost:8001/api/v1/diaries/" | python -m json.tool