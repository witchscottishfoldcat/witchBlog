from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.rate_limit import SlidingWindowRateLimiter
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIProvider,
    AIProvidersResponse,
    AITextCompletionRequest,
    AITextCompletionResponse,
)
from app.services.ai_service import AIServiceFactory

logger = get_logger(__name__)

router = APIRouter()

# AI 接口限流：付费 API Key 不允许被无限调用
_ai_minute_limiter = SlidingWindowRateLimiter(
    max_events=settings.AI_RATE_LIMIT_PER_MINUTE, window_seconds=60
)
_ai_daily_limiter = SlidingWindowRateLimiter(
    max_events=settings.AI_DAILY_QUOTA_PER_USER, window_seconds=86400
)


def _check_ai_rate_limit(user: User) -> None:
    if user.is_superuser:
        return
    if not _ai_minute_limiter.allow(f"ai-min:{user.id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试",
        )
    if not _ai_daily_limiter.allow(f"ai-day:{user.id}"):
        logger.warning(f"AI 日配额耗尽: user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="今日调用额度已用完",
        )


@router.get("/providers", response_model=AIProvidersResponse)
async def get_providers():
    """获取所有AI提供商信息"""
    try:
        providers = AIServiceFactory.get_providers_info()
        default_provider = AIServiceFactory.get_default_provider()

        return AIProvidersResponse(
            providers=providers, default_provider=default_provider
        )
    except Exception as e:
        logger.error(f"获取提供商信息失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="获取提供商信息失败"
        )


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    request: AIChatRequest,
    current_user: User = Depends(get_current_active_user),
):
    """AI聊天对话"""
    _check_ai_rate_limit(current_user)
    try:
        provider = request.provider or AIServiceFactory.get_default_provider()
        service = AIServiceFactory.get_service(provider)

        if not service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{provider.value}服务不可用，请检查API密钥配置",
            )

        response = await service.chat(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI聊天失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI聊天失败"
        )


@router.post("/chat/stream")
async def chat_stream(
    request: AIChatRequest,
    current_user: User = Depends(get_current_active_user),
):
    """AI流式聊天对话"""
    _check_ai_rate_limit(current_user)
    try:
        provider = request.provider or AIServiceFactory.get_default_provider()
        service = AIServiceFactory.get_service(provider)

        if not service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{provider.value}服务不可用，请检查API密钥配置",
            )

        async def generate():
            try:
                async for chunk in service.chat_stream(request):
                    yield chunk
            except Exception as e:
                # 异常细节只写日志，不回传给客户端
                logger.error(f"流式生成失败: {e}")
                yield "[ERROR]: 生成失败，请稍后再试"

        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI流式聊天失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI流式聊天失败"
        )


@router.post("/completion", response_model=AITextCompletionResponse)
async def text_completion(
    request: AITextCompletionRequest,
    current_user: User = Depends(get_current_active_user),
):
    """AI文本补全"""
    _check_ai_rate_limit(current_user)
    try:
        provider = request.provider or AIServiceFactory.get_default_provider()
        service = AIServiceFactory.get_service(provider)

        if not service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{provider.value}服务不可用，请检查API密钥配置",
            )

        response = await service.text_completion(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI文本补全失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI文本补全失败"
        )


@router.get("/models/{provider}", response_model=list)
async def get_models(provider: AIProvider):
    """获取指定提供商的模型列表"""
    try:
        service = AIServiceFactory.get_service(provider)
        models = service.get_model_info()
        return models
    except Exception as e:
        logger.error(f"获取模型列表失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="获取模型列表失败"
        )
