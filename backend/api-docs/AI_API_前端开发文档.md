# AI 聊天接口 - 前端开发文档

## 接口概览

**基础URL**: `http://localhost:8000/api/v1/ai`

**主要功能**:
- 文本对话
- 图片识别（视觉理解）
- 流式输出
- 多轮对话

---

## 1. 聊天对话接口

### 接口地址
`POST /chat`

### 请求参数

```typescript
interface ChatRequest {
  provider?: string;        // 提供商，默认 "glm"
  model?: string;           // 模型名称，默认 "GLM-4.6V-Flash"
  messages: Message[];      // 消息列表（必填）
  temperature?: number;     // 温度参数，默认 0.7
  max_tokens?: number;     // 最大token数
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentItem[];
}

interface ContentItem {
  type: 'text' | 'image_url';
  text?: string;           // type为text时的文本内容
  image_url?: {             // type为image_url时的图片URL
    url: string;
  };
}
```

### 响应数据

```typescript
interface ChatResponse {
  provider: string;         // 提供商
  model: string;            // 使用的模型
  message: {
    role: string;
    content: string;        // AI回复内容
  };
  reasoning_content?: string;  // 推理过程（GLM-4.6V-Flash独有）
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      reasoning_tokens: number;  // 推理token数
    };
  };
  finish_reason: string;    // 结束原因
}
```

### 使用示例

#### 示例1: 简单对话

```javascript
// 发送消息
async function sendMessage(message) {
  const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GLM-4.6V-Flash',
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  return data.message.content;
}

// 使用
sendMessage('你好').then(reply => {
  console.log('AI回复:', reply);
});
```

#### 示例2: 多轮对话

```javascript
// 保存对话历史
let conversationHistory = [];

async function chat(userMessage) {
  // 添加用户消息
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });
  
  const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GLM-4.6V-Flash',
      messages: conversationHistory,
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  // 添加AI回复到历史
  conversationHistory.push({
    role: 'assistant',
    content: data.message.content
  });
  
  return {
    reply: data.message.content,
    reasoning: data.reasoning_content,  // 推理过程
    usage: data.usage
  };
}

// 使用示例
chat('什么是人工智能？')
  .then(result => {
    console.log('回复:', result.reply);
    console.log('推理过程:', result.reasoning);
    console.log('Token使用:', result.usage);
  });
```

#### 示例3: 图片识别

```javascript
async function recognizeImage(imageUrl, question) {
  const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GLM-4.6V-Flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: question || '请描述这张图片的内容'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    })
  });
  
  const data = await response.json();
  return data.message.content;
}

// 使用示例
recognizeImage('https://example.com/image.jpg', '这张图片里有什么？')
  .then(description => {
    console.log('图片描述:', description);
  });
```

---

## 2. 流式输出接口

### 接口地址
`POST /chat/stream`

### 使用示例

```javascript
async function streamChat(message, onChunk, onComplete) {
  const response = await fetch('http://localhost:8000/api/v1/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GLM-4.6V-Flash',
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    fullText += chunk;
    
    // 每收到一块内容就调用回调
    onChunk(chunk);
  }
  
  // 完成
  if (onComplete) {
    onComplete(fullText);
  }
}

// 使用示例
streamChat(
  '请简单介绍一下Python',
  (chunk) => {
    console.log('收到:', chunk);
    // 实时更新UI
  },
  (fullText) => {
    console.log('完成:', fullText);
    // 完成后的处理
  }
);
```

---

## 3. 获取模型列表

### 接口地址
`GET /models/{provider}`

### 使用示例

```javascript
async function getModels(provider = 'glm') {
  const response = await fetch(`http://localhost:8000/api/v1/ai/models/${provider}`);
  const models = await response.json();
  
  return models.map(model => ({
    id: model.model,
    name: model.display_name,
    description: model.description,
    supportsVision: model.supports_vision,
    maxTokens: model.max_tokens
  }));
}

// 使用示例
getModels('glm').then(models => {
  console.log('可用模型:', models);
  
  models.forEach(model => {
    console.log(`${model.name}: ${model.description}`);
    console.log(`  支持视觉: ${model.supportsVision}`);
    console.log(`  最大Token: ${model.maxTokens}`);
  });
});
```

---

## React组件示例

### 简单聊天组件

```jsx
import React, { useState, useRef, useEffect } from 'react';

function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'GLM-4.6V-Flash',
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();

      // 添加AI回复
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message.content,
        reasoning: data.reasoning_content
      }]);

    } catch (error) {
      console.error('发送失败:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: '发送失败，请重试'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.reasoning && (
              <div className="reasoning">
                <details>
                  <summary>推理过程</summary>
                  <p>{msg.reasoning}</p>
                </details>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}

export default AIChat;
```

### 流式聊天组件

```jsx
import React, { useState, useRef, useEffect } from 'react';

function StreamingChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStream, setCurrentStream] = useState('');

  const startStreamingChat = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);
    setCurrentStream('');

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('http://localhost:8000/api/v1/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'GLM-4.6V-Flash',
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ]
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;
        setCurrentStream(fullText);
      }

      // 完成后添加到消息列表
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullText
      }]);
      setCurrentStream('');

    } catch (error) {
      console.error('发送失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {currentStream && (
          <div className="message assistant streaming">
            {currentText}
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && startStreamingChat()}
          placeholder="输入消息..."
          disabled={loading}
        />
        <button onClick={startStreamingChat} disabled={loading || !input.trim()}>
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}

