import asyncio
import json

import httpx


async def test_glm_46v_chat():
    """测试GLM-4.6V-Flash聊天API"""

    base_url = "http://localhost:8000"

    print("=" * 80)
    print("测试GLM-4.6V-Flash聊天API")
    print("=" * 80)

    test_cases = [
        {
            "name": "简单问候",
            "request": {
                "provider": "glm",
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
                "temperature": 0.7,
            },
        },
        {
            "name": "问问题",
            "request": {
                "provider": "glm",
                "model": "GLM-4.6V-Flash",
                "messages": [
                    {"role": "system", "content": "你是一个有用的助手"},
                    {"role": "user", "content": "什么是人工智能？"},
                ],
                "temperature": 0.5,
            },
        },
        {
            "name": "不指定模型（使用默认）",
            "request": {"messages": [{"role": "user", "content": "你好，请简单介绍一下你自己"}]},
        },
        {
            "name": "使用GLM-4-Flash对比",
            "request": {
                "provider": "glm",
                "model": "GLM-4-Flash",
                "messages": [{"role": "user", "content": "你好"}],
            },
        },
    ]

    async with httpx.AsyncClient(timeout=120.0) as client:
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"测试 {i}: {test_case['name']}")
            print(f"{'='*60}")

            try:
                response = await client.post(
                    f"{base_url}/api/v1/ai/chat", json=test_case["request"]
                )

                print(f"状态码: {response.status_code}")

                if response.status_code == 200:
                    result = response.json()

                    print(f"\n提供商: {result.get('provider')}")
                    print(f"模型: {result.get('model')}")
                    print(f"结束原因: {result.get('finish_reason')}")

                    content = result.get("message", {}).get("content", "")
                    print(f"\n回复内容:")
                    print(f"  {content}")
                    print(f"\n内容长度: {len(content)}")

                    reasoning_content = result.get("reasoning_content")
                    if reasoning_content:
                        print(f"\n推理内容:")
                        print(
                            f"  {reasoning_content[:200]}..."
                            if len(reasoning_content) > 200
                            else f"  {reasoning_content}"
                        )
                        print(f"\n推理内容长度: {len(reasoning_content)}")
                    else:
                        print(f"\n推理内容: 无")

                    usage = result.get("usage", {})
                    if usage:
                        print(f"\nToken使用:")
                        print(f"  总token: {usage.get('total_tokens')}")
                        print(f"  提示token: {usage.get('prompt_tokens')}")
                        print(f"  完成token: {usage.get('completion_tokens')}")

                        completion_details = usage.get("completion_tokens_details", {})
                        if completion_details:
                            reasoning_tokens = completion_details.get(
                                "reasoning_tokens"
                            )
                            if reasoning_tokens:
                                print(f"  推理token: {reasoning_tokens}")
                else:
                    print(f"错误响应: {response.text}")

                await asyncio.sleep(1)

            except Exception as e:
                print(f"请求失败: {str(e)}")
                await asyncio.sleep(1)


async def test_models_list():
    """测试模型列表API"""

    base_url = "http://localhost:8000"

    print("\n" + "=" * 80)
    print("测试模型列表API")
    print("=" * 80)

    providers = ["glm", "deepseek", "kimi"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        for provider in providers:
            print(f"\n{'='*60}")
            print(f"测试提供商: {provider}")
            print(f"{'='*60}")

            try:
                response = await client.get(f"{base_url}/api/v1/ai/models/{provider}")

                print(f"状态码: {response.status_code}")

                if response.status_code == 200:
                    result = response.json()

                    print(f"\n支持的模型数量: {len(result)}")

                    for model in result:
                        print(f"\n- {model.get('model')} ({model.get('display_name')})")
                        print(f"  描述: {model.get('description')}")
                        print(f"  支持视觉: {model.get('supports_vision')}")
                        print(f"  最大token: {model.get('max_tokens')}")
                        print(f"  提供商: {model.get('provider')}")
                else:
                    print(f"错误响应: {response.text}")

            except Exception as e:
                print(f"请求失败: {str(e)}")


async def main():
    """运行所有测试"""
    print("开始测试GLM-4.6V-Flash API...")
    print("请确保FastAPI服务已启动 (python -m uvicorn app.main:app --reload)\n")

    await test_glm_46v_chat()
    await test_models_list()

    print("\n" + "=" * 80)
    print("测试完成!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
