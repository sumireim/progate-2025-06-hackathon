# バックエンド側構成のメモ

## models.py

#### 1. 必要なライブラリをインポート
#### 2. User テーブル（ユーザー情報）
#### 3. Spot テーブル（スポット情報）
#### 4. Friendship テーブル（フレンド関係）
#### 5. UserPreference テーブル（ユーザー設定）
#### 6. 将来拡張用テーブル

### データ型定義

```
Column      ← テーブルの列（カラム）を定義
Integer     ← 整数型（id、数量など）
String      ← 文字列型（名前、メールなど）
Float       ← 小数点型（緯度経度、評価など）
DateTime    ← 日時型（作成日時など）
Text        ← 長い文字列型（説明文など）
Boolean     ← 真偽値型（公開/非公開など）
ForeignKey  ← 外部キー（他のテーブルとの関連）
```

### User テーブル（ユーザー情報）
### Spot テーブル（スポット情報）
### Friendship テーブル（フレンド関係）
### UserPreference テーブル（AI推薦用）

## routers/spots.py
APIエンドポイントを作るための準備

#### 1. Pydantic モデル（データ型定義）
#### 2. ヘルパー関数（距離計算）
#### 3. CRUD API（作成・読取・更新・削除）
#### 4. 検索・推薦 API

### Pydantic モデル

Pydantic モデルで API 専用の型を定義
#### 1. 必要な項目のみ受け取り
#### 2. 自動バリデーション
#### 3. API仕様書に自動反映

#### SpotCreate - 新規投稿用
#### SpotUpdate - 更新用
#### SpotResponse - レスポンス用
#### SpotListResponse - 一覧用

### ヘルパー関数（距離計算）
- 度からラジアンに変換
- 角度差を計算
- Haversine公式適用
- 距離に変換

### 基本CRUD API
- GET /api/spots/ - スポット一覧取得
- POST /api/spots/ - 新規スポット投稿
- PUT /api/spots/{spot_id} - スポット更新

### 検索・推薦 API
- GET /api/spots/search/nearby - 近くのスポット検索
- GET /api/spots/recommend/for-user - おすすめスポット


### 実際のAPI呼び出し例
- スポット投稿

```
curl -X POST "http://localhost:8000/api/spots/" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "美味しいラーメン屋",
       "description": "濃厚とんこつが絶品！",
       "category": "グルメ",
       "latitude": 35.6762,
       "longitude": 139.6503,
       "rating": 4.5
     }'

```
- 近くのスポット検索
`curl "http://localhost:8000/api/spots/search/nearby?lat=35.6762&lng=139.6503&radius=5&limit=10"`

- おすすめスポット取得
`curl "http://localhost:8000/api/spots/recommend/for-user?user_lat=35.6762&user_lng=139.6503&limit=5"`