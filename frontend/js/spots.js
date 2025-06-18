class SpotShareApp {
    constructor() {
        this.currentUser = null;
        this.userLocation = null;
        this.isAuthenticated = false;
        
        // DOM要素の取得
        this.elements = {
            // おすすめセクション
            recommendList: document.getElementById('recommend-list'),
            
            // 投稿リスト
            postList: document.getElementById('post-list'),
            
            // 投稿フォーム関連
            postBtn: document.getElementById('btn-post'),
            postFormOverlay: document.getElementById('post-form-overlay'),
            postFormMenu: document.getElementById('post-form-menu'),
            postForm: document.getElementById('post-form'),
            closePostFormBtn: document.getElementById('btn-close-post-form'),
            
            // ユーザーメニュー関連
            menuBtn: document.getElementById('btn-menu'),
            userMenuOverlay: document.getElementById('user-menu-overlay'),
            userMenu: document.getElementById('user-menu'),
            
            // 検索関連
            searchBtn: document.getElementById('btn-search')
        };
        
        this.init();
    }

    async init() {
        console.log('SpotShareApp 初期化中...');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // ユーザー位置情報取得
        await this.getUserLocation();
        
        // 認証状態チェック
        await this.checkAuthStatus();
        
        // 初期データ読み込み
        await this.loadInitialData();
        
        console.log('SpotShareApp 初期化完了');
    }

    setupEventListeners() {
        // 投稿ボタン
        this.elements.postBtn?.addEventListener('click', () => {
            if (this.isAuthenticated) {
                this.showPostForm();
            } else {
                this.showLoginPrompt();
            }
        });

        // 投稿フォーム閉じる
        this.elements.closePostFormBtn?.addEventListener('click', () => {
            this.hidePostForm();
        });

        // オーバーレイクリックで閉じる
        this.elements.postFormOverlay?.addEventListener('click', () => {
            this.hidePostForm();
        });

        // 投稿フォーム送信
        this.elements.postForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePostSubmit(e);
        });

        // ユーザーメニュー
        this.elements.menuBtn?.addEventListener('click', () => {
            if (this.isAuthenticated) {
                this.toggleUserMenu();
            } else {
                this.showLoginPrompt();
            }
        });

        // ユーザーメニューオーバーレイ
        this.elements.userMenuOverlay?.addEventListener('click', () => {
            this.hideUserMenu();
        });

        // 検索ボタン
        this.elements.searchBtn?.addEventListener('click', () => {
            this.showSearchView();
        });
    }

    // ユーザー位置情報取得
    async getUserLocation() {
        try {
            if (!navigator.geolocation) {
                console.warn('位置情報がサポートされていません');
                // デフォルト位置（東京駅）
                this.userLocation = { lat: 35.6762, lng: 139.6503 };
                return;
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5分間キャッシュ
                });
            });

            this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            console.log('現在地取得成功:', this.userLocation);
        } catch (error) {
            console.warn('位置情報取得エラー:', error);
            // デフォルト位置（東京駅）
            this.userLocation = { lat: 35.6762, lng: 139.6503 };
        }
    }

    // 認証状態確認
    async checkAuthStatus() {
        try {
            if (api.token) {
                this.currentUser = await api.getCurrentUser();
                this.isAuthenticated = true;
                this.updateUIForAuthenticatedUser();
                console.log('認証済みユーザー:', this.currentUser.username);
            } else {
                this.isAuthenticated = false;
                this.updateUIForGuestUser();
                console.log('ゲストユーザー');
            }
        } catch (error) {
            console.warn('認証状態確認エラー:', error);
            this.isAuthenticated = false;
            api.clearToken();
            this.updateUIForGuestUser();
        }
    }

    // 初期データ読み込み
    async loadInitialData() {
        try {
            // おすすめスポット読み込み
            await this.loadRecommendations();
            
            // 最新投稿読み込み
            await this.loadRecentPosts();
            
        } catch (error) {
            console.error('初期データ読み込みエラー:', error);
        }
    }

    // おすすめスポット読み込み
    async loadRecommendations() {
        try {
            if (!this.userLocation) return;

            const data = await api.getRecommendations(
                this.userLocation.lat, 
                this.userLocation.lng, 
                3
            );

            this.displayRecommendations(data.recommendations);
        } catch (error) {
            console.error('おすすめスポット読み込みエラー:', error);
            this.displayRecommendations([]); // 空配列で表示
        }
    }

    // おすすめスポット表示
    displayRecommendations(recommendations) {
        if (!this.elements.recommendList) return;

        if (recommendations.length === 0) {
            this.elements.recommendList.innerHTML = `
                <div class="no-data">
                    <p>おすすめスポットがありません</p>
                    <p>スポットを投稿してみませんか？</p>
                </div>
            `;
            return;
        }

        const cardsHTML = recommendations.map(spot => `
            <div class="card" data-spot-id="${spot.id}">
                <img src="images/default-spot.jpg" alt="${spot.title}" onerror="this.src='images/default-spot.jpg'"/>
                <h3>${spot.title}</h3>
                <span class="category">${spot.category || 'その他'}</span>
                <div class="stars">${generateStars(spot.rating)}</div>
                <div class="spot-info">
                    <p class="spot-description">${spot.description || ''}</p>
                    <p class="spot-owner">投稿者: ${spot.owner_username || '匿名'}</p>
                </div>
            </div>
        `).join('');

        this.elements.recommendList.innerHTML = cardsHTML;

        // カードクリックイベント
        this.elements.recommendList.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                const spotId = card.dataset.spotId;
                this.showSpotDetails(spotId);
            });
        });
    }

    // 最新投稿読み込み
    async loadRecentPosts() {
        try {
            const data = await api.getSpots({ per_page: 10, page: 1 });
            this.displayRecentPosts(data.spots);
        } catch (error) {
            console.error('最新投稿読み込みエラー:', error);
            this.displayRecentPosts([]);
        }
    }

    // 最新投稿表示
    displayRecentPosts(spots) {
        if (!this.elements.postList) return;

        if (spots.length === 0) {
            this.elements.postList.innerHTML = `
                <li class="no-data">
                    <p>まだ投稿がありません</p>
                </li>
            `;
            return;
        }

        const postsHTML = spots.slice(0, 5).map(spot => `
            <li>
                <div class="user-icon">
                    ${spot.owner_username ? spot.owner_username.charAt(0).toUpperCase() : '?'}
                </div>
                <div class="post-content">
                    <p><strong>${spot.title}</strong> - ${spot.description || ''}</p>
                    <div class="post-time">${this.getRelativeTime(spot.created_at)}</div>
                </div>
            </li>
        `).join('');

        this.elements.postList.innerHTML = postsHTML;
    }

    // 相対時間表示
    getRelativeTime(dateString) {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffMs = now - postDate;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'たった今';
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        
        return postDate.toLocaleDateString('ja-JP');
    }

    // 投稿フォーム表示
    showPostForm() {
        this.elements.postFormOverlay?.classList.remove('hidden');
        this.elements.postFormMenu?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // 投稿フォーム非表示
    hidePostForm() {
        this.elements.postFormOverlay?.classList.add('hidden');
        this.elements.postFormMenu?.classList.add('hidden');
        document.body.style.overflow = '';
        this.elements.postForm?.reset();
    }

    // 投稿フォーム送信処理
    async handlePostSubmit(event) {
        try {
            const formData = new FormData(event.target);
            
            const spotData = {
                title: formData.get('shop'),
                description: formData.get('comment'),
                category: formData.get('category'),
                rating: parseFloat(formData.get('rating')) || 0,
                latitude: this.userLocation.lat,
                longitude: this.userLocation.lng,
                is_public: true
            };

            // バリデーション
            if (!spotData.title) {
                alert('お店の名前を入力してください');
                return;
            }

            // API呼び出し
            const newSpot = await api.createSpot(spotData);
            
            console.log('投稿成功:', newSpot);
            alert('投稿が完了しました！');
            
            // フォームを閉じる
            this.hidePostForm();
            
            // データを再読み込み
            await this.loadInitialData();
            
        } catch (error) {
            console.error('投稿エラー:', error);
            alert(`投稿に失敗しました: ${error.message}`);
        }
    }

    // ユーザーメニュー表示切り替え
    toggleUserMenu() {
        const isHidden = this.elements.userMenu?.classList.contains('hidden');
        if (isHidden) {
            this.showUserMenu();
        } else {
            this.hideUserMenu();
        }
    }

    showUserMenu() {
        this.elements.userMenuOverlay?.classList.remove('hidden');
        this.elements.userMenu?.classList.remove('hidden');
    }

    hideUserMenu() {
        this.elements.userMenuOverlay?.classList.add('hidden');
        this.elements.userMenu?.classList.add('hidden');
    }

    // ログインプロンプト表示
    showLoginPrompt() {
        if (confirm('この機能を使用するにはログインが必要です。ログインしますか？')) {
            this.showLoginModal();
        }
    }

    // ログインモーダル表示（簡易版）
    showLoginModal() {
        const username = prompt('ユーザー名を入力してください:');
        if (!username) return;

        const password = prompt('パスワードを入力してください:');
        if (!password) return;

        this.handleLogin(username, password);
    }

    // ログイン処理
    async handleLogin(username, password) {
        try {
            await api.loginUser(username, password);
            await this.checkAuthStatus();
            alert('ログインしました！');
            
            // データ再読み込み
            await this.loadInitialData();
            
        } catch (error) {
            console.error('ログインエラー:', error);
            alert(`ログインに失敗しました: ${error.message}`);
        }
    }

    // 認証済みユーザー用UI更新
    updateUIForAuthenticatedUser() {
        // ユーザーメニューの名前更新
        const userNameElement = document.querySelector('.user-menu-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.display_name || this.currentUser.username;
        }
    }

    // ゲストユーザー用UI更新
    updateUIForGuestUser() {
        const userNameElement = document.querySelector('.user-menu-name');
        if (userNameElement) {
            userNameElement.textContent = 'ゲスト';
        }
    }

    // スポット詳細表示
    async showSpotDetails(spotId) {
        try {
            const spot = await api.getSpot(spotId);
            
            // 簡易モーダルで詳細表示
            alert(`
                スポット名: ${spot.title}
                カテゴリ: ${spot.category || 'その他'}
                評価: ${generateStars(spot.rating)} (${spot.rating})
                説明: ${spot.description || 'なし'}
                投稿者: ${spot.owner_username || '匿名'}
            `);
            
        } catch (error) {
            console.error('スポット詳細取得エラー:', error);
            alert('スポット詳細の取得に失敗しました');
        }
    }

    // 検索画面表示
    showSearchView() {
        alert('検索機能は開発中です');
        // TODO: 検索画面の実装
    }

    // データ更新
    async refreshData() {
        console.log('データ更新中...');
        await this.loadInitialData();
        console.log('データ更新完了');
    }
}

// アプリケーション初期化
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SpotShareApp();
});

// グローバル関数（デバッグ用）
window.refreshApp = () => {
    if (app) {
        app.refreshData();
    }
};

window.showLoginModal = () => {
    if (app) {
        app.showLoginModal();
    }
};