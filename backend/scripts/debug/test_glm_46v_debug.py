import asyncio
import json
import os

import httpx

GLM_API_KEY = os.environ["GLM_API_KEY"]
GLM_API_URL = os.environ.get(
    "GLM_API_URL", "https://open.bigmodel.cn/api/paas/v4/chat/completions"
)


async def test_glm_46v_with_different_params():
    """测试GLM-4.6V-Flash的不同参数组合"""

    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json",
    }

    test_cases = [
        {
            "name": "Case 1: 默认参数",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 1000,
            },
        },
        {
            "name": "Case 2: 极简参数",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
            },
        },
        {
            "name": "Case 3: 较高temperature",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
                "temperature": 1.0,
            },
        },
        {
            "name": "Case 4: 添加system提示",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [
                    {"role": "system", "content": "你是一个有用的助手"},
                    {"role": "user", "content": "你好"},
                ],
            },
        },
        {
            "name": "Case 5: 使用stream=False（显式）",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
                "stream": False,
            },
        },
    ]

    async with httpx.AsyncClient(timeout=60.0) as client:
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"{test_case['name']}")
            print(f"{'='*60}")
            print(
                f"请求参数: {json.dumps(test_case['params'], ensure_ascii=False, indent=2)}"
            )

            try:
                response = await client.post(
                    GLM_API_URL, headers=headers, json=test_case["params"]
                )

                print(f"\n状态码: {response.status_code}")

                if response.status_code == 200:
                    result = response.json()
                    print(f"\n完整响应:")
                    print(json.dumps(result, ensure_ascii=False, indent=2))

                    if "choices" in result and len(result["choices"]) > 0:
                        choice = result["choices"][0]
                        content = choice.get("message", {}).get("content", "")
                        finish_reason = choice.get("finish_reason", "")
                        print(f"\n内容长度: {len(content)}")
                        print(f"完成原因: {finish_reason}")
                        if content:
                            print(f"内容: {content}")
                        else:
                            print("⚠️  内容为空!")

                        if "delta" in choice:
                            print(f"Delta: {choice['delta']}")
                else:
                    print(f"错误响应: {response.text}")

                await asyncio.sleep(2)

            except Exception as e:
                print(f"请求失败: {str(e)}")
                await asyncio.sleep(2)


async def compare_with_glm4_flash():
    """对比GLM-4.6V-Flash和GLM-4-Flash的响应结构"""

    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json",
    }

    models = ["GLM-4.6V-Flash", "GLM-4-Flash"]

    print("\n" + "=" * 80)
    print("对比GLM-4.6V-Flash和GLM-4-Flash的响应结构")
    print("=" * 80)

    async with httpx.AsyncClient(timeout=60.0) as client:
        for model in models:
            print(f"\n{'='*60}")
            print(f"模型: {model}")
            print(f"{'='*60}")

            params = {
                "model": model,
                "messages": [{"role": "user", "content": "你好"}],
                "temperature": 0.7,
            }

            try:
                response = await client.post(GLM_API_URL, headers=headers, json=params)

                if response.status_code == 200:
                    result = response.json()

                    print(f"\n响应结构:")
                    print(f"- choices: {len(result.get('choices', []))}")
                    if result.get("choices"):
                        choice = result["choices"][0]
                        print(f"- choice[0].keys(): {list(choice.keys())}")
                        print(
                            f"- choice[0].message.keys(): {list(choice.get('message', {}).keys())}"
                        )
                        content = choice.get("message", {}).get("content", "")
                        print(f"- content: '{content}'")
                        print(f"- content长度: {len(content)}")
                        print(f"- finish_reason: {choice.get('finish_reason')}")

                    print(f"\nusage:")
                    usage = result.get("usage", {})
                    for key, value in usage.items():
                        print(f"  {key}: {value}")
                else:
                    print(f"错误: {response.text}")

                await asyncio.sleep(2)

            except Exception as e:
                print(f"请求失败: {str(e)}")
                await asyncio.sleep(2)


async def test_with_include_reasoning():
    """测试是否需要include_reasoning参数"""

    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json",
    }

    test_cases = [
        {
            "name": "不使用include_reasoning",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
            },
        },
        {
            "name": "include_reasoning=true",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
                "include_reasoning": True,
            },
        },
        {
            "name": "include_reasoning=false",
            "params": {
                "model": "GLM-4.6V-Flash",
                "messages": [{"role": "user", "content": "你好"}],
                "include_reasoning": False,
            },
        },
    ]

    print("\n" + "=" * 80)
    print("测试include_reasoning参数")
    print("=" * 80)

    async with httpx.AsyncClient(timeout=60.0) as client:
        for test_case in test_cases:
            print(f"\n{'='*60}")
            print(f"{test_case['name']}")
            print(f"{'='*60}")

            try:
                response = await client.post(
                    GLM_API_URL, headers=headers, json=test_case["params"]
                )

                print(f"状态码: {response.status_code}")

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"].get("content", "")
                    print(f"内容: '{content}'")
                    print(f"内容长度: {len(content)}")

                    if "reasoning_content" in result["choices"][0]["message"]:
                        print(
                            f"reasoning_content: {result['choices'][0]['message']['reasoning_content']}"
                        )

                    usage = result.get("usage", {})
                    if usage:
                        print(f"\nUsage: {usage}")
                else:
                    print(f"错误: {response.text}")

                await asyncio.sleep(2)

            except Exception as e:
                print(f"请求失败: {str(e)}")
                await asyncio.sleep(2)


async def main():
    """运行所有测试"""
    print("开始GLM-4.6V-Flash深度诊断测试...")

    await test_glm_46v_with_different_params()
    await compare_with_glm4_flash()
    await test_with_include_reasoning()

    print("\n" + "=" * 80)
    print("测试完成!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
