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
/*-----------フレンド関連-----------*/ 
    // フレンド検索
    async searchUsers(query) {
        try {
            const params = new URLSearchParams({ query });
            const response = await fetch(`${this.baseURL}/friends/search?${params}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'ユーザー検索に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('ユーザー検索エラー:', error);
            throw error;
        }
    }

    // フレンド申請送信
    async sendFriendRequest(username) {
        try {
            const response = await fetch(`${this.baseURL}/friends/request`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ username })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'フレンド申請に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('フレンド申請エラー:', error);
            throw error;
        }
    }

    // 受信したフレンド申請一覧
    async getReceivedRequests() {
        try {
            const username = this.currentUser?.username || 'aaa';
            const params = new URLSearchParams({ username });
            
            const response = await fetch(`${this.baseURL}/friends/requests/received?${params}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('受信申請一覧の取得に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('受信申請一覧取得エラー:', error);
            throw error;
        }
    }

    // 送信したフレンド申請一覧
    async getSentRequests() {
        try {
            // 現在のユーザー名をクエリパラメータに追加
            const username = this.currentUser?.username || 'aaa';
            const params = new URLSearchParams({ username });
            
            const response = await fetch(`${this.baseURL}/friends/requests/sent?${params}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('送信申請一覧の取得に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('送信申請一覧取得エラー:', error);
            throw error;
        }
    }

    // フレンド申請承認
    async acceptFriendRequest(requestId) {
        try {
            const response = await fetch(`${this.baseURL}/friends/requests/${requestId}/accept`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'フレンド申請承認に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('フレンド申請承認エラー:', error);
            throw error;
        }
    }

    // フレンド申請拒否
    async rejectFriendRequest(requestId) {
        try {
            const response = await fetch(`${this.baseURL}/friends/requests/${requestId}/reject`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'フレンド申請拒否に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('フレンド申請拒否エラー:', error);
            throw error;
        }
    }

    // フレンド一覧取得
    async getFriends() {
        try {
            const response = await fetch(`${this.baseURL}/friends/`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('フレンド一覧の取得に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('フレンド一覧取得エラー:', error);
            throw error;
        }
    }

    // フレンド削除
    async removeFriend(friendId) {
        try {
            const response = await fetch(`${this.baseURL}/friends/${friendId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'フレンド削除に失敗しました');
            }

            return await response.json();
        } catch (error) {
            console.error('フレンド削除エラー:', error);
            throw error;
        }
    }
    
}

// グローバルなAPIインスタンスを作成
// これにより、他のファイルから `api.getSpots()` のように呼び出せるようになる
const api = new SpotAPI();
