from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class AIProvider(str, Enum):
    """AI提供商枚举"""

    GLM = "glm"
    DEEPSEEK = "deepseek"
    KIMI = "kimi"


class MessageRole(str, Enum):
    """消息角色枚举"""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ImageContent(BaseModel):
    """图片内容模型"""

    type: str = Field("image_url", description="内容类型")
    image_url: Dict[str, str] = Field(..., description="图片URL配置")


class TextContent(BaseModel):
    """文本内容模型"""

    type: str = Field("text", description="内容类型")
    text: str = Field(..., description="文本内容")


class AIMessage(BaseModel):
    """AI消息模型"""

    role: MessageRole = Field(..., description="消息角色")
    content: Union[str, List[Union[TextContent, ImageContent]]] = Field(
        ..., description="消息内容，支持纯文本或混合内容（文本+图片）"
    )


class AIChatRequest(BaseModel):
    """AI聊天请求模型"""

    provider: Optional[AIProvider] = Field(None, description="AI提供商，不填则使用默认")
    model: Optional[str] = Field(None, description="模型名称，不填则使用默认模型")
    messages: List[AIMessage] = Field(..., min_length=1, description="消息列表")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: Optional[int] = Field(None, ge=1, description="最大生成token数")
    stream: Optional[bool] = Field(False, description="是否使用流式输出")

    @validator("messages")
    def validate_messages(cls, v):
        if not v:
            raise ValueError("消息列表不能为空")

        messages = []
        for msg in v:
            if isinstance(msg, dict):
                messages.append(AIMessage(**msg))
            else:
                messages.append(msg)

        return messages


class AIChatResponse(BaseModel):
    """AI聊天响应模型"""

    provider: AIProvider = Field(..., description="使用的AI提供商")
    model: str = Field(..., description="使用的模型")
    message: AIMessage = Field(..., description="AI回复消息")
    reasoning_content: Optional[str] = Field(
        None, description="推理内容（部分模型如GLM-4.6V-Flash提供）"
    )
    usage: Optional[Dict[str, Any]] = Field(None, description="token使用情况")
    finish_reason: Optional[str] = Field(None, description="结束原因")


class AIStreamResponse(BaseModel):
    """AI流式响应模型"""

    provider: AIProvider = Field(..., description="使用的AI提供商")
    model: str = Field(..., description="使用的模型")
    delta: Optional[str] = Field(None, description="增量内容")
    finish_reason: Optional[str] = Field(None, description="结束原因")


class AIModelInfo(BaseModel):
    """AI模型信息模型"""

    provider: AIProvider = Field(..., description="AI提供商")
    model: str = Field(..., description="模型名称")
    display_name: str = Field(..., description="显示名称")
    description: str = Field(..., description="模型描述")
    supports_vision: bool = Field(False, description="是否支持视觉")
    max_tokens: Optional[int] = Field(None, description="最大token数")


class AIProviderInfo(BaseModel):
    """AI提供商信息模型"""

    provider: AIProvider = Field(..., description="AI提供商")
    name: str = Field(..., description="提供商名称")
    models: List[AIModelInfo] = Field(default_factory=list, description="支持的模型列表")
    is_available: bool = Field(False, description="是否可用")
    has_api_key: bool = Field(False, description="是否配置了API密钥")


class AIProvidersResponse(BaseModel):
    """AI提供商列表响应模型"""

    providers: List[AIProviderInfo] = Field(default_factory=list, description="提供商列表")
    default_provider: AIProvider = Field(..., description="默认提供商")


class AITextCompletionRequest(BaseModel):
    """AI文本补全请求模型"""

    provider: Optional[AIProvider] = Field(None, description="AI提供商")
    model: Optional[str] = Field(None, description="模型名称")
    prompt: str = Field(..., min_length=1, description="提示词")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: Optional[int] = Field(None, ge=1, description="最大生成token数")


class AITextCompletionResponse(BaseModel):
    """AI文本补全响应模型"""

    provider: AIProvider = Field(..., description="使用的AI提供商")
    model: str = Field(..., description="使用的模型")
    text: str = Field(..., description="生成的文本")
    usage: Optional[Dict[str, Any]] = Field(None, description="token使用情况")
    finish_reason: Optional[str] = Field(None, description="结束原因")


class AIImageRequest(BaseModel):
    """AI图像生成请求模型（预留）"""

    provider: Optional[AIProvider] = Field(None, description="AI提供商")
    model: Optional[str] = Field(None, description="模型名称")
    prompt: str = Field(..., min_length=1, description="提示词")
    size: Optional[str] = Field("1024x1024", description="图像尺寸")
    n: Optional[int] = Field(1, ge=1, le=4, description="生成数量")


class AIImageResponse(BaseModel):
    """AI图像生成响应模型（预留）"""

    provider: AIProvider = Field(..., description="使用的AI提供商")
    model: str = Field(..., description="使用的模型")
    images: List[str] = Field(default_factory=list, description="生成的图像URL列表")
