#!/usr/bin/env python3
"""
Python 异步编程教程
==================
从基础概念到实际应用，通过代码示例带你理解异步编程

核心概念：
- async/await: 定义协程的关键字
- asyncio: Python 异步编程的核心模块
- await: 等待协程完成
- Event Loop: 事件循环，驱动协程执行
"""

import asyncio
import time


# ============================================================
# 第一部分：基础 - 定义和调用协程
# ============================================================


async def hello():
    """最简单的协程：打印一条消息"""
    print("Hello!")


async def greet(name: str):
    """带参数的协程"""
    print(f"Hello, {name}!")


# ============================================================
# 第二部分：异步等待 - asyncio.sleep
# ============================================================


async def say_after(delay: float, message: str):
    """在指定延迟后打印消息"""
    await asyncio.sleep(delay)
    print(message)


async def demo_basic_async():
    """基础异步示例：顺序执行两个延迟任务"""
    print("=== 基础异步示例 ===")
    print(f"开始时间: {time.strftime('%H:%M:%S')}")

    await say_after(1.0, "你好")
    await say_after(2.0, "世界")

    print(f"结束时间: {time.strftime('%H:%M:%S')}")


# ============================================================
# 第三部分：并发执行 - asyncio.gather
# ============================================================


async def fetch_data(num: int) -> dict:
    """模拟获取数据的协程（带延迟）"""
    print(f"  任务 {num}: 开始获取...")
    await asyncio.sleep(1.0)  # 模拟 I/O 操作
    print(f"  任务 {num}: 完成!")
    return {"id": num, "data": f"数据 {num}"}


async def demo_concurrent():
    """并发执行多个协程"""
    print("\n=== 并发执行示例 ===")
    print(f"开始时间: {time.strftime('%H:%M:%S')}")

    # 并发执行 3 个任务
    results = await asyncio.gather(
        fetch_data(1),
        fetch_data(2),
        fetch_data(3),
    )

    print(f"结束时间: {time.strftime('%H:%M:%S')}")
    print(f"结果: {results}")


# ============================================================
# 第四部分：异步生成器 - yield 配合 asyncio
# ============================================================


async def async_data_stream(n: int):
    """异步生成器：模拟数据流"""
    for i in range(n):
        await asyncio.sleep(0.5)  # 模拟延迟
        yield i  # 使用 yield 而非 return


async def demo_async_generator():
    """使用异步生成器"""
    print("\n=== 异步生成器示例 ===")
    async for item in async_data_stream(5):
        print(f"  收到数据: {item}")


# ============================================================
# 第五部分：异步上下文管理器
# ============================================================


class AsyncResource:
    """异步上下文管理器示例"""

    async def __aenter__(self):
        """进入上下文时调用"""
        print("  [资源] 打开连接...")
        await asyncio.sleep(0.1)  # 模拟连接建立
        print("  [资源] 连接已建立")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """退出上下文时调用"""
        print("  [资源] 关闭连接...")
        await asyncio.sleep(0.1)  # 模拟清理
        print("  [资源] 连接已关闭")

    async def process(self, data: str):
        """模拟处理数据"""
        await asyncio.sleep(0.5)
        return f"处理结果: {data}"


async def demo_async_context_manager():
    """使用异步上下文管理器"""
    print("\n=== 异步上下文管理器示例 ===")
    async with AsyncResource() as resource:
        result = await resource.process("Hello Async")
        print(f"  {result}")


# ============================================================
# 第六部分：Task - 并发调度的核心
# ============================================================


async def periodic_task(task_id: int, interval: float):
    """周期性任务"""
    count = 0
    while count < 3:
        await asyncio.sleep(interval)
        print(f"  任务 {task_id}: 第 {count + 1} 次执行")
        count += 1


async def demo_tasks():
    """使用 asyncio.create_task 并发执行"""
    print("\n=== Task 并发调度示例 ===")
    print(f"开始时间: {time.strftime('%H:%M:%S')}")

    # 创建多个任务（不等待立即执行）
    task1 = asyncio.create_task(periodic_task(1, 0.5))
    task2 = asyncio.create_task(periodic_task(2, 0.7))

    # 等待所有任务完成
    await asyncio.gather(task1, task2)

    print(f"结束时间: {time.strftime('%H:%M:%S')}")


# ============================================================
# 第七部分：异步迭代器实现
# ============================================================


class AsyncCounter:
    """自定义异步迭代器"""

    def __init__(self, max_count: int):
        self.max_count = max_count
        self.current = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.current >= self.max_count:
            raise StopAsyncIteration
        await asyncio.sleep(0.3)
        value = self.current
        self.current += 1
        return value


async def demo_async_iterator():
    """使用自定义异步迭代器"""
    print("\n=== 自定义异步迭代器示例 ===")
    async for i in AsyncCounter(4):
        print(f"  计数: {i}")


