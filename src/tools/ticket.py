"""门票查询工具"""

import os

from tavily import TavilyClient


# 售罄关键词列表
SOLD_OUT_KEYWORDS = [
    "售罄",
    "sold out",
    "无票",
    "暂停售票",
    "已售完",
    "门票已满",
    "余票不足",
]


def is_sold_out(result_text: str) -> bool:
    """检测门票结果是否显示售罄。

    Args:
        result_text: 门票查询结果文本

    Returns:
        True if sold out keywords are found
    """
    result_lower = result_text.lower()
    for keyword in SOLD_OUT_KEYWORDS:
        if keyword.lower() in result_lower:
            return True
    return False


def get_ticket(city: str, attraction: str) -> str:
    """查询某个景点的门票信息（是否有余票及价格）。

    Args:
        city: 城市名称
        attraction: 景点名称

    Returns:
        门票信息描述字符串，售罄时会返回 [SOLD_OUT] 前缀
    """
    api_key = os.environ.get("TAVILY_API_KEY")

    if not api_key:
        return "错误：未配置TAVILY_API_KEY。"

    tavily = TavilyClient(api_key=api_key)
    query = f"{city} {attraction}门票价格 余票 购票"

    try:
        response = tavily.search(query=query, search_depth="basic", include_answer=True)

        if response.get("answer"):
            result = response["answer"]
            if is_sold_out(result):
                return f"[SOLD_OUT]{result}"
            return result

        formatted_results = []
        for result in response.get("results", []):
            content = result["content"]
            if is_sold_out(content):
                formatted_results.append(f"- {result['title']}: {content} [SOLD_OUT]")
            else:
                formatted_results.append(f"- {result['title']}: {content}")

        if not formatted_results:
            return "抱歉，没有找到相关的门票信息。"

        final_result = "根据搜索，为您找到以下门票信息：\n" + "\n".join(
            formatted_results
        )
        if is_sold_out(final_result):
            return f"[SOLD_OUT]{final_result}"
        return final_result

    except Exception as e:
        return f"错误：执行Tavily搜索时出现问题 - {e}"
