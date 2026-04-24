"""Agent 运行器"""

import re

from src.config import AGENT_SYSTEM_PROMPT
from src.agent.assistant import TravelAssistant
from src.agent.memory import UserMemory
from src.agent.parser import parse_action
from src.tools import get_weather, get_attraction, get_ticket


AVAILABLE_TOOLS = {
    "get_weather": get_weather,
    "get_attraction": get_attraction,
    "get_ticket": get_ticket,
}

# 拒绝关键词列表
REJECTION_KEYWORDS = [
    "不要",
    "不用",
    "不去",
    "不行",
    "不好",
    "拒绝",
    "换一个",
    "换别的",
    "其他",
    "另选",
    "算了",
    "还是算了",
    "不感兴趣",
    "没兴趣",
    "不好玩",
    "无聊",
    "没意思",
]

# 连续拒绝阈值
REJECTION_THRESHOLD = 3


def _is_rejection(text: str) -> bool:
    """检测文本是否包含拒绝表达。

    Args:
        text: 文本

    Returns:
        True if rejection is detected
    """
    text_lower = text.lower()
    for keyword in REJECTION_KEYWORDS:
        if keyword.lower() in text_lower:
            return True
    return False


def _get_rejection_strategy() -> str:
    """获取策略调整提示。

    Returns:
        策略调整提示文本
    """
    return """[策略调整] 用户已连续拒绝多个推荐，请反思并调整推荐策略：
1. 暂停直接推荐，先询问用户真正想要什么类型的景点（文化/自然/娱乐/亲子等）
2. 了解用户的具体预算范围、出行人数、时间安排
3. 建议通过提问了解用户需求，而非直接推荐
4. 避免重复推荐同类景点，考虑不同类型的目的地"""


def _extract_preferences(answer: str) -> list[tuple[str, str]]:
    """从答案中提取用户偏好。

    Args:
        answer: 最终答案

    Returns:
        [(key, value), ...] 偏好列表
    """
    preferences = []
    # 匹配 "偏好类型=历史文化" 或 "预算范围=200-500元" 等格式
    pattern = r"([^\s=]+)=([^\s，,。]+)"
    for match in re.finditer(pattern, answer):
        key, value = match.groups()
        if key not in ["答案", "回答", "最终答案"]:
            preferences.append((key, value))
    return preferences


