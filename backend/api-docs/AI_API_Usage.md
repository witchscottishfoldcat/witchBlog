# AI API 使用文档

## 概述

本API提供了统一的AI服务接口，支持多种AI模型提供商（GLM、DeepSeek、Kimi等）。目前已实现GLM-4.6V-Flash模型，支持文本对话和视觉理解。

## 基础信息

- **基础URL**: `http://localhost:8000/api/v1`
- **默认提供商**: GLM
- **认证**: 暂无需认证（可根据需求添加）

## AI提供商

### 支持的提供商

| 提供商 | 状态 | 支持的模型 |
|--------|------|-----------|
| GLM | ✅ 可用 | GLM-4.6V-Flash, GLM-4-Flash, GLM-4 |
| DeepSeek | ⏳ 预留 | deepseek-chat |
| Kimi | ⏳ 预留 | moonshot-v1-8k |

### GLM模型说明

- **GLM-4.6V-Flash**: 智谱AI最新模型，支持视觉和文本，最大128K tokens
- **GLM-4-Flash**: 快速响应模型，仅支持文本
- **GLM-4**: 标准GLM-4模型

## API端点

### 1. 获取提供商信息

获取所有AI提供商及其可用状态。

**请求**
```http
GET /ai/providers
```

**响应示例**
```json
{
  "providers": [
    {
      "provider": "glm",
      "name": "GLM",
      "models": [
        {
          "provider": "glm",
          "model": "GLM-4.6V-Flash",
          "display_name": "GLM-4.6V-Flash",
          "description": "智谱AI GLM-4.6V-Flash 模型，支持视觉和文本",
          "supports_vision": true,
          "max_tokens": 128000
        }
      ],
      "is_available": true,
      "has_api_key": true
    }
  ],
  "default_provider": "glm"
}
```

### 2. 聊天对话

发送消息给AI模型进行对话。

**请求**
```http
POST /ai/chat
Content-Type: application/json

{
  "provider": "glm",
  "model": "GLM-4.6V-Flash",
  "messages": [
    {
      "role": "user",
      "content": "你好，请简单介绍一下自己"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 100
}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provider | string | 否 | AI提供商，不填则使用默认 |
| model | string | 否 | 模型名称，不填则使用默认模型 |
| messages | array | 是 | 消息列表 |
| messages[].role | string | 是 | 消息角色：system/user/assistant |
| messages[].content | string/array | 是 | 消息内容，支持纯文本或混合内容（文本+图片） |
| temperature | number | 否 | 温度参数（0-2），默认0.7 |
| max_tokens | integer | 否 | 最大生成token数 |

**响应示例**
```json
{
  "provider": "glm",
  "model": "GLM-4.6V-Flash",
  "message": {
    "role": "assistant",
    "content": "你好！我是GLM-4.6V-Flash，智谱AI开发的大型语言模型。我可以回答问题、提供信息和帮助您完成各种任务。"
  },
  "usage": {
    "completion_tokens": 100,
    "prompt_tokens": 13,
    "total_tokens": 113
  },
  "finish_reason": "length"
}
```

### 3. 多轮对话

在messages数组中包含多条消息即可实现多轮对话。

**请求示例**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "什么是Python？"
    },
    {
      "role": "assistant",
      "content": "Python是一种高级编程语言，以其简洁易读的语法而闻名。"
    },
    {
      "role": "user",
      "content": "它有哪些主要应用领域？"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 150
}
```

### 4. 流式聊天

流式返回AI回复内容，适合实时显示。

**请求**
```http
POST /ai/chat/stream
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "请简单介绍一下FastAPI框架"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 200
}
```

**响应**
```
FastAPI是一个现代、快速（高性能）的Web框架，用于基于标准Python类型提示使用Python 3.7+构建API。
```

### 5. 文本补全

基于提示词进行文本补全。

**请求**
```http
POST /ai/completion
Content-Type: application/json

{
  "provider": "glm",
  "prompt": "人工智能的未来发展趋势是",
  "temperature": 0.7,
  "max_tokens": 50
}
```

**响应示例**
```json
{
  "provider": "glm",
  "model": "GLM-4.6V-Flash",
  "text": "人工智能的未来发展趋势是多模态融合、大模型小型化、边缘计算部署、以及与各行各业的深度融合...",
  "usage": {
    "completion_tokens": 50,
    "prompt_tokens": 10,
    "total_tokens": 60
  },
  "finish_reason": "length"
}
```

### 6. 获取模型列表

获取指定提供商的模型列表。

**请求**
```http
GET /ai/models/{provider}
```

**示例**
```http
GET /ai/models/glm
```

