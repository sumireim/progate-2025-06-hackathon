from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, create_tables
from sqlalchemy.exc import SQLAlchemyError
import sqlite3



# ルーターのインポート
from routers import spots, users , friends

app = FastAPI(title="Spot Share API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"], # バックエンドがエラー出すと CORS ヘッダーが出ないことに注意
    # allow_origins=["*"],
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
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

# SQLiteの初期化（アプリ起動時に1度だけ）
def init_db():
    conn = sqlite3.connect("data/posts.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        genre INTEGER,
        rating REAL,
        likes INTEGER,
        byFriend INTEGER,
        photo_url TEXT,   -- ⭐️ 画像URL追加
        comment TEXT      -- ⭐️ コメント追加
    )
    """)
    # 一度だけ初期データ追加（なければ）
    c.execute("SELECT COUNT(*) FROM posts")
    if c.fetchone()[0] == 0:
        c.executemany("""
                INSERT INTO posts (name, genre, rating, likes, byFriend, photo_url, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                ("カフェくるみ", 0, 3.4, 18, 0, "images/cafe_kurumi.jpg", "内装は可愛いけど普通"),
                ("カフェゆらり", 0, 4.9, 45, 1, "images/cafe_yurari.jpg", "静かな空間で癒される"),
                ("定食いちばん", 3, 2.3, 2, 0, "images/teishoku_ichiban.jpg", "冷めていた"),
                ("ラーメン虎丸", 1, 1.8, 4, 0, "images/ramen_toramaru.jpg", "油が多い"),
                ("ピッツェリアロッソ", 2, 4.7, 40, 1, "images/pizza_rosso.jpg", "石窯ピザの香ばしさ！"),
                ("カレーハウスZZZ", 1, 1.9, 1, 0, "images/curry_zzz.jpg", "水しか美味しくなかった"),
                ("和定食いなほ", 3, 4.6, 35, 1, "images/teishoku_inaho.jpg", "和風だしが絶品"),
                ("スイーツ工房ふわり", 0, 4.9, 60, 1, "images/sweets_fuwari.jpg", "SNS映えスイーツ！"),
                ("イタリアンボーノ", 2, 2.0, 3, 0, "images/italian_buono.jpg", "味が薄い"),
                ("ラーメン武蔵", 1, 4.8, 52, 1, "images/ramen_musashi.jpg", "極太麺が最高"),
                ("イタリアンダイナーAmo", 2, 3.6, 20, 0, "images/italian_amo.jpg", "コスパ普通"),
                ("定食やすらぎ", 3, 3.2, 17, 0, "images/teishoku_yasuragi.jpg", "味は家庭的"),
                ("カレー魂", 1, 3.7, 22, 0, "images/curry_soul.jpg", "辛さが選べる"),
                ("カフェグリーン", 0, 2.1, 5, 0, "images/cafe_green.jpg", "席が狭い"),
                ("ラーメン黒龍", 1, 3.5, 15, 0, "images/ramen_kokuryu.jpg", "味は濃いめ")
            ])
    conn.commit()
    conn.close()

init_db()

#  /posts → SQLiteから読み込んで返す
@app.get("/posts")
def get_posts():
    conn = sqlite3.connect("data/posts.db")
    conn.row_factory = sqlite3.Row  # dictで返すために必要
    c = conn.cursor()
    c.execute("SELECT * FROM posts")
    rows = c.fetchall()
    conn.close()

    return [dict(row) for row in rows]