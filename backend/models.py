from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    """ユーザーテーブル"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # リレーション
    spots = relationship("Spot", back_populates="owner")
    sent_requests = relationship(
        "Friendship", 
        foreign_keys="Friendship.requester_id", 
        back_populates="requester"
    )
    received_requests = relationship(
        "Friendship", 
        foreign_keys="Friendship.requested_id", 
        back_populates="requested"
    )

class Spot(Base):
    """スポットテーブル"""
    __tablename__ = "spots"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50))  # グルメ、観光、ショッピング、エンターテイメント等
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rating = Column(Float, default=0)  # 1.0-5.0
    address = Column(String(200))  # 住所
    image_path = Column(String(255))  # 画像ファイルパス
    is_public = Column(Boolean, default=True)  # 公開/フレンドのみ
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外部キー
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # リレーション
    owner = relationship("User", back_populates="spots")

class Friendship(Base):
    """フレンド関係テーブル"""
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    requested = relationship("User", foreign_keys=[requested_id], back_populates="received_requests")

class UserPreference(Base):
    """ユーザー設定テーブル（AI推薦用）"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    favorite_categories = Column(String(255))  # JSON形式 例: "グルメ,観光,ショッピング"
    location_range = Column(Float, default=5.0)  # おすすめ検索範囲（km）
    notification_enabled = Column(Boolean, default=True)  # 通知設定
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 今後の拡張用
class SpotComment(Base):
    """スポットコメントテーブル"""
    __tablename__ = "spot_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    rating = Column(Float)  # そのユーザーの評価
    created_at = Column(DateTime, default=datetime.utcnow)

class SpotLike(Base):
    """スポットいいねテーブル"""
    __tablename__ = "spot_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 複合ユニーク制約（同じユーザーが同じスポットに複数いいね不可）
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )