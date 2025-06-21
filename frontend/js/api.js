// api.js - バックエンドサーバーとの通信を専門に担当します

class SpotAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = null;
    }

    // (ここから下に、元のファイルからSpotAPIクラスの全メソッドをコピー＆ペーストしてください)
    // - getAuthHeaders()
    // - setToken()
    // - clearToken()
    // - checkConnection()
    // - registerUser()
    // - loginUser()
    // - getCurrentUser()
    // - getSpots(), createSpot(), updateSpot(), deleteSpot() ...
    // - ...フレンド関連の全メソッド...
}

// グローバルなAPIインスタンスを作成
// これにより、他のファイルから `api.getSpots()` のように呼び出せるようになる
const api = new SpotAPI();
