"""
WitchCat Text API 使用示例
"""

import requests
import json

# API 基础URL
BASE_URL = "http://localhost:8000"

def test_api():
    """测试API功能"""
    
    # 1. 健康检查
    print("=== 健康检查 ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"状态: {response.status_code}")
    print(f"响应: {response.json()}")
    print()
    
    # 2. 创建文本
    print("=== 创建文本 ===")
    text_data = {
        "text": "这是一个测试文本。This is a test text. 我们来测试一下文字处理功能！",
        "title": "测试文档",
        "author": "测试用户"
    }
    response = requests.post(f"{BASE_URL}/api/v1/texts", json=text_data)
    print(f"状态: {response.status_code}")
    text_result = response.json()
    print(f"创建的文本: {json.dumps(text_result, indent=2, ensure_ascii=False)}")
    text_id = text_result["id"]
    print()
    
    # 3. 分析文本
    print("=== 分析文本 ===")
    analysis_data = {"text": text_data["text"]}
    response = requests.post(f"{BASE_URL}/api/v1/texts/analyze", json=analysis_data)
    print(f"状态: {response.status_code}")
    analysis_result = response.json()
    print(f"分析结果: {json.dumps(analysis_result, indent=2, ensure_ascii=False)}")
    print()
    
    # 4. 处理文本
    print("=== 处理文本 ===")
    operations = ["uppercase", "lowercase", "reverse", "remove_spaces"]
    for operation in operations:
        process_data = {
            "text": text_data["text"],
            "operation": operation
        }
        response = requests.post(f"{BASE_URL}/api/v1/texts/process", json=process_data)
        if response.status_code == 200:
            result = response.json()
            print(f"操作 {operation}: {result['processed_text']}")
    print()
    
    # 5. 提取关键词
    print("=== 提取关键词 ===")
    response = requests.post(f"{BASE_URL}/api/v1/texts/keywords", json=analysis_data)
    print(f"状态: {response.status_code}")
    keywords_result = response.json()
    print(f"关键词: {keywords_result['keywords']}")
    print()
    
    # 6. 获取所有文本
    print("=== 获取所有文本 ===")
    response = requests.get(f"{BASE_URL}/api/v1/texts")
    print(f"状态: {response.status_code}")
    texts_result = response.json()
    print(f"所有文本: {json.dumps(texts_result, indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    print("WitchCat Text API 测试开始...")
    print("请确保API服务已启动 (python main.py)")
    print()
    
    try:
        test_api()
        print("测试完成！")
    except requests.exceptions.ConnectionError:
        print("连接失败！请确保API服务正在运行。")
    except Exception as e:
        print(f"测试出错: {e}")