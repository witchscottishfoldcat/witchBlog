import asyncio

import httpx

API_BASE_URL = "http://localhost:8000/api/v1"


async def test_vision_chat():
    """测试视觉聊天功能"""
    print("\n" + "=" * 50)
    print("测试AI视觉理解功能")
    print("=" * 50)

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": "你好，请用一句话介绍你自己"}]}
        ],
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
        else:
            print(f"错误: {response.text}")


async def test_vision_with_image_url():
    """测试带图片URL的视觉理解（使用示例图片）"""
    print("\n" + "=" * 50)
    print("测试AI图片理解功能（使用示例图片）")
    print("=" * 50)

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请描述一下这张图片的内容"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://via.placeholder.com/300x200.png?text=Test+Image"
                        },
                    },
                ],
            }
        ],
        "temperature": 0.7,
        "max_tokens": 200,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"提供商: {data['provider']}")
            print(f"模型: {data['model']}")
            print(f"回复: {data['message']['content']}")
        else:
            print(f"错误: {response.text}")


async def test_vision_stream():
    """测试流式视觉聊天"""
    print("\n" + "=" * 50)
    print("测试流式AI视觉理解")
    print("=" * 50)

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": "请简单介绍一下人工智能"}]}
        ],
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


async def test_mixed_content():
    """测试混合内容（文本+图片）"""
    print("\n" + "=" * 50)
    print("测试混合内容输入")
    print("=" * 50)

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "这是一张测试图片。"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://via.placeholder.com/300x200.png?text=Hello+World"
                        },
                    },
                    {"type": "text", "text": "请告诉我你看到了什么？"},
                ],
            }
        ],
        "temperature": 0.7,
        "max_tokens": 200,
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
    """运行所有视觉测试"""
    print("\n" + "=" * 50)
    print("AI视觉功能测试开始")
    print("=" * 50)
    print(f"API基础URL: {API_BASE_URL}")

    try:
        await test_vision_chat()
        await test_vision_with_image_url()
        await test_vision_stream()
        await test_mixed_content()

        print("\n" + "=" * 50)
        print("所有测试完成！")
        print("=" * 50)
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
