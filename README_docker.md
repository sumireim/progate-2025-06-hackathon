# Dockerのメモ

## docker-compose.yml

### 起動
`docker-compose up --build`

### バックエンド
- backend/Dockerfile でPythonイメージ作成
- FastAPI アプリが 8000番ポートで起動
- ./backend と ./data フォルダが同期される


### フロントエンド

- nginx:alpine イメージをダウンロード
- Nginx が 80番ポートで起動
- ./frontend フォルダが公開される

### ネットワーク

PC ←→ Backend(8000) ←→ Database(SQLite)

PC ←→ Frontend(3000)


## 開発フロー

### 1. 起動
`docker-compose up`

### 2. 開発
- backend/main.py を編集 → API自動再起動
- frontend/index.html を編集 → ブラウザで即確認

### 3. 停止
`docker-compose down`



## backend/Dockerfile

Pythonアプリが動くコンテナを作る設計書

### 1. ベースイメージ選択
### 2. 作業ディレクトリ設定  
### 3. 依存関係インストール
### 4. アプリコードコピー
### 5. 起動コマンド設定

### 1行目について
```
python:3.9        - 約 900MB（フル版）
python:3.9-slim   - 約 120MB（必要最小限）
python:3.9-alpine - 約 45MB（最軽量、但し一部ライブラリで問題出る場合あり）
```

### コピーされるファイル

```
backend/
├── main.py          → /app/main.py
├── models.py        → /app/models.py  
├── database.py      → /app/database.py
├── routers/         → /app/routers/
└── tests/           → /app/tests/
```


## backend/requirements.txt
Pythonで必要なライブラリとそのバージョンのリスト




## docker-compose up 実行時の詳細な流れ
```
1. Docker コンテナ起動
   ├─ Python環境準備
   ├─ 依存関係インストール
   └─ uvicorn main:app 実行

2. FastAPI アプリケーション初期化
   ├─ app = FastAPI(...) 実行
   ├─ CORS ミドルウェア追加
   └─ ルーター登録

3. startup_event() 実行
   ├─ Starting Spot Share API...
   ├─ create_tables() → SQL実行
   └─ Database tables created

4. API サーバー開始
   ├─ INFO: Uvicorn running on http://0.0.0.0:8000
   └─ エンドポイント利用可能

5. ヘルスチェック確認
   curl http://localhost:8000/health
   → {"status": "healthy", ...}
```

## 情報共有

### API 基本情報
- URL: http://localhost:8000
- API仕様書: http://localhost:8000/docs
- ヘルスチェック: http://localhost:8000/health

### 利用可能エンドポイント
- GET  /api/spots/              - スポット一覧
- POST /api/spots/              - スポット投稿
- GET  /api/spots/search/nearby - 近くのスポット検索
