# backend/routers/friends.py 
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
import models

router = APIRouter(prefix="/api/friends", tags=["friends"])

# Pydanticモデル
class FriendRequest(BaseModel):
    username: str  # 招待したいユーザー名

class FriendRequestResponse(BaseModel):
    id: int
    requester_id: int
    requested_id: int
    requester_name: str
    requested_name: str
    status: str
    created_at: str
    
    class Config:
        from_attributes = True

class UserSearchResponse(BaseModel):
    id: int
    username: str
    display_name: str
    is_friend: bool
    request_status: Optional[str] = None  # pending, sent, received
    
    class Config:
        from_attributes = True

class FriendResponse(BaseModel):
    id: int
    username: str
    display_name: str
    
    class Config:
        from_attributes = True

def get_current_user_id(
    username: str = Query(..., description="現在のユーザー名"),
    db: Session = Depends(get_db)
) -> int:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ユーザー '{username}' が見つかりません"
        )
    return user.id

@router.get("/search")
async def search_users(
    query: str,
    username: str = Query(...),
    # current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(username=username, db=db)
    """ユーザー検索"""
    if len(query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="検索キーワードは2文字以上で入力してください"
        )
    
    # ユーザー検索（自分以外）
    users = db.query(models.User).filter(
        models.User.id != current_user_id,
        or_(
            models.User.username.contains(query),
            models.User.display_name.contains(query)
        )
    ).limit(10).all()
    
    result = []
    for user in users:
        # フレンド関係をチェック
        friendship = db.query(models.Friendship).filter(
            or_(
                and_(
                    models.Friendship.requester_id == current_user_id,
                    models.Friendship.requested_id == user.id
                ),
                and_(
                    models.Friendship.requester_id == user.id,
                    models.Friendship.requested_id == current_user_id
                )
            )
        ).first()
        
        is_friend = False
        request_status = None
        
        if friendship:
            if friendship.status == "accepted":
                is_friend = True
            elif friendship.requester_id == current_user_id:
                request_status = "sent"
            else:
                request_status = "received"
        
        result.append(UserSearchResponse(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            is_friend=is_friend,
            request_status=request_status
        ))
    
    return {"users": result}

@router.post("/request")
async def send_friend_request(
    request_data: FriendRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """フレンド申請送信"""
    
    # 申請先ユーザー検索
    target_user = db.query(models.User).filter(
        models.User.username == request_data.username
    ).first()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )
    
    if target_user.id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身にフレンド申請はできません"
        )
    
    # 既存の申請をチェック
    existing_request = db.query(models.Friendship).filter(
        or_(
            and_(
                models.Friendship.requester_id == current_user_id,
                models.Friendship.requested_id == target_user.id
            ),
            and_(
                models.Friendship.requester_id == target_user.id,
                models.Friendship.requested_id == current_user_id
            )
        )
    ).first()
    
    if existing_request:
        if existing_request.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="既にフレンドです"
            )
        elif existing_request.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="既にフレンド申請を送信済みです"
            )
    
    # フレンド申請作成
    friend_request = models.Friendship(
        requester_id=current_user_id,
        requested_id=target_user.id,
        status="pending"
    )
    
    db.add(friend_request)
    db.commit()
    db.refresh(friend_request)
    
    return {
        "message": f"{target_user.display_name}さんにフレンド申請を送信しました",
        "request_id": friend_request.id
    }

@router.get("/requests/received")
async def get_received_requests(
    username: str = Query(...),
    # current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(username=username, db=db)
    """受信したフレンド申請一覧"""
    
    requests = db.query(models.Friendship).filter(
        models.Friendship.requested_id == current_user_id,
        models.Friendship.status == "pending"
    ).all()
    
    result = []
    for req in requests:
        requester = db.query(models.User).filter(models.User.id == req.requester_id).first()
        result.append(FriendRequestResponse(
            id=req.id,
            requester_id=req.requester_id,
            requested_id=req.requested_id,
            requester_name=requester.display_name,
            requested_name="あなた",
            status=req.status,
            created_at=req.created_at.isoformat()
        ))
    
    return {"requests": result}

@router.get("/requests/sent")
async def get_sent_requests(
    username: str = Query(...),
    # current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(username=username, db=db)
    """送信したフレンド申請一覧"""
    
    requests = db.query(models.Friendship).filter(
        models.Friendship.requester_id == current_user_id,
        models.Friendship.status == "pending"
    ).all()
    
    result = []
    for req in requests:
        requested = db.query(models.User).filter(models.User.id == req.requested_id).first()
        result.append(FriendRequestResponse(
            id=req.id,
            requester_id=req.requester_id,
            requested_id=req.requested_id,
            requester_name="あなた",
            requested_name=requested.display_name,
            status=req.status,
            created_at=req.created_at.isoformat()
        ))
    
    return {"requests": result}

@router.post("/requests/{request_id}/accept")
async def accept_friend_request(
    request_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """フレンド申請承認"""
    
    friend_request = db.query(models.Friendship).filter(
        models.Friendship.id == request_id,
        models.Friendship.requested_id == current_user_id,
        models.Friendship.status == "pending"
    ).first()
    
    if not friend_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="フレンド申請が見つかりません"
        )
    
    # ステータス更新
    friend_request.status = "accepted"
    db.commit()
    
    # 申請者の情報取得
    requester = db.query(models.User).filter(models.User.id == friend_request.requester_id).first()
    
    return {
        "message": f"{requester.display_name}さんとフレンドになりました",
        "friend": FriendResponse(
            id=requester.id,
            username=requester.username,
            display_name=requester.display_name
        )
    }

@router.post("/requests/{request_id}/reject")
async def reject_friend_request(
    request_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """フレンド申請拒否"""
    
    friend_request = db.query(models.Friendship).filter(
        models.Friendship.id == request_id,
        models.Friendship.requested_id == current_user_id,
        models.Friendship.status == "pending"
    ).first()
    
    if not friend_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="フレンド申請が見つかりません"
        )
    
    # ステータス更新
    friend_request.status = "rejected"
    db.commit()
    
    return {"message": "フレンド申請を拒否しました"}

@router.get("/")
async def get_friends(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """フレンド一覧取得"""
    
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == current_user_id,
            models.Friendship.requested_id == current_user_id
        ),
        models.Friendship.status == "accepted"
    ).all()
    
    friends = []
    for friendship in friendships:
        if friendship.requester_id == current_user_id:
            friend_id = friendship.requested_id
        else:
            friend_id = friendship.requester_id
        
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        friends.append(FriendResponse(
            id=friend.id,
            username=friend.username,
            display_name=friend.display_name
        ))
    
    return {"friends": friends}

@router.delete("/{friend_id}")
async def remove_friend(
    friend_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """フレンド削除"""
    
    friendship = db.query(models.Friendship).filter(
        or_(
            and_(
                models.Friendship.requester_id == current_user_id,
                models.Friendship.requested_id == friend_id
            ),
            and_(
                models.Friendship.requester_id == friend_id,
                models.Friendship.requested_id == current_user_id
            )
        ),
        models.Friendship.status == "accepted"
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="フレンド関係が見つかりません"
        )
    
    db.delete(friendship)
    db.commit()
    
    return {"message": "フレンドを削除しました"}