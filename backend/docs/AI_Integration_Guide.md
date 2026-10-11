# AI服务集成指南

## 快速开始

### 1. 启动服务

```bash
python main.py
```

服务将在 `http://localhost:8000` 启动。

### 2. 测试接口

#### 使用Python脚本测试

```bash
python scripts/test_ai_api.py
```

#### 使用Web界面测试

打开浏览器访问：
```
demo-files/ai_test.html
```

#### 使用Swagger文档

访问：
```
http://localhost:8000/docs
```

## API端点

### 基础URL
```
http://localhost:8000/api/v1/ai
```

### 可用端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/providers` | GET | 获取所有AI提供商信息 |
| `/chat` | POST | AI聊天对话 |
| `/chat/stream` | POST | 流式聊天对话 |
| `/completion` | POST | 文本补全 |
| `/models/{provider}` | GET | 获取指定提供商的模型列表 |

## 使用示例

### 简单聊天

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/ai/chat",
        json={
            "messages": [
                {"role": "user", "content": "你好"}
            ]
        }
    )
    data = response.json()
    print(data["message"]["content"])
```

### 多轮对话

```python
import httpx

messages = [
    {"role": "user", "content": "什么是Python？"},
    {"role": "assistant", "content": "Python是一种高级编程语言。"},
    {"role": "user", "content": "它有什么特点？"}
]

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/ai/chat",
        json={"messages": messages}
    )
    data = response.json()
    print(data["message"]["content"])
```

### 视觉理解（GLM-4.6V-Flash）

```python
import httpx

messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "请描述这张图片"},
            {
                "type": "image_url",
                "image_url": {"url": "https://example.com/image.jpg"}
            }
        ]
    }
]

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/ai/chat",
        json={
            "model": "GLM-4.6V-Flash",
            "messages": messages
        }
    )
    data = response.json()
    print(data["message"]["content"])
```

### 流式输出

```python
import httpx

async with httpx.AsyncClient() as client:
    async with client.stream(
        "POST",
        "http://localhost:8000/api/v1/ai/chat/stream",
        json={
            "messages": [
                {"role": "user", "content": "请介绍一下FastAPI"}
            ]
        }
    ) as response:
        async for chunk in response.aiter_text():
            print(chunk, end='', flush=True)
```

## 支持的模型

### GLM（智谱AI）

| 模型 | 特性 | 最大Token |
|------|------|-----------|
| GLM-4.6V-Flash | 视觉+文本 | 128K |
| GLM-4-Flash | 文本 | 128K |
| GLM-4 | 文本 | 128K |

### DeepSeek（预留）

| 模型 | 特性 | 最大Token |
|------|------|-----------|
| deepseek-chat | 文本 | 4K |

### Kimi（预留）

| 模型 | 特性 | 最大Token |
|------|------|-----------|
| moonshot-v1-8k | 文本 | 8K |

## 配置

在 `app/core/config.py` 中配置AI相关参数：

```python
# AI模型配置
AI_DEFAULT_PROVIDER = "glm"

# GLM配置
GLM_API_KEY = "your_api_key"
GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
GLM_MODEL = "GLM-4.6V-Flash"
GLM_TIMEOUT = 60
```

或在 `.env` 文件中设置：

```env
AI_DEFAULT_PROVIDER=glm
GLM_API_KEY=your_api_key
GLM_MODEL=GLM-4.6V-Flash
```

## 架构说明

### 文件结构

```
app/
├── api/v1/
│   └── ai.py              # AI API路由
├── schemas/
│   └── ai.py              # AI数据模型
├── services/
│   └── ai_service.py      # AI服务实现
└── core/
    └── config.py          # AI配置
```

### 设计模式

- **工厂模式**: `AIServiceFactory` 负责创建和管理AI服务实例
- **策略模式**: `BaseAIService` 定义统一接口，不同提供商实现具体逻辑
- **依赖注入**: FastAPI的依赖注入管理数据库会话和认证

## 扩展新提供商

要添加新的AI提供商（如DeepSeek、Kimi）：

1. 在 `config.py` 中添加配置
2. 在 `schemas/ai.py` 中添加模型信息
3. 在 `services/ai_service.py` 中实现服务类

示例：

```python
class DeepSeekService(BaseAIService):
    def __init__(self):
        super().__init__(AIProvider.DEEPSEEK)
        self.api_key = settings.DEEPSEEK_API_KEY
        self.api_url = settings.DEEPSEEK_API_URL
    
    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        # 实现DeepSeek的聊天逻辑
        pass
    
    # 实现其他抽象方法...
```

## 常见问题

### 1. 如何切换AI提供商？

在请求中指定 `provider` 参数：

```json
{
  "provider": "deepseek",
  "messages": [...]
}
```

### 2. 如何使用特定模型？

在请求中指定 `model` 参数：

```json
{
  "model": "GLM-4.6V-Flash",
  "messages": [...]
}
```

### 3. 如何控制生成内容的长度？

使用 `max_tokens` 参数：

```json
{
  "max_tokens": 200,
  "messages": [...]
}
```

### 4. 如何调整输出的随机性？

使用 `temperature` 参数（0.0-2.0）：

```json
{
  "temperature": 0.3,
  "messages": [...]
}
```

- 0.0-0.3: 更准确、更确定
- 0.4-0.7: 平衡
- 0.8-2.0: 更有创意、更随机

### 5. 如何处理图片？

使用GLM-4.6V-Flash模型，在消息内容中添加图片：

```json
{
  "model": "GLM-4.6V-Flash",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "请描述这张图片"},
        {"type": "image_url", "image_url": {"url": "https://..."}}
      ]
    }
  ]
}
```

## 性能优化

### 1. 使用流式输出

对于长文本生成，使用流式接口提升用户体验：

```python
POST /ai/chat/stream
```

### 2. 合理设置Token限制

根据实际需求设置 `max_tokens`，避免浪费：

```json
{
  "max_tokens": 100,
  "messages": [...]
}
```

### 3. 选择合适的模型

- 简单任务：使用 `GLM-4-Flash`（快速）
- 复杂任务：使用 `GLM-4.6V-Flash`（强大）
- 视觉任务：必须使用 `GLM-4.6V-Flash`

## 相关文档

- [AI API 详细文档](../api-docs/AI_API_Usage.md)
- [项目结构](PROJECT_STRUCTURE.md)

## 技术支持

如有问题，请查看：
- API文档: `http://localhost:8000/docs`
- 测试脚本: `scripts/test_ai_api.py`
- 示例页面: `demo-files/ai_test.html`
