from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx

from app.core.config import settings
from app.core.unified_logging import get_logger
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIModelInfo,
    AIProvider,
    AIProviderInfo,
    AITextCompletionRequest,
    AITextCompletionResponse,
)

logger = get_logger(__name__)


class BaseAIService(ABC):
    """AI服务基类"""

    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.timeout = 60

    @abstractmethod
    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        """聊天对话"""

    @abstractmethod
    def chat_stream(self, request: AIChatRequest) -> AsyncGenerator[str, None]:
        """流式聊天对话（实现为异步生成器）"""
        raise NotImplementedError

    @abstractmethod
    async def text_completion(
        self, request: AITextCompletionRequest
    ) -> AITextCompletionResponse:
        """文本补全"""

    @abstractmethod
    def get_model_info(self) -> List[AIModelInfo]:
        """获取支持的模型信息"""

    @abstractmethod
    def is_available(self) -> bool:
        """检查服务是否可用"""


class GLMService(BaseAIService):
    """GLM服务实现"""

    def __init__(self):
        super().__init__(AIProvider.GLM)
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.GLM_API_URL
        self.default_model = settings.GLM_MODEL
        self.timeout = settings.GLM_TIMEOUT

    def is_available(self) -> bool:
        """检查服务是否可用"""
        return bool(self.api_key)

    def get_model_info(self) -> List[AIModelInfo]:
        """获取支持的模型信息"""
        return [
            AIModelInfo(
                provider=self.provider,
                model="GLM-4.6V-Flash",
                display_name="GLM-4.6V-Flash",
                description="智谱AI GLM-4.6V-Flash 模型，支持视觉和文本",
                supports_vision=True,
                max_tokens=128000,
            ),
            AIModelInfo(
                provider=self.provider,
                model="GLM-4-Flash",
                display_name="GLM-4-Flash",
                description="智谱AI GLM-4-Flash 模型，快速响应",
                supports_vision=False,
                max_tokens=128000,
            ),
            AIModelInfo(
                provider=self.provider,
                model="GLM-4",
                display_name="GLM-4",
                description="智谱AI GLM-4 模型",
                supports_vision=False,
                max_tokens=128000,
            ),
        ]

    def _prepare_headers(self) -> Dict[str, str]:
        """准备请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _prepare_messages(self, messages: List[Any]) -> List[Dict[str, Any]]:
        """准备消息格式，支持纯文本和混合内容（文本+图片）"""
        prepared_messages = []

        for msg in messages:
            message_dict = {"role": msg.role.value, "content": msg.content}

            if isinstance(msg.content, list):
                content_list = []
                for item in msg.content:
                    if isinstance(item, dict):
                        if item.get("type") == "text":
                            content_list.append(
                                {"type": "text", "text": item.get("text", "")}
                            )
                        elif item.get("type") == "image_url":
                            content_list.append(
                                {
                                    "type": "image_url",
                                    "image_url": item.get("image_url", {}),
                                }
                            )
                    else:
                        from app.schemas.ai import ImageContent, TextContent

                        if isinstance(item, TextContent):
                            content_list.append({"type": "text", "text": item.text})
                        elif isinstance(item, ImageContent):
                            content_list.append(
                                {"type": "image_url", "image_url": item.image_url}
                            )

                message_dict["content"] = content_list

            prepared_messages.append(message_dict)

        return prepared_messages

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        """聊天对话"""
        model = request.model or self.default_model

        payload = {
            "model": model,
            "messages": self._prepare_messages(request.messages),
            "temperature": request.temperature,
        }

        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.api_url, headers=self._prepare_headers(), json=payload
                )
                response.raise_for_status()
                data = response.json()

                logger.debug(f"GLM API响应: {data}")

                choices = data.get("choices", [])
                if not choices:
                    raise Exception("API返回空响应")

                choice = choices[0]
                message = choice.get("message", {})
                content = message.get("content", "")
                reasoning_content = message.get("reasoning_content")

                if not content and "tool_calls" in message:
                    content = "模型调用了工具，但没有返回文本内容"

                from app.schemas.ai import AIMessage, MessageRole

                return AIChatResponse(
                    provider=self.provider,
                    model=data.get("model", model),
                    message=AIMessage(role=MessageRole.ASSISTANT, content=content),
                    reasoning_content=reasoning_content,
                    usage=data.get("usage"),
                    finish_reason=choice.get("finish_reason"),
                )
        except httpx.HTTPError as e:
            logger.error(f"GLM API调用失败: {e}")
            raise Exception(f"GLM API调用失败: {str(e)}")
        except Exception as e:
            logger.error(f"GLM服务异常: {e}")
            raise Exception(f"GLM服务异常: {str(e)}")

    async def chat_stream(self, request: AIChatRequest) -> AsyncGenerator[str, None]:
        """流式聊天对话"""
        model = request.model or self.default_model

        payload = {
            "model": model,
            "messages": self._prepare_messages(request.messages),
            "temperature": request.temperature,
            "stream": True,
        }

        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST", self.api_url, headers=self._prepare_headers(), json=payload
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                import json

                                data = json.loads(data_str)
                                choices = data.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except httpx.HTTPError as e:
            logger.error(f"GLM流式API调用失败: {e}")
            raise Exception(f"GLM流式API调用失败: {str(e)}")
        except Exception as e:
            logger.error(f"GLM流式服务异常: {e}")
            raise Exception(f"GLM流式服务异常: {str(e)}")

    async def text_completion(
        self, request: AITextCompletionRequest
    ) -> AITextCompletionResponse:
        """文本补全"""
        from app.schemas.ai import AIMessage, MessageRole

        chat_request = AIChatRequest(
            provider=self.provider,
            model=request.model,
            messages=[AIMessage(role=MessageRole.USER, content=request.prompt)],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        chat_response = await self.chat(chat_request)

        return AITextCompletionResponse(
            provider=self.provider,
            model=chat_response.model,
            text=chat_response.message.content,
            usage=chat_response.usage,
            finish_reason=chat_response.finish_reason,
        )


class DeepSeekService(BaseAIService):
    """DeepSeek服务实现（OpenAI 兼容接口）"""

    def __init__(self):
        super().__init__(AIProvider.DEEPSEEK)
        self.api_key = settings.DEEPSEEK_API_KEY
        self.api_url = settings.DEEPSEEK_API_URL
        self.default_model = settings.DEEPSEEK_MODEL
        self.timeout = settings.DEEPSEEK_TIMEOUT

    def is_available(self) -> bool:
        return bool(self.api_key)

    def get_model_info(self) -> List[AIModelInfo]:
        return [
            AIModelInfo(
                provider=self.provider,
                model="deepseek-chat",
                display_name="DeepSeek Chat",
                description="DeepSeek聊天模型",
                supports_vision=False,
                max_tokens=4096,
            )
        ]

    def _prepare_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _prepare_messages(self, messages: List[Any]) -> List[Dict[str, Any]]:
        prepared = []
        for msg in messages:
            content = msg.content
            # DeepSeek 文本接口只接受字符串内容，混合内容取文本部分拼接
            if isinstance(content, list):
                parts = []
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        parts.append(item.get("text", ""))
                    elif hasattr(item, "text"):
                        parts.append(getattr(item, "text"))
                content = "\n".join(p for p in parts if p)
            prepared.append({"role": msg.role.value, "content": content})
        return prepared

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        """聊天对话"""
        model = request.model or self.default_model

        payload = {
            "model": model,
            "messages": self._prepare_messages(request.messages),
            "temperature": request.temperature,
            "stream": False,
        }

        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.api_url, headers=self._prepare_headers(), json=payload
                )
                response.raise_for_status()
                data = response.json()

                choices = data.get("choices", [])
                if not choices:
                    raise Exception("API返回空响应")

                choice = choices[0]
                message = choice.get("message", {})
                content = message.get("content", "")

                from app.schemas.ai import AIMessage, MessageRole

                return AIChatResponse(
                    provider=self.provider,
                    model=data.get("model", model),
                    message=AIMessage(role=MessageRole.ASSISTANT, content=content),
                    reasoning_content=message.get("reasoning_content"),
                    usage=data.get("usage"),
                    finish_reason=choice.get("finish_reason"),
                )
        except httpx.HTTPError as e:
            logger.error(f"DeepSeek API调用失败: {e}")
            raise Exception(f"DeepSeek API调用失败: {str(e)}")
        except Exception as e:
            logger.error(f"DeepSeek服务异常: {e}")
            raise Exception(f"DeepSeek服务异常: {str(e)}")

    async def chat_stream(self, request: AIChatRequest) -> AsyncGenerator[str, None]:
        """流式聊天对话"""
        model = request.model or self.default_model

        payload = {
            "model": model,
            "messages": self._prepare_messages(request.messages),
            "temperature": request.temperature,
            "stream": True,
        }

        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST", self.api_url, headers=self._prepare_headers(), json=payload
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                import json

                                data = json.loads(data_str)
                                choices = data.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except httpx.HTTPError as e:
            logger.error(f"DeepSeek流式API调用失败: {e}")
            raise Exception(f"DeepSeek流式API调用失败: {str(e)}")
        except Exception as e:
            logger.error(f"DeepSeek流式服务异常: {e}")
            raise Exception(f"DeepSeek流式服务异常: {str(e)}")

    async def text_completion(
        self, request: AITextCompletionRequest
    ) -> AITextCompletionResponse:
        """文本补全"""
        from app.schemas.ai import AIMessage, MessageRole

        chat_request = AIChatRequest(
            provider=self.provider,
            model=request.model,
            messages=[AIMessage(role=MessageRole.USER, content=request.prompt)],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        chat_response = await self.chat(chat_request)

        return AITextCompletionResponse(
            provider=self.provider,
            model=chat_response.model,
            text=chat_response.message.content,
            usage=chat_response.usage,
            finish_reason=chat_response.finish_reason,
        )


class KimiService(BaseAIService):
    """Kimi服务实现（预留）"""

    def __init__(self):
        super().__init__(AIProvider.KIMI)
        self.api_key = settings.KIMI_API_KEY
        self.api_url = settings.KIMI_API_URL
        self.default_model = settings.KIMI_MODEL
        self.timeout = settings.KIMI_TIMEOUT

    def is_available(self) -> bool:
        return bool(self.api_key)

    def get_model_info(self) -> List[AIModelInfo]:
        return [
            AIModelInfo(
                provider=self.provider,
                model="moonshot-v1-8k",
                display_name="Moonshot v1 8k",
                description="Kimi Moonshot v1 8k模型",
                supports_vision=False,
                max_tokens=8192,
            )
        ]

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        raise NotImplementedError("Kimi服务尚未实现")

    def chat_stream(self, request: AIChatRequest) -> AsyncGenerator[str, None]:
        raise NotImplementedError("Kimi服务尚未实现")

    async def text_completion(
        self, request: AITextCompletionRequest
    ) -> AITextCompletionResponse:
        raise NotImplementedError("Kimi服务尚未实现")


class AIServiceFactory:
    """AI服务工厂类"""

    _services: Dict[AIProvider, BaseAIService] = {}

    @classmethod
    def get_service(cls, provider: Optional[AIProvider] = None) -> BaseAIService:
        """获取AI服务实例"""
        if provider is None:
            provider = AIProvider(settings.AI_DEFAULT_PROVIDER)

        if provider not in cls._services:
            if provider == AIProvider.GLM:
                cls._services[provider] = GLMService()
            elif provider == AIProvider.DEEPSEEK:
                cls._services[provider] = DeepSeekService()
            elif provider == AIProvider.KIMI:
                cls._services[provider] = KimiService()
            else:
                raise ValueError(f"不支持的AI提供商: {provider}")

        return cls._services[provider]

    @classmethod
    def get_providers_info(cls) -> List[AIProviderInfo]:
        """获取所有提供商信息"""
        providers = []

        for provider in AIProvider:
            service = cls.get_service(provider)
            providers.append(
                AIProviderInfo(
                    provider=provider,
                    name=provider.value.upper(),
                    models=service.get_model_info(),
                    is_available=service.is_available(),
                    has_api_key=service.is_available(),
                )
            )

        return providers

    @classmethod
    def get_default_provider(cls) -> AIProvider:
        """获取默认提供商"""
        return AIProvider(settings.AI_DEFAULT_PROVIDER)


# 创建全局AI服务实例
ai_service = AIServiceFactory.get_service()
