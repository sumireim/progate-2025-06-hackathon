from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from database import get_db
import models
from datetime import datetime, timedelta
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

router = APIRouter(prefix="/api/users", tags=["users"])

# パスワードハッシュ化
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydanticモデル（リクエスト・レスポンス用）
class UserRegister(BaseModel):
    username: str
    password: str
    display_name: str = None

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    created_at: str
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# パスワードハッシュ化関数
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# トークンからユーザーを取得する関数例
async def get_current_user(token: str = Security(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ユーザー登録
@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    # ユーザー名の重複チェック
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このユーザー名は既に使用されています"
        )
    
    # パスワードハッシュ化
    hashed_password = hash_password(user_data.password)
    
    # 表示名の設定（未設定の場合はユーザー名を使用）
    display_name = user_data.display_name or user_data.username
    
    # ユーザー作成
    new_user = models.User(
        username=user_data.username,
        hashed_password=hashed_password,
        display_name=display_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        display_name=new_user.display_name,
        created_at=new_user.created_at.isoformat()
    )

# ユーザーログイン
@router.post("/login")
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    
    # ユーザー検索
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー名またはパスワードが正しくありません"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            created_at=user.created_at.isoformat()
        )
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        created_at=current_user.created_at.isoformat()
    )
    

# ユーザー一覧取得（開発・テスト用）
@router.get("/", response_model=list[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.is_active == True).all()
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            created_at=user.created_at.isoformat()
        )
        for user in users
    ]