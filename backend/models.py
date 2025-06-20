from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class User(Base):
    """
    ユーザーテーブル
    # ユーザー登録・ログイン
    # プロフィール表示
    - ユーザーの投稿したスポット一覧
    - 送信した友達申請リスト
    - 受信した友達申請リスト
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100)) # 表示名 補助
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True) # アカウント無効化 補助
    
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
    """
    スポットテーブル
    # 地図上にスポット表示
    # カテゴリ別検索
    """
    __tablename__ = "spots"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50)) 
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rating = Column(Float, default=0)  # 1.0-5.0 星評価
    address = Column(String(200))  # 住所
    image_path = Column(String(255))  # 画像ファイルパス
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    visibility = Column(String(20), default="friends_only") # 友達だけ
    # 外部キー
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # リレーション
    owner = relationship("User", back_populates="spots")

class Friendship(Base):
    """
    フレンド関係テーブル
    # 友達申請・承認
    # 友達一覧表示
    """
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # リレーション
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    requested = relationship("User", foreign_keys=[requested_id], back_populates="received_requests")


class RealtimePost(Base):
    """リアルタイム情報投稿テーブル"""
    __tablename__ = "realtime_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=True)  # 既存スポットに関連する場合
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)  # 「今混雑してます」「タイムセール中」など
    expires_at = Column(DateTime)  # リアルタイム情報の有効期限
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# 以下これから実装
class SpotLike(Base):
    """スポットいいねテーブル"""
    __tablename__ = "spot_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # 複合ユニーク制約（同じユーザーが同じスポットに複数いいね不可）
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )