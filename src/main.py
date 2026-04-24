"""FastAPI 应用入口"""

from fastapi import FastAPI

from src.api.router import router

app = FastAPI(title="旅行助手 API")

app.include_router(router)


@app.get("/health")
async def health() -> dict:
    """健康检查"""
    return {"status": "ok"}