def run_assistant(
    user_input: str,
    max_iterations: int = 5,
    display: bool = True,
    memory: UserMemory | None = None,
    consecutive_rejections: int = 0,
) -> tuple[str, list[str], UserMemory, int]:
    """运行旅行助手的主函数。

    Args:
        user_input: 用户输入的问题
        max_iterations: 最大循环次数
        display: 是否显示对话历史
        memory: 用户偏好记忆（会更新）
        consecutive_rejections: 连续拒绝次数（来自上一次对话）

    Returns:
        (最终答案, 完整的对话历史, 更新后的记忆, 当前的连续拒绝次数)
    """
    if memory is None:
        memory = UserMemory()

    assistant = TravelAssistant(memory=memory)
    assistant.add_user_message(user_input)

    # 检测用户输入是否包含拒绝表达
    current_rejections = consecutive_rejections
    if _is_rejection(user_input):
        current_rejections += 1
        if display:
            print(f"⚠️ 检测到用户拒绝，当前连续拒绝次数: {current_rejections}")
    else:
        current_rejections = 0

    if display:
        print(f"👤 用户输入: {user_input}")
        print("=" * 50)

    for i in range(max_iterations):
        if display:
            print(f"\n🔄 循环 {i + 1}/{max_iterations}")

        # 检测是否需要注入策略调整
        strategy_hint = ""
        if current_rejections >= REJECTION_THRESHOLD:
            strategy_hint = _get_rejection_strategy()
            if display:
                print("🤔 检测到连续拒绝，开始策略调整...")

        # 构建 prompt 时注入记忆上下文和策略提示
        memory_context = assistant.memory.get_context()
        prompt_parts = []

        if strategy_hint:
            prompt_parts.append(strategy_hint)
        if memory_context:
            prompt_parts.append(memory_context)
        prompt_parts.append("\n".join(assistant.prompt_history))

        full_prompt = "\n".join(prompt_parts)

        llm_output = assistant.llm.generate(full_prompt, AGENT_SYSTEM_PROMPT)

        match = re.search(
            r"(Thought:.*?Action:.*?)(?=\n\s*(?:Thought:|Action:|Observation:)|\Z)",
            llm_output,
            re.DOTALL,
        )
        if match:
            truncated = match.group(1).strip()
            if truncated != llm_output.strip():
                llm_output = truncated
                if display:
                    print("⚠️ 已截断多余的 Thought-Action 对")

        assistant.add_assistant_message(llm_output)

        if display:
            print(f"🤖 模型输出:\n{llm_output}")

        action_match = re.search(r"Action: (.*)", llm_output, re.DOTALL)
        if not action_match:
            observation = (
                "错误: 未能解析到 Action 字段。"
                "请确保你的回复严格遵循 'Thought: ... Action: ...' 的格式。"
            )
            observation_str = f"Observation: {observation}"
            if display:
                print(f"{observation_str}\n" + "=" * 40)
            assistant.prompt_history.append(observation_str)
            continue

        action_str = action_match.group(1).strip()
        tool_name, kwargs = parse_action(action_str)

        if tool_name == "finish":
            final_answer = kwargs.get("answer", "任务完成")
            if display:
                print("🎉 任务完成!")
                print(f"📋 最终答案: {final_answer}")

            # 从答案中提取用户偏好并更新记忆
            extracted_prefs = _extract_preferences(final_answer)
            for key, value in extracted_prefs:
                assistant.memory.add_preference(key, value)

            return final_answer, assistant.prompt_history, assistant.memory, current_rejections

        if tool_name in AVAILABLE_TOOLS:
            if display:
                print(f"🛠️  调用工具: {tool_name}({kwargs})")
            observation = AVAILABLE_TOOLS[tool_name](**kwargs)

            # 检测门票售罄，自动推荐备选景点
            if tool_name == "get_ticket" and "[SOLD_OUT]" in observation:
                if display:
                    print("⚠️ 检测到门票售罄，正在搜索备选景点...")

                # 提取城市作为备选搜索的参考
                original_city = kwargs.get("city", "")

                # 调用景点推荐工具搜索备选
                alternative_result = get_attraction(
                    city=original_city,
                    weather="未知",  # 不知道天气，用占位符
                )
                observation = f"{observation}\n\n[自动备选推荐]\n{alternative_result}"
        else:
            observation = f"错误：未定义的工具 '{tool_name}'"

        if display:
            print(f"📊 观察结果: {observation}")
            print("=" * 50)

        assistant.add_observation(observation)

    timeout_answer = (
        "抱歉，经过多次尝试仍未完成您的请求。请尝试简化您的问题或稍后重试。"
    )
    if display:
        print(f"⏰ 达到最大循环次数: {timeout_answer}")

    return timeout_answer, assistant.prompt_history, assistant.memory, current_rejections


async def run_assistant_async(
    user_input: str,
    max_iterations: int = 5,
    memory: UserMemory | None = None,
    consecutive_rejections: int = 0,
) -> tuple[str, list[str], UserMemory, int]:
    """异步运行旅行助手的主函数（API 模式）。

    Args:
        user_input: 用户输入的问题
        max_iterations: 最大循环次数
        memory: 用户偏好记忆
        consecutive_rejections: 连续拒绝次数

    Returns:
        (最终答案, 完整的对话历史, 更新后的记忆, 当前的连续拒绝次数)
    """
    return run_assistant(
        user_input=user_input,
        max_iterations=max_iterations,
        display=False,
        memory=memory,
        consecutive_rejections=consecutive_rejections,
    )