# ============================================================
# 第八部分：实际场景 - 异步 HTTP 请求
# ============================================================


async def demo_http_requests():
    """模拟异步 HTTP 请求场景"""
    print("\n=== 异步 HTTP 请求模拟 ===")

    # 模拟多个 API 调用
    urls = [
        "https://api.example.com/users",
        "https://api.example.com/posts",
        "https://api.example.com/comments",
    ]

    async def fake_http_get(url: str) -> str:
        """模拟异步 HTTP GET"""
        await asyncio.sleep(0.5)  # 模拟网络延迟
        return f"响应 from {url}"

    print(f"开始时间: {time.strftime('%H:%M:%S')}")

    # 并发请求所有 URL
    responses = await asyncio.gather(*[fake_http_get(url) for url in urls])

    print(f"结束时间: {time.strftime('%H:%M:%S')}")
    for resp in responses:
        print(f"  {resp}")


# ============================================================
# 第九部分：超时处理 - asyncio.wait_for
# ============================================================


async def slow_operation():
    """模拟耗时操作"""
    await asyncio.sleep(5)
    return "完成!"


async def demo_timeout():
    """设置超时时间"""
    print("\n=== 超时处理示例 ===")
    try:
        # 设置 2 秒超时
        result = await asyncio.wait_for(slow_operation(), timeout=2.0)
        print(f"结果: {result}")
    except asyncio.TimeoutError:
        print("  操作超时! (预期行为)")


# ============================================================
# 第十部分：信号量 - 控制并发数量
# ============================================================


async def limited_task(task_id: int, semaphore: asyncio.Semaphore):
    """带并发限制的任务"""
    async with semaphore:
        print(f"  任务 {task_id} 开始")
        await asyncio.sleep(1.0)
        print(f"  任务 {task_id} 完成")


async def demo_semaphore():
    """使用信号量限制并发数"""
    print("\n=== 信号量并发限制示例 ===")
    # 最多同时运行 2 个任务
    semaphore = asyncio.Semaphore(2)

    tasks = [limited_task(i, semaphore) for i in range(5)]
    await asyncio.gather(*tasks)


# ============================================================
# 第十一部分：锁 - 保护共享资源
# ============================================================


class AsyncCounterWithLock:
    """带锁的异步计数器"""

    def __init__(self):
        self.count = 0
        self._lock = asyncio.Lock()

    async def increment(self, amount: int = 1):
        async with self._lock:
            await asyncio.sleep(0.1)  # 模拟临界区操作
            self.count += amount
            print(f"    当前计数: {self.count}")


async def demo_lock():
    """使用异步锁保护共享资源"""
    print("\n=== 异步锁示例 ===")
    counter = AsyncCounterWithLock()

    # 同时运行 5 个任务，都尝试修改计数器
    tasks = [counter.increment(1) for _ in range(5)]
    await asyncio.gather(*tasks)

    print(f"最终计数: {counter.count} (应该是 5)")


# ============================================================
# 第十二部分：队列 - 生产者/消费者模式
# ============================================================


async def producer(queue: asyncio.Queue, num: int):
    """生产者协程"""
    for i in range(num):
        await asyncio.sleep(0.3)
        item = f"item_{i}"
        await queue.put(item)
        print(f"  生产者: 已添加 {item}")


async def consumer(queue: asyncio.Queue, consumer_id: int):
    """消费者协程"""
    while True:
        item = await queue.get()
        await asyncio.sleep(0.5)  # 模拟处理
        print(f"  消费者 {consumer_id}: 处理 {item}")
        queue.task_done()


async def demo_queue():
    """生产者/消费者模式"""
    print("\n=== 异步队列示例 ===")
    queue = asyncio.Queue()

    # 启动生产者和消费者
    await asyncio.gather(
        producer(queue, 4),
        consumer(queue, 1),
        consumer(queue, 2),
    )


# ============================================================
# 主入口
# ============================================================


async def main():
    """运行所有示例"""
    print("=" * 60)
    print("Python 异步编程教程")
    print("=" * 60)

    # 按顺序运行所有演示
    await hello()
    await greet("学习者")

    await demo_basic_async()
    await demo_concurrent()
    await demo_async_generator()
    await demo_async_context_manager()
    await demo_tasks()
    await demo_async_iterator()
    await demo_http_requests()
    await demo_timeout()
    await demo_semaphore()
    await demo_lock()
    await demo_queue()

    print("\n" + "=" * 60)
    print("教程结束!")
    print("=" * 60)


if __name__ == "__main__":
    """
    运行方式:
    $ python main.py

    或使用 uv (如果你使用 uv 管理项目):
    $ uv run python main.py
    """
    asyncio.run(main())
