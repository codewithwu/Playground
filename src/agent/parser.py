"""动作解析器"""

import re


def parse_action(action_str: str) -> tuple[str, dict]:
    """解析行动字符串。

    Args:
        action_str: 行动字符串

    Returns:
        (工具名称, 参数字典)
    """
    if action_str.startswith("Finish"):
        match = re.match(r"\w+\[(.*)\]", action_str)
        if match:
            return "finish", {"answer": match.group(1)}
        return "finish", {"answer": "任务完成"}

    tool_name_match = re.search(r"(\w+)\(", action_str)
    if not tool_name_match:
        return None, {}

    tool_name = tool_name_match.group(1)
    args_match = re.search(r"\((.*)\)", action_str)
    if args_match:
        args_str = args_match.group(1)
        kwargs = dict(re.findall(r'(\w+)="([^"]*)"', args_str))
    else:
        kwargs = {}

    return tool_name, kwargs
