"""Streamlit 启动入口"""

import os
import sys

# 添加项目根目录到 PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import streamlit as st
from src.agent.memory import UserMemory
from src.agent.runner import run_assistant

# 页面配置
st.set_page_config(
    page_title="旅行智能助手",
    page_icon="🌍",
    layout="wide",
)

# 初始化 session state
if "memory" not in st.session_state:
    st.session_state.memory = UserMemory()

if "consecutive_rejections" not in st.session_state:
    st.session_state.consecutive_rejections = 0

if "messages" not in st.session_state:
    st.session_state.messages = []


def send_message():
    """发送消息给智能体"""
    user_input = st.session_state.user_input.strip()
    if not user_input:
        return

    # 添加用户消息
    st.session_state.messages.append({"role": "user", "content": user_input})
    st.session_state.user_input = ""

    # 调用智能体
    with st.spinner("智能体正在思考..."):
        answer, history, memory, rejections = run_assistant(
            user_input=user_input,
            max_iterations=5,
            display=False,
            memory=st.session_state.memory,
            consecutive_rejections=st.session_state.consecutive_rejections,
        )

    # 更新状态
    st.session_state.memory = memory
    st.session_state.consecutive_rejections = rejections
    st.session_state.history = history

    # 添加助手消息
    st.session_state.messages.append({"role": "assistant", "content": answer})


def reset_chat():
    """重置对话"""
    st.session_state.messages = []
    st.session_state.history = []
    st.session_state.memory.clear()
    st.session_state.consecutive_rejections = 0


# 侧边栏
with st.sidebar:
    st.title("🧭 旅行智能助手")
    st.divider()

    st.subheader("📌 用户偏好")
    if st.session_state.memory.preferences:
        for key, value in st.session_state.memory.preferences.items():
            st.markdown(f"- **{key}**: {value}")
    else:
        st.info("暂无偏好记录")

    st.divider()

    st.subheader("📊 状态")
    st.metric("连续拒绝次数", st.session_state.consecutive_rejections)

    st.divider()

    if st.button("🔄 重置对话", use_container_width=True):
        reset_chat()
        st.rerun()

# 主聊天区域
st.title("🌍 旅行智能助手")

# 显示消息历史
for msg in st.session_state.messages:
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="🤖"):
            st.markdown(msg["content"])

# 欢迎消息
if not st.session_state.messages:
    st.info("👋 您好！我是旅行智能助手，可以帮您：\n\n"
            "- 🌤 查询天气\n"
            "- 🏛 推荐景点\n"
            "- 🎫 查询门票\n\n"
            "请告诉我您想去哪里旅行，或者直接描述您的需求！")

# 聊天输入框
st.chat_input(
    "请输入您的问题...",
    key="user_input",
    on_submit=send_message,
)
