from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math

from database import get_db
from models import Spot, User
from pydantic import BaseModel

router = APIRouter(prefix="/api/spots", tags=["spots"])

# Pydanticモデル（リクエスト/レスポンス用）
class SpotCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    latitude: float
    longitude: float
    rating: Optional[float] = 0
    address: Optional[str] = None
    is_public: Optional[bool] = True

class SpotUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rating: Optional[float] = None
    address: Optional[str] = None
    is_public: Optional[bool] = None

class SpotResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    latitude: float
    longitude: float
    rating: float
    address: Optional[str]
    is_public: bool
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SpotListResponse(BaseModel):
    spots: List[SpotResponse]
    total: int
    page: int
    per_page: int

# ヘルパー関数：距離計算
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """2点間の距離を計算（km）"""
    R = 6371  # 地球の半径（km）
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) * math.sin(delta_lat / 2) +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) * math.sin(delta_lon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# エンドポイント実装
@router.get("/", response_model=SpotListResponse)
async def get_spots(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: Optional[float] = Query(None, ge=0, le=100),
    db: Session = Depends(get_db)
):
    """スポット一覧取得（検索・絞り込み対応）"""
    
    # 基本クエリ
    query = db.query(Spot).filter(Spot.is_public == True)
    
    # カテゴリ絞り込み
    if category:
        query = query.filter(Spot.category == category)
    
    # 位置絞り込み（後で距離計算）
    spots_query = query
    
    # ページネーション前の総数取得
    total = query.count()
    
    # ページネーション適用
    offset = (page - 1) * per_page
    spots = spots_query.offset(offset).limit(per_page).all()
    
    # 距離フィルタリング（位置指定がある場合）
    if lat is not None and lng is not None and radius is not None:
        filtered_spots = []
        for spot in spots:
            distance = calculate_distance(lat, lng, spot.latitude, spot.longitude)
            if distance <= radius:
                filtered_spots.append(spot)
        spots = filtered_spots
    
    return SpotListResponse(
        spots=spots,
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/{spot_id}", response_model=SpotResponse)
async def get_spot(spot_id: int, db: Session = Depends(get_db)):
    """特定スポット取得"""
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    
    return spot

@router.post("/", response_model=SpotResponse)
async def create_spot(spot: SpotCreate, db: Session = Depends(get_db)):
    """新規スポット投稿"""
    
    # TODO: 認証機能実装後にowner_idを正しく設定
    # 現在は仮のユーザーID（1）を使用
    owner_id = 1
    
    # 仮ユーザーが存在しない場合は作成
    user = db.query(User).filter(User.id == owner_id).first()
    if not user:
        dummy_user = User(
            id=1,
            username="dummy_user",
            email="dummy@example.com",
            hashed_password="dummy_hash",
            display_name="テストユーザー"
        )
        db.add(dummy_user)
        db.commit()
    
    # スポット作成
    db_spot = Spot(
        title=spot.title,
        description=spot.description,
        category=spot.category,
        latitude=spot.latitude,
        longitude=spot.longitude,
        rating=spot.rating,
        address=spot.address,
        is_public=spot.is_public,
        owner_id=owner_id
    )
    
    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)
    
    return db_spot

@router.put("/{spot_id}", response_model=SpotResponse)
async def update_spot(
    spot_id: int, 
    spot_update: SpotUpdate, 
    db: Session = Depends(get_db)
):
    """スポット更新"""
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    
    # TODO: 認証機能実装後に所有者チェック追加
    # if spot.owner_id != current_user.id:
    #     raise HTTPException(status_code=403, detail="権限がありません")
    
    # 更新データの適用
    update_data = spot_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(spot, field, value)
    
    spot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(spot)
    
    return spot

@router.delete("/{spot_id}")
async def delete_spot(spot_id: int, db: Session = Depends(get_db)):
    """スポット削除"""
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    
    # TODO: 認証機能実装後に所有者チェック追加
    
    db.delete(spot)
    db.commit()
    
    return {"message": "スポットを削除しました"}

@router.get("/search/nearby", response_model=List[SpotResponse])
async def get_nearby_spots(
    lat: float = Query(..., description="緯度"),
    lng: float = Query(..., description="経度"),
    radius: float = Query(5.0, ge=0.1, le=50, description="検索半径（km）"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """近くのスポット検索"""
    
    # 全ての公開スポットを取得
    spots = db.query(Spot).filter(Spot.is_public == True).all()
    
    # 距離計算してソート
    spots_with_distance = []
    for spot in spots:
        distance = calculate_distance(lat, lng, spot.latitude, spot.longitude)
        if distance <= radius:
            spots_with_distance.append((spot, distance))
    
    # 距離でソート
    spots_with_distance.sort(key=lambda x: x[1])
    
    # limit適用
    nearby_spots = [spot for spot, distance in spots_with_distance[:limit]]
    
    return nearby_spots

@router.get("/recommend/for-user")
async def get_recommendations(
    user_lat: float = Query(..., description="ユーザーの緯度"),
    user_lng: float = Query(..., description="ユーザーの経度"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """おすすめスポット取得（簡単ロジック）"""
    
    # 現在は距離ベースの簡単なロジック
    # TODO: 後でAI推薦ロジック実装
    
    # 近くの高評価スポットを取得
    spots = db.query(Spot).filter(
        Spot.is_public == True,
        Spot.rating >= 3.0
    ).all()
    
    # 距離計算してソート
    spots_with_distance = []
    for spot in spots:
        distance = calculate_distance(user_lat, user_lng, spot.latitude, spot.longitude)
        # 10km以内 & 評価によるスコア計算
        if distance <= 10:
            score = spot.rating * (10 - distance) / 10  # 距離と評価のスコア
            spots_with_distance.append((spot, score))
    
    # スコアでソート（高い順）
    spots_with_distance.sort(key=lambda x: x[1], reverse=True)
    
    # limit適用
    recommended_spots = [spot for spot, score in spots_with_distance[:limit]]
    
    return {
        "recommendations": recommended_spots,
        "algorithm": "distance_and_rating_based",
        "user_location": {"lat": user_lat, "lng": user_lng}
    }

@router.get("/categories/")
async def get_categories(db: Session = Depends(get_db)):
    """利用可能なカテゴリ一覧取得"""
    # 現在登録されているカテゴリを取得
    categories = db.query(Spot.category).distinct().filter(
        Spot.category.isnot(None),
        Spot.is_public == True
    ).all()
    
    category_list = [cat[0] for cat in categories if cat[0]]
    
    # デフォルトカテゴリも含める
    default_categories = ["グルメ", "観光", "ショッピング", "エンターテイメント", "自然", "文化"]
    all_categories = list(set(category_list + default_categories))
    
    return {"categories": sorted(all_categories)}