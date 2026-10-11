import asyncio
from typing import Optional

import httpx

API_BASE_URL = "http://localhost:8000/api/v1"


async def test_get_providers():
    """测试获取提供商信息"""
    print("\n" + "=" * 50)
    print("测试1: 获取所有AI提供商信息")
    print("=" * 50)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/ai/providers")
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"默认提供商: {data['default_provider']}")
            print(f"提供商数量: {len(data['providers'])}")
            for provider in data["providers"]:
                print(f"\n  提供商: {provider['name']}")
                print(f"  可用: {provider['is_available']}")
                print(f"  有API密钥: {provider['has_api_key']}")
                print(f"  模型数量: {len(provider['models'])}")
                for model in provider["models"]:
                    print(f"    - {model['display_name']}: {model['description']}")
        else:
            print(f"错误: {response.text}")


async def test_chat():
    """测试AI聊天"""
    print("\n" + "=" * 50)
    print("测试2: AI聊天对话")
    print("=" * 50)

    request_data = {
        "messages": [{"role": "user", "content": "你好，请用一句话介绍你自己"}],
        "temperature": 0.7,
        "max_tokens": 100,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"提供商: {data['provider']}")
            print(f"模型: {data['model']}")
            print(f"回复: {data['message']['content']}")
            print(f"结束原因: {data.get('finish_reason')}")
            if data.get("usage"):
                print(f"Token使用: {data['usage']}")
        else:
            print(f"错误: {response.text}")


async def test_text_completion():
    """测试文本补全"""
    print("\n" + "=" * 50)
    print("测试3: AI文本补全")
    print("=" * 50)

    request_data = {"prompt": "人工智能的未来发展趋势是", "temperature": 0.7, "max_tokens": 50}

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/completion", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"提供商: {data['provider']}")
            print(f"模型: {data['model']}")
            print(f"补全结果: {data['text']}")
        else:
            print(f"错误: {response.text}")


async def test_chat_stream():
    """测试流式聊天"""
    print("\n" + "=" * 50)
    print("测试4: AI流式聊天对话")
    print("=" * 50)

    request_data = {
        "messages": [{"role": "user", "content": "请简单介绍一下FastAPI框架"}],
        "temperature": 0.7,
        "max_tokens": 200,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST", f"{API_BASE_URL}/ai/chat/stream", json=request_data
        ) as response:
            print(f"状态码: {response.status_code}")

            if response.status_code == 200:
                print("流式输出:")
                async for chunk in response.aiter_text():
                    print(chunk, end="", flush=True)
                print("\n")
            else:
                print(f"错误: {response.text}")


async def test_get_models():
    """测试获取指定提供商的模型"""
    print("\n" + "=" * 50)
    print("测试5: 获取GLM的模型列表")
    print("=" * 50)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/ai/models/glm")
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            models = response.json()
            print(f"模型数量: {len(models)}")
            for model in models:
                print(f"\n  模型: {model['model']}")
                print(f"  显示名称: {model['display_name']}")
                print(f"  描述: {model['description']}")
                print(f"  支持视觉: {model['supports_vision']}")
                print(f"  最大Token: {model['max_tokens']}")
        else:
            print(f"错误: {response.text}")


async def test_multi_turn_chat():
    """测试多轮对话"""
    print("\n" + "=" * 50)
    print("测试6: 多轮对话")
    print("=" * 50)

    request_data = {
        "messages": [
            {"role": "user", "content": "什么是Python？"},
            {"role": "assistant", "content": "Python是一种高级编程语言，以其简洁易读的语法而闻名。"},
            {"role": "user", "content": "它有哪些主要应用领域？"},
        ],
        "temperature": 0.7,
        "max_tokens": 150,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"回复: {data['message']['content']}")
        else:
            print(f"错误: {response.text}")


async def main():
    """运行所有测试"""
    print("\n" + "=" * 50)
    print("AI接口测试开始")
    print("=" * 50)
    print(f"API基础URL: {API_BASE_URL}")

    try:
        await test_get_providers()
        await test_chat()
        await test_text_completion()
        await test_chat_stream()
        await test_get_models()
        await test_multi_turn_chat()

        print("\n" + "=" * 50)
        print("所有测试完成！")
        print("=" * 50)
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
