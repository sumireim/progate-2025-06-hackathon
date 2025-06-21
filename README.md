# progete-2025-06-hackathon

## テーマ
地域のおすすめスポット共有アプリ


## 概要
友達や知り合いとおすすめスポットを共有できるWebアプリケーションです。
地図上にスポットを投稿し、カテゴリ別の検索や近くのおすすめ機能を提供します。


## プロジェクト構成



```
progete-2025-06-hackathon/
├── docker-compose.yml           # Docker サービス定義
├── README.md                    # プロジェクト説明書
├── backend/                     # バックエンドAPI
│   ├── Dockerfile               # バックエンド用Dockerイメージ
│   ├── requirements.txt         # Python依存関係
│   ├── main.py                  # FastAPI メインアプリ
│   ├── models.py                # SQLAlchemy データモデル
│   ├── database.py              # データベース接続設定
│   ├── routers/                 # API ルーター
│   │   ├── __init__.py
│   │   └── spots.py             # スポット関連API
│   └── tests/                   # テストファイル
│       └── test_spots.py        # スポットAPI テスト
├── frontend/                    # フロントエンド
│   ├── index.html               # メイン画面
│   ├── css/                     # スタイルシート
│   │   └── style.css
│   ├── js/                      # JavaScript
        ├── api.js           # (既存) バックエンドサーバーとの通信
        ├── googleApi.js     # (既存) Google Maps APIのラッパー
        ├── map.js           # (既存) 地図の初期化・操作
        ├── app.js           # (新) アプリ全体の司令塔 (旧spots.jsの核)
        ├── ui.js            # (新) UIの描画・更新・モーダル表示
        └── auth.js          # (新) ユーザー認証（ログイン・登録）
│   └── images/                  # 画像ファイル
└── data/                        # SQLiteデータベース保存

```

## データベース設計

```
spots テーブル:
├── id (INTEGER, PRIMARY KEY)
├── title (VARCHAR, おすすめスポット名)
├── description (TEXT, 説明)
├── category (VARCHAR, カテゴリ)
├── latitude (FLOAT, 緯度)
├── longitude (FLOAT, 経度)
├── rating (FLOAT, 評価)
├── image_path (VARCHAR, 画像パス)
└── created_at (DATETIME, 作成日時)
```


## セットアップ


### 前提条件

- Docker
- Docker Compose
- Google Maps API キー

### 1. リポジトリクローン
`git clone <repository-url>`
`cd progete-2025-06-hackathon`


### 2. 環境変数設定
 .env ファイルを作成 

`echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env`

### 3. アプリケーション起動
`bashdocker-compose up --build`

### 4. アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- API仕様書: http://localhost:8000/docs
