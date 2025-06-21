
// API関連の関数をまとめるためのオブジェクト
const googleApi = {
    // 各サービスを格納するためのプロパティ
    map: null,
    placesService: null,
    directionsService: null,
    directionsRenderer: null,
    geocoder: null,

    /**
     * 各サービスを初期化する関数。
     * map.jsで地図が作成された直後に一度だけ呼び出してください。
     * @param {google.maps.Map} mapObject - 初期化済みの地図オブジェクト
     */
    init: function(mapObject) {
        this.map = mapObject;
        console.log("googleApi: 初期化を開始します。");

        // 各APIサービスをインスタンス化
        this.placesService = new google.maps.places.PlacesService(this.map);
        this.directionsService = new google.maps.DirectionsService();
        this.geocoder = new google.maps.Geocoder();

        // ルート検索結果を地図上に描画するためのレンダラーを作成
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(this.map); // レンダラーと地図を紐付け

        console.log("googleApi: 初期化が完了しました。");
    },

    /**
     * [Places API] 検索バーにオートコンプリート機能を設定します。
     * @param {string} inputId - オートコンプリートを適用したいinput要素のID
     * @param {function} onPlaceChanged - 場所が選択されたときに実行されるコールバック関数
     */
    setupAutocomplete: function(inputId, onPlaceChanged) {
        const inputElement = document.getElementById(inputId);
        if (!inputElement) {
            console.error(`setupAutocomplete: ID '${inputId}' の要素が見つかりません。`);
            return;
        }

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            fields: ["place_id", "name", "geometry"], // 取得する情報を限定
            types: ["establishment"] // 施設のみを検索対象にする
        });

        // オートコンプリートの候補が地図の表示範囲に連動するように設定
        autocomplete.bindTo("bounds", this.map);

        // 場所が選択されたときのイベントリスナー
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (onPlaceChanged && typeof onPlaceChanged === 'function') {
                onPlaceChanged(place);
            }
        });
    },

    /**
     * [Geocoding API] 住所文字列から緯度経度を取得します。
     * @param {string} address - 検索したい住所
     * @param {function(object, string)} callback - 結果を受け取るコールバック関数 (results, status)
     */
    geocodeAddress: function(address, callback) {
        this.geocoder.geocode({ address: address }, callback);
    },


    /**
     * [Geolocation API]　ユーザーの現在地を取得します。ブラウザの機能を使いやすくラップします。
     * @param {function(object)} onSuccess - 成功時のコールバック。引数は{lat, lng}オブジェクト。
     * @param {function(object)} onError -失敗時のコールバック。引数はPositionError オブジェクト。
     */
    getCurrentLocation: function(onSuccess, onError){
        if(!navigator.geolocation){
            console.error("このブラウザはGeologationをサポートしていません");
            //サポートされていない場合のエラーオブジェクトを渡す
            onError({code: -1, message: "Geolocation not supported." });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userlocation = {
                    lat: position.coords.latitude, 
                    lng: position.coords.longitude,
                };
                onSuccess(userLocation);
            }, 
            (error) => {
                console.error("Geolocation error", error);
                onError(error);
            }
        );
    }
};
// APIを読み込む
//loadGoogleMapsAPI();

class SpotAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('authToken');
    }
    // 認証ヘッダーの取得
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // トークンの保存
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // ログアウト
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // API接続確認
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            const data = await response.json();
            console.log('API接続確認:', data);
            return data.status === 'healthy';
        } catch (error) {
            console.error('API接続エラー:', error);
            return false;
        }
    }
    // ユーザー登録
    async registerUser(userData) {
        try {
            const response = await fetch(`${this.baseURL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Registration failed: ${response.status}`);
            }

            const result = await response.json();
            
            // トークンを保存
            if (result.access_token) {
                this.setToken(result.access_token);
                this.currentUser = result.user;
            }
            
            return result;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // ログイン
    async loginUser(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'ログインに失敗しました');
            }

            const result = await response.json();
            
            // トークンを保存
            if (result.access_token) {
                this.setToken(result.access_token);
                this.currentUser = result.user;
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // 現在のユーザー情報取得
    async getCurrentUser() {
        try {
            const response = await fetch(`${this.baseURL}/users/me`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('ユーザー情報の取得に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('ユーザー情報取得エラー:', error);
            throw error;
        }
    }



    // 近くのスポット検索
    async getNearbySpots(lat, lng, radius = 5, limit = 10) {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lng: lng.toString(),
                radius: radius.toString(),
                limit: limit.toString()
            });

            const response = await fetch(`${this.baseURL}/spots/search/nearby?${params.toString()}`);

            if (!response.ok) {
                throw new Error('近くのスポット検索に失敗しました');
            }

            const data = await response.json();
            console.log('近くのスポット取得:', data.length, '件');
            return data;
        } catch (error) {
            console.error('近くのスポット検索エラー:', error);
            throw error;
        }
    }


    // おすすめスポット取得
    async getRecommendations(userLat, userLng, limit = 5) {
        try {
            const params = new URLSearchParams({
                user_lat: userLat.toString(),
                user_lng: userLng.toString(),
                limit: limit.toString()
            });

            const response = await fetch(`${this.baseURL}/spots/recommend/for-user?${params.toString()}`);

            if (!response.ok) {
                throw new Error('おすすめスポットの取得に失敗しました');
            }

            const data = await response.json();
            console.log('おすすめスポット取得:', data.recommendations.length, '件');
            return data;
        } catch (error) {
            console.error('おすすめスポット取得エラー:', error);
            throw error;
        }
    }
    // スポット一覧取得
    async getSpots(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            // フィルター条件を追加
            if (filters.category) params.append('category', filters.category);
            if (filters.page) params.append('page', filters.page);
            if (filters.per_page) params.append('per_page', filters.per_page);
            if (filters.lat) params.append('lat', filters.lat);
            if (filters.lng) params.append('lng', filters.lng);
            if (filters.radius) params.append('radius', filters.radius);

            const url = `${this.baseURL}/spots/?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('スポット一覧の取得に失敗しました');
            }

            const data = await response.json();
            console.log('スポット一覧取得:', data.spots.length, '件');
            return data;
        } catch (error) {
            console.error('スポット一覧取得エラー:', error);
            throw error;
        }
    }

    // 特定スポット取得
    async getSpot(spotId) {
        try {
            const response = await fetch(`${this.baseURL}/spots/${spotId}`);

            if (!response.ok) {
                throw new Error('スポット詳細の取得に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('スポット詳細取得エラー:', error);
            throw error;
        }
    }

    // 新規スポット投稿
    async createSpot(spotData) {
        try {
            const response = await fetch(`${this.baseURL}/spots/`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(spotData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'スポット投稿に失敗しました');
            }

            const data = await response.json();
            console.log('スポット投稿成功:', data.title);
            return data;
        } catch (error) {
            console.error('スポット投稿エラー:', error);
            throw error;
        }
    }

    // スポット更新
    async updateSpot(spotId, updateData) {
        try {
            const response = await fetch(`${this.baseURL}/spots/${spotId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'スポット更新に失敗しました');
            }

            const data = await response.json();
            console.log('スポット更新成功:', data.title);
            return data;
        } catch (error) {
            console.error('スポット更新エラー:', error);
            throw error;
        }
    }

    // スポット削除
    async deleteSpot(spotId) {
        try {
            const response = await fetch(`${this.baseURL}/spots/${spotId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'スポット削除に失敗しました');
            }

            const data = await response.json();
            console.log('スポット削除成功');
            return data;
        } catch (error) {
            console.error('スポット削除エラー:', error);
            throw error;
        }
    }


    // 自分の投稿一覧取得
    async getMySpots() {
        try {
            const response = await fetch(`${this.baseURL}/spots/my/spots`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('自分の投稿一覧の取得に失敗しました');
            }

            const data = await response.json();
            console.log('自分の投稿取得:', data.length, '件');
            return data;
        } catch (error) {
            console.error('自分の投稿取得エラー:', error);
            throw error;
        }
    }

    // カテゴリ一覧取得
    async getCategories() {
        try {
            const response = await fetch(`${this.baseURL}/spots/categories/`);

            if (!response.ok) {
                throw new Error('カテゴリ一覧の取得に失敗しました');
            }

            const data = await response.json();
            return data.categories;
        } catch (error) {
            console.error('カテゴリ一覧取得エラー:', error);
            throw error;
        }
    }
}

// グローバルなAPIインスタンス
const api = new SpotAPI();


// 🔧 ユーティリティ関数
function showMessage(message, type = 'info') {
    // メッセージ表示用（後で実装）
    console.log(`${type.toUpperCase()}: ${message}`);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    
    if (hasHalfStar) {
        stars += '☆';
    }
    
    return stars;
}

// 初期化時のAPI接続確認
document.addEventListener('DOMContentLoaded', async () => {
    console.log('アプリケーション初期化中...');
    
    const isConnected = await api.checkConnection();
    if (isConnected) {
        console.log('バックエンドAPI接続成功');
    } else {
        console.warn('バックエンドAPIに接続できません');
        showMessage('サーバーに接続できません。後でもう一度お試しください。', 'error');
    }
});