**响应示例**
```json
[
  {
    "provider": "glm",
    "model": "GLM-4.6V-Flash",
    "display_name": "GLM-4.6V-Flash",
    "description": "智谱AI GLM-4.6V-Flash 模型，支持视觉和文本",
    "supports_vision": true,
    "max_tokens": 128000
  }
]
```

## 视觉输入支持

GLM-4.6V-Flash支持视觉输入，可以识别和理解图片内容。

### 发送图片请求

**方法1：使用图片URL**
```json
{
  "model": "GLM-4.6V-Flash",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请描述这张图片的内容"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg"
          }
        }
      ]
    }
  ]
}
```

**方法2：使用MinIO代理URL**
```json
{
  "model": "GLM-4.6V-Flash",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "这张图片是什么？"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "http://localhost:8000/api/proxy-image?url=https://example.com/image.jpg"
          }
        }
      ]
    }
  ]
}
```

## 客户端示例

### Python示例

```python
import httpx
import asyncio

async def chat_with_ai():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/ai/chat",
            json={
                "messages": [
                    {
                        "role": "user",
                        "content": "你好"
                    }
                ],
                "temperature": 0.7
            }
        )
        data = response.json()
        print(data["message"]["content"])

asyncio.run(chat_with_ai())
```

### JavaScript示例

```javascript
async function chatWithAI() {
    const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: '你好'
                }
            ],
            temperature: 0.7
        })
    });
    
    const data = await response.json();
    console.log(data.message.content);
}

chatWithAI();
```

### 流式响应示例

```javascript
async function streamChat() {
    const response = await fetch('http://localhost:8000/api/v1/ai/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: '请简单介绍一下Python'
                }
            ]
        })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log(chunk);
    }
}

streamChat();
```

## 测试

### 使用Python测试脚本

```bash
python scripts/test_ai_api.py
```

### 使用Web界面

打开 `demo-files/ai_test.html` 进行可视化测试。

### 使用Swagger文档

访问 `http://localhost:8000/docs` 查看交互式API文档。

## 配置

### 环境变量

在 `.env` 文件中配置AI相关参数：

```env
# AI配置
AI_DEFAULT_PROVIDER=glm

# GLM配置
GLM_API_KEY=your_api_key_here
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
GLM_MODEL=GLM-4.6V-Flash
GLM_TIMEOUT=60

# DeepSeek配置（预留）
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=60

# Kimi配置（预留）
KIMI_API_KEY=
KIMI_API_URL=https://api.moonshot.cn/v1/chat/completions
KIMI_MODEL=moonshot-v1-8k
KIMI_TIMEOUT=60
```

## 错误处理

API返回标准的HTTP状态码：

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用（如API密钥未配置） |

错误响应格式：
```json
{
  "detail": "错误描述信息"
}
```

## 最佳实践

1. **温度参数**: 
   - 0.0-0.3: 适合需要准确性和一致性的任务
   - 0.4-0.7: 适合一般对话和内容生成
   - 0.8-2.0: 适合创意性任务

2. **Token限制**:
   - 合理设置max_tokens以控制响应长度
   - GLM-4.6V-Flash最大支持128K tokens

3. **流式输出**:
   - 对于长文本生成，使用流式接口提升用户体验
   - 流式接口适合实时对话场景

4. **多轮对话**:
   - 保存历史消息以保持上下文
   - 建议限制历史消息数量以控制token使用

## 扩展其他提供商

要添加新的AI提供商，需要：

1. 在 `config.py` 中添加配置
2. 在 `schemas/ai.py` 中定义模型信息
3. 在 `services/ai_service.py` 中实现服务类
4. 服务类需要继承 `BaseAIService` 并实现所有抽象方法

示例：
```python
class CustomService(BaseAIService):
    def __init__(self):
        super().__init__(AIProvider.CUSTOM)
        self.api_key = settings.CUSTOM_API_KEY
        self.api_url = settings.CUSTOM_API_URL
    
    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        # 实现聊天逻辑
        pass
    
    async def chat_stream(self, request: AIChatRequest) -> AsyncGenerator[str, None]:
        # 实现流式聊天逻辑
        pass
    
    async def text_completion(self, request: AITextCompletionRequest) -> AITextCompletionResponse:
        # 实现文本补全逻辑
        pass
    
    def get_model_info(self) -> List[AIModelInfo]:
        # 返回模型信息
        pass
    
    def is_available(self) -> bool:
        # 检查服务是否可用
        return bool(self.api_key)
```

## 技术支持

如有问题，请查看：
- 项目文档: `docs/`
- API文档: `api-docs/`
- 测试脚本: `scripts/test_ai_api.py`
- 示例页面: `demo-files/ai_test.html`
