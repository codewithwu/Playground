"""用户偏好记忆模块"""


class UserMemory:
    """用户偏好记忆类"""

    def __init__(self):
        self.preferences: dict[str, str] = {}

    def add_preference(self, key: str, value: str) -> None:
        """添加或更新偏好"""
        self.preferences[key] = value

    def remove_preference(self, key: str) -> None:
        """移除偏好"""
        self.preferences.pop(key, None)

    def get_preference(self, key: str) -> str | None:
        """获取单个偏好"""
        return self.preferences.get(key)

    def get_context(self) -> str:
        """获取偏好上下文字符串，用于注入 prompt"""
        if not self.preferences:
            return ""
        preference_str = "，".join(f"{k}={v}" for k, v in self.preferences.items())
        return f"[用户已知偏好：{preference_str}]"

    def clear(self) -> None:
        """清空所有偏好"""
        self.preferences.clear()
