from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, create_tables

app = FastAPI(title="Spot Share API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    create_tables()

@app.get("/")
async def root():
    return {"message": "Spot Share API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# TODO: ルーター追加
# app.include_router(spots.router)
# app.include_router(users.router)
# app.include_router(friends.router)


'''
# 1. 必要なライブラリのインポート
# 2. FastAPI アプリケーション作成
# 3. CORS 設定（重要！）
# 4. 起動時の処理
# 5. 基本エンドポイント
# 6. ルーター設定（TODO）
'''

