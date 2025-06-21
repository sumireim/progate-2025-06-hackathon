from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 環境変数DATABASE_URLを使う。なければSQLiteをデフォルトに
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./data/spots.db"
)

# MySQLの場合はconnect_args不要、SQLiteは特別対応
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DBセッション取得用
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# テーブル作成（初回のみ実行）
def create_tables():
    Base.metadata.create_all(bind=engine)
