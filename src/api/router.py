"""API 路由定义"""

from fastapi import APIRouter

from src.api.schemas import (
    ChatRequest,
    ChatResponse,
    WeatherResponse,
    AttractionResponse,
    TicketResponse,
)
from src.agent.runner import run_assistant_async
from src.agent.memory import UserMemory
from src.tools import get_weather, get_attraction, get_ticket

# 全局用户记忆实例（跨请求共享）
_user_memory = UserMemory()
# 全局连续拒绝计数器
_consecutive_rejections = 0

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """运行完整 Agent 对话"""
    global _consecutive_rejections

    answer, history, _, _consecutive_rejections = await run_assistant_async(
        user_input=request.user_input,
        max_iterations=request.max_iterations,
        memory=_user_memory,
        consecutive_rejections=_consecutive_rejections,
    )
    return ChatResponse(answer=answer, history=history)


@router.get("/weather", response_model=WeatherResponse)
async def weather(city: str) -> WeatherResponse:
    """查询天气"""
    weather_result = get_weather(city=city)
    return WeatherResponse(weather=weather_result)


@router.get("/attraction", response_model=AttractionResponse)
async def attraction(city: str, weather: str) -> AttractionResponse:
    """查询景点推荐"""
    attraction_result = get_attraction(city=city, weather=weather)
    return AttractionResponse(attraction=attraction_result)


@router.get("/ticket", response_model=TicketResponse)
async def ticket(city: str, attraction: str) -> TicketResponse:
    """查询景点门票信息"""
    ticket_result = get_ticket(city=city, attraction=attraction)
    return TicketResponse(ticket=ticket_result)


@router.post("/reset")
async def reset() -> dict:
    """重置会话状态（清空记忆和拒绝计数）"""
    global _consecutive_rejections
    _user_memory.clear()
    _consecutive_rejections = 0
    return {"status": "reset"}


@router.get("/memory")
async def get_memory() -> dict:
    """获取当前用户偏好记忆"""
    return {"preferences": _user_memory.preferences}


@router.get("/rejections")
async def get_rejections() -> dict:
    """获取当前连续拒绝次数"""
    return {"consecutive_rejections": _consecutive_rejections}
