"""Pydantic 请求/响应模型"""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """聊天请求模型"""

    user_input: str
    max_iterations: int = 5


class ChatResponse(BaseModel):
    """聊天响应模型"""

    answer: str
    history: list[str]


class WeatherResponse(BaseModel):
    """天气查询响应模型"""

    weather: str


class AttractionResponse(BaseModel):
    """景点推荐响应模型"""

    attraction: str


class TicketResponse(BaseModel):
    """门票查询响应模型"""

    ticket: str
