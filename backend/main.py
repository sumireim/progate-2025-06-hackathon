from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, create_tables
from sqlalchemy.exc import SQLAlchemyError

from dotenv import load_dotenv
load_dotenv()  # .env ファイルの読み込み

# ルーターのインポート
from routers import spots, users , friends

app = FastAPI(title="Spot Share API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"], # バックエンドがエラー出すと CORS ヘッダーが出ないことに注意
    # allow_origins=["*"],
    allow_origins=["http://localhost:3000"],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(spots.router)
app.include_router(users.router)
app.include_router(friends.router)

@app.on_event("startup")
async def startup_event():
    print("Starting Spot Share API...")
    create_tables()
    print("Database tables created")

@app.get("/")
async def root():
    return {
        "message": "Spot Share API is running!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health", status_code=200)
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "api_version": "1.0.0"
        }
    except SQLAlchemyError as e:
        print("DB接続失敗:", e)
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
