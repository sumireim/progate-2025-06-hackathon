FROM python:3.9-slim

# コンテナ内の作業ディレクトリを /app に設定
WORKDIR /app  

# PC の backend/requirements.txt → コンテナの /app/requirements.txt にコピー
COPY requirements.txt .

# fastapi, uvicorn などをインストール
RUN pip install -r requirements.txt

COPY . .

# 起動時に実行（サーバーとして動作）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
