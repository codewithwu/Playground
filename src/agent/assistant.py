"""智能助手类"""

from src.llm.client import OpenAICompatibleClient
from src.agent.memory import UserMemory
from src.config import MODEL_ID, API_KEY, BASE_URL


class TravelAssistant:
    """智能旅行助手类"""

    def __init__(self, memory: UserMemory | None = None):
        self.llm = OpenAICompatibleClient(
            model=MODEL_ID, api_key=API_KEY, base_url=BASE_URL
        )
        self.prompt_history = []
        self.memory = memory if memory is not None else UserMemory()

    def reset(self):
        """重置对话历史"""
        self.prompt_history = []

    def add_user_message(self, message: str):
        """添加用户消息到历史"""
        self.prompt_history.append(f"用户请求: {message}")

    def add_assistant_message(self, message: str):
        """添加助手消息到历史"""
        self.prompt_history.append(message)

    def add_observation(self, observation: str):
        """添加观察结果到历史"""
        self.prompt_history.append(f"Observation: {observation}")
