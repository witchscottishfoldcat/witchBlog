import asyncio
import json

import httpx

API_BASE_URL = "http://localhost:8000/api/v1"


async def test_simple_chat():
    """测试简单聊天"""
    print("\n" + "=" * 50)
    print("测试1: 简单聊天（GLM-4.6V-Flash）")
    print("=" * 50)

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [{"role": "user", "content": "你好，请用一句话介绍你自己"}],
        "temperature": 0.7,
        "max_tokens": 50,
    }

    print(f"请求: {json.dumps(request_data, ensure_ascii=False, indent=2)}")

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"\n状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"完整响应: {json.dumps(data, ensure_ascii=False, indent=2)}")

            if data.get("message") and data["message"].get("content"):
                print(f"\n✅ AI回复: {data['message']['content']}")
            else:
                print(f"\n❌ AI回复为空")
                print(f"Message字段: {data.get('message')}")
        else:
            print(f"❌ 错误: {response.text}")


async def test_with_glm4_flash():
    """测试GLM-4-Flash模型"""
    print("\n" + "=" * 50)
    print("测试2: 使用GLM-4-Flash模型")
    print("=" * 50)

    request_data = {
        "model": "GLM-4-Flash",
        "messages": [{"role": "user", "content": "你好，请用一句话介绍你自己"}],
        "temperature": 0.7,
        "max_tokens": 50,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            if data.get("message") and data["message"].get("content"):
                print(f"✅ AI回复: {data['message']['content']}")
            else:
                print(f"❌ AI回复为空")
                print(f"完整响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print(f"❌ 错误: {response.text}")


async def test_with_default_model():
    """测试使用默认模型"""
    print("\n" + "=" * 50)
    print("测试3: 使用默认模型（不指定model）")
    print("=" * 50)

    request_data = {
        "messages": [{"role": "user", "content": "你好"}],
        "temperature": 0.7,
        "max_tokens": 50,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            if data.get("message") and data["message"].get("content"):
                print(f"✅ AI回复: {data['message']['content']}")
                print(f"使用的模型: {data.get('model')}")
            else:
                print(f"❌ AI回复为空")
        else:
            print(f"❌ 错误: {response.text}")


async def test_text_only():
    """测试纯文本内容"""
    print("\n" + "=" * 50)
    print("测试4: 纯文本内容（不使用视觉）")
    print("=" * 50)

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [{"role": "user", "content": "1+1等于多少？"}],
        "temperature": 0.3,
        "max_tokens": 20,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            if data.get("message") and data["message"].get("content"):
                print(f"✅ AI回复: {data['message']['content']}")
            else:
                print(f"❌ AI回复为空")
                print(f"Finish reason: {data.get('finish_reason')}")
                print(f"Usage: {data.get('usage')}")
        else:
            print(f"❌ 错误: {response.text}")


async def test_direct_api():
    """直接测试GLM API"""
    print("\n" + "=" * 50)
    print("测试5: 直接调用GLM API（绕过我们的服务）")
    print("=" * 50)

    from app.core.config import settings

    request_data = {
        "model": "GLM-4.6V-Flash",
        "messages": [{"role": "user", "content": "你好"}],
        "temperature": 0.7,
        "max_tokens": 50,
    }

    headers = {
        "Authorization": f"Bearer {settings.GLM_API_KEY}",
        "Content-Type": "application/json",
    }

    print(f"API URL: {settings.GLM_API_URL}")
    print(f"API Key: {settings.GLM_API_KEY[:20]}...")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.GLM_API_URL, json=request_data, headers=headers
            )
            print(f"\n状态码: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"完整响应: {json.dumps(data, ensure_ascii=False, indent=2)}")

                choices = data.get("choices", [])
                if choices and choices[0].get("message", {}).get("content"):
                    print(f"\n✅ AI回复: {choices[0]['message']['content']}")
                else:
                    print(f"\n❌ AI回复为空")
            else:
                print(f"❌ 错误: {response.text}")
    except Exception as e:
        print(f"❌ 异常: {e}")


async def test_with_different_temperatures():
    """测试不同温度参数"""
    print("\n" + "=" * 50)
    print("测试6: 不同温度参数")
    print("=" * 50)

    temperatures = [0.0, 0.3, 0.7, 1.0]

    for temp in temperatures:
        print(f"\n温度: {temp}")

        request_data = {
            "model": "GLM-4.6V-Flash",
            "messages": [{"role": "user", "content": "你好"}],
            "temperature": temp,
            "max_tokens": 30,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{API_BASE_URL}/ai/chat", json=request_data)

            if response.status_code == 200:
                data = response.json()
                content = data.get("message", {}).get("content", "")
                print(f"  回复: {content if content else '(空)'}")
            else:
                print(f"  错误: {response.status_code}")

        await asyncio.sleep(1)  # 避免速率限制


async def main():
    """运行所有测试"""
    print("\n" + "=" * 50)
    print("GLM-4.6V-Flash 详细诊断测试")
    print("=" * 50)
    print(f"API基础URL: {API_BASE_URL}")

    try:
        await test_simple_chat()
        await test_with_glm4_flash()
        await test_with_default_model()
        await test_text_only()
        await test_direct_api()
        await test_with_different_temperatures()

        print("\n" + "=" * 50)
        print("所有测试完成！")
        print("=" * 50)
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