export default StreamingChat;
```

---

## Vue组件示例

### 简单聊天组件

```vue
<template>
  <div class="chat-container">
    <div class="messages" ref="messagesContainer">
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        :class="['message', msg.role]"
      >
        <div class="content">{{ msg.content }}</div>
        <div v-if="msg.reasoning" class="reasoning">
          <details>
            <summary>推理过程</summary>
            <p>{{ msg.reasoning }}</p>
          </details>
        </div>
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        :disabled="loading"
      />
      <button @click="sendMessage" :disabled="loading || !input.trim()">
        {{ loading ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messages: [],
      input: '',
      loading: false
    };
  },
  methods: {
    async sendMessage() {
      if (!this.input.trim() || this.loading) return;

      const userMessage = this.input;
      this.input = '';
      this.loading = true;

      this.messages.push({
        role: 'user',
        content: userMessage
      });

      try {
        const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'GLM-4.6V-Flash',
            messages: this.messages,
            temperature: 0.7
          })
        });

        const data = await response.json();

        this.messages.push({
          role: 'assistant',
          content: data.message.content,
          reasoning: data.reasoning_content
        });

      } catch (error) {
        console.error('发送失败:', error);
        this.messages.push({
          role: 'system',
          content: '发送失败，请重试'
        });
      } finally {
        this.loading = false;
      }
    }
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }
};
</script>
```

---

## 常见问题

### Q1: 如何选择模型？
- **GLM-4.6V-Flash**: 默认模型，免费，支持视觉和文本，有推理过程
- **GLM-4-Flash**: 快速响应，仅文本，无推理过程
- **GLM-4**: 标准模型

### Q2: reasoning_content是什么？
- GLM-4.6V-Flash独有的特性
- 包含AI的推理过程，展示模型如何思考
- 可以用于调试或展示思考过程
- 会额外消耗reasoning_tokens

### Q3: 如何处理长对话？
- 限制历史消息数量（建议10-20条）
- 或限制总token数
- 超过限制时，可以只保留最近的N条消息

### Q4: 流式输出的优势？
- 实时显示，用户体验更好
- 适合长文本生成
- 减少等待时间

### Q5: 如何实现打字机效果？
```javascript
async function typewriterEffect(text, element, delay = 50) {
  element.textContent = '';
  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

---

## 错误处理

### 错误响应格式
```json
{
  "detail": "错误描述信息"
}
```

### 常见错误码
- `400`: 请求参数错误
- `500`: 服务器内部错误
- `503`: 服务不可用（如API密钥未配置）

### 错误处理示例
```javascript
async function sendMessage(message) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '请求失败');
    }

    const data = await response.json();
    return data.message.content;

  } catch (error) {
    console.error('错误:', error);
    throw error;
  }
}
```

---

## 完整示例：带图片上传的聊天组件

```jsx
import React, { useState, useRef, useEffect } from 'react';

function ImageChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 这里需要上传到服务器获取URL
      // 假设有一个上传接口
      uploadImage(file).then(url => {
        setImage(url);
      });
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !image) || loading) return;

    const userMessage = input;
    const userImage = image;
    setInput('');
    setImage(null);
    setLoading(true);

    const userMsg = {
      role: 'user',
      content: []
    };

    if (userMessage) {
      userMsg.content.push({ type: 'text', text: userMessage });
    }
    if (userImage) {
      userMsg.content.push({
        type: 'image_url',
        image_url: { url: userImage }
      });
    }

    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'GLM-4.6V-Flash',
          messages: [...messages, userMsg]
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message.content,
        reasoning: data.reasoning_content
      }]);

    } catch (error) {
      console.error('发送失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {Array.isArray(msg.content) ? (
              <div>
                {msg.content.map((item, i) => (
                  <div key={i}>
                    {item.type === 'text' && <p>{item.text}</p>}
                    {item.type === 'image_url' && (
                      <img src={item.image_url.url} alt="上传的图片" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="content">{msg.content}</div>
            )}
            {msg.reasoning && (
              <details className="reasoning">
                <summary>推理过程</summary>
                <p>{msg.reasoning}</p>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current.click()}>
          上传图片
        </button>
        {image && <img src={image} alt="预览" className="preview" />}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || (!input.trim() && !image)}>
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}

export default ImageChat;
```

---

## 接口总结

| 功能 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 聊天对话 | `/chat` | POST | 普通对话，一次性返回 |
| 流式对话 | `/chat/stream` | POST | 流式输出，实时返回 |
| 模型列表 | `/models/{provider}` | GET | 获取可用模型 |

---

## 技术支持

- Swagger文档: `http://localhost:8000/docs`
- 现有文档: `api-docs/AI_API_Usage.md`
- 测试脚本: `scripts/test_api_glm_46v.py`
