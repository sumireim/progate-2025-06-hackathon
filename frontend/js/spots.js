class SpotShareApp {
    constructor() {
        this.currentUser = null;
        this.userLocation = null;
        this.isAuthenticated = false;
        
        //メッセージコンテナ作成
        this.messageContainer = this.createMessageContainer()

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
            searchBtn: document.getElementById('btn-search'),

            // メッセージコンテナ
            messageContainer: this.createMessageContainer()
        };
        
        this.waitForAPI(); //APIが利用可能になったら初期化
    }

    /*async init() {
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
    }*/
    // APIが利用可能になるまで待機
    // APIの初期化を待つ
    async waitForAPI() {
        let retries = 0;
        const maxRetries = 10;
        
        while (typeof api === 'undefined' && retries < maxRetries) {
            console.log(`API初期化待機中... (${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
        }
        
        if (typeof api !== 'undefined') {
            this.init();
        } else {
            console.error('API初期化に失敗しました');
            this.showMessage('アプリケーションの初期化に失敗しました。ページを更新してください。', 'error');
        }
    }

    // メッセージコンテナを作成
    createMessageContainer() {
        let container = document.getElementById('message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'message-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }
    // メッセージ表示
    showMessage(message, type = 'info', duration = 5000) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.style.cssText = `
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        messageElement.style.backgroundColor = colors[type] || colors.info;
        
        messageElement.textContent = message;
        this.messageContainer.appendChild(messageElement);
        
        // アニメーション表示
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateX(0)';
        }, 100);
        
        // 自動削除
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateX(100%)';
            setTimeout(() => messageElement.remove(), 300);
        }, duration);
    }

    async init() {
        console.log('SpotShareApp 初期化中...');
        
        try {
            // 1. API接続確認
            const isConnected = await api.checkConnection();
            if (!isConnected) {
                this.showMessage('サーバーに接続できません。しばらく待ってから再試行してください。', 'error');
                return;
            }

            // 2. 認証状態チェック
            await this.checkAuthStatus();
            
            // 3. 認証されていない場合は登録/ログインを強制
            if (!this.isAuthenticated) {
                await this.showWelcomeModal();
                return; // 認証完了後にinitが再度呼ばれる
            }

            // 4. 認証済みの場合はアプリを初期化
            await this.initializeApp();
            
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showMessage('アプリの初期化に失敗しました。ページをリロードしてください。', 'error');
        }
    }

    // アプリの本格初期化（認証後）
    async initializeApp() {
        console.log('認証済み - アプリを初期化中...');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // ユーザー位置情報取得
        await this.getUserLocation();
        
        // 初期データ読み込み
        await this.loadInitialData();
        
        // UI更新
        this.updateUIForAuthenticatedUser();
        
        this.isInitialized = true;
        console.log('アプリ初期化完了');
        this.showMessage(`${this.currentUser.display_name}さん、おかえりなさい！`, 'success');
    }

    // 認証状態確認
    async checkAuthStatus() {
        try {
            if (api.currentUser) {
                this.currentUser = api.currentUser;
                this.isAuthenticated = true;
                console.log('既存ユーザーでログイン済み:', this.currentUser.username);
                return true;
            } else {
                this.isAuthenticated = false;
                console.log('未認証状態');
                return false;
            }
        } catch (error) {
            console.warn('認証状態確認エラー:', error);
            this.isAuthenticated = false;
            return false;
        }
    }
    // ウェルカムモーダル表示（登録/ログイン選択）
    async showWelcomeModal() {
        return new Promise((resolve) => {
            // モーダルHTML作成
            const modalHTML = `
                <div id="welcome-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: white;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 400px;
                        width: 90%;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    ">
                        <h2 style="margin: 0 0 20px 0; color: #333;">スポット共有アプリへようこそ！</h2>
                        <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
                            まずはアカウントの作成またはログインが必要です。
                        </p>
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="btn-register" style="
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 600;
                            ">新規登録</button>
                            
                            <button id="btn-login" style="
                                background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                                color: #333;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 600;
                            ">ログイン</button>
                        </div>
                        
                        <p style="color: #888; font-size: 12px; margin-top: 20px;">
                            ※ このアプリの利用には会員登録が必要です
                        </p>
                    </div>
                </div>
            `;

            // モーダルを表示
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            document.body.style.overflow = 'hidden';

            // イベントリスナー設定
            document.getElementById('btn-register').addEventListener('click', async () => {
                await this.showRegistrationForm();
                resolve();
            });

            document.getElementById('btn-login').addEventListener('click', async () => {
                await this.showLoginForm();
                resolve();
            });
        });
    }

    // 新規登録フォーム表示
    async showRegistrationForm() {
        const modal = document.getElementById('welcome-modal');
        
        const formHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                <h2 style="margin: 0 0 20px 0; color: #333;">新規ユーザー登録</h2>
                
                <form id="registration-form">
                    <div style="margin-bottom: 20px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            ユーザー名 <span style="color: red;">*</span>
                        </label>
                        <input type="text" id="reg-username" required 
                               placeholder="例: zouryou"
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 2px solid #e9ecef;
                                   border-radius: 6px;
                                   font-size: 16px;
                                   box-sizing: border-box;
                               ">
                    </div>
                    
                    <div style="margin-bottom: 20px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            パスワード <span style="color: red;">*</span>
                        </label>
                        <input type="password" id="reg-password" required 
                               placeholder="6文字以上"
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 2px solid #e9ecef;
                                   border-radius: 6px;
                                   font-size: 16px;
                                   box-sizing: border-box;
                               ">
                    </div>
                    
                    <div style="margin-bottom: 30px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            表示名（オプション）
                        </label>
                        <input type="text" id="reg-display-name" 
                               placeholder="例: 50%増量"
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 2px solid #e9ecef;
                                   border-radius: 6px;
                                   font-size: 16px;
                                   box-sizing: border-box;
                               ">
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button type="submit" style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                        ">登録する</button>
                        
                        <button type="button" id="btn-back-to-welcome" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                        ">戻る</button>
                    </div>
                </form>
                
                <div style="margin-top: 20px;">
                    <a href="#" id="switch-to-login" style="color: #007bff; text-decoration: none; font-size: 14px;">
                        既にアカウントをお持ちの方はこちら
                    </a>
                </div>
            </div>
        `;

        modal.innerHTML = formHTML;

        // イベントリスナー設定
        document.getElementById('registration-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegistration(e);
        });

        document.getElementById('btn-back-to-welcome').addEventListener('click', () => {
            this.removeModal();
            this.showWelcomeModal();
        });

        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    // ログインフォーム表示
    async showLoginForm() {
        const modal = document.getElementById('welcome-modal');
        
        const formHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                <h2 style="margin: 0 0 20px 0; color: #333;">ログイン</h2>
                
                <form id="login-form">
                    <div style="margin-bottom: 20px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            ユーザー名
                        </label>
                        <input type="text" id="login-username" required 
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 2px solid #e9ecef;
                                   border-radius: 6px;
                                   font-size: 16px;
                                   box-sizing: border-box;
                               ">
                    </div>
                    
                    <div style="margin-bottom: 30px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            パスワード
                        </label>
                        <input type="password" id="login-password" required 
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 2px solid #e9ecef;
                                   border-radius: 6px;
                                   font-size: 16px;
                                   box-sizing: border-box;
                               ">
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button type="submit" style="
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                        ">ログイン</button>
                        
                        <button type="button" id="btn-back-to-welcome" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                        ">戻る</button>
                    </div>
                </form>
                
                <div style="margin-top: 20px;">
                    <a href="#" id="switch-to-register" style="color: #007bff; text-decoration: none; font-size: 14px;">
                        アカウントをお持ちでない方はこちら
                    </a>
                </div>
            </div>
        `;
        modal.innerHTML = formHTML;

        // イベントリスナー設定
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e);
        });

        document.getElementById('btn-back-to-welcome').addEventListener('click', () => {
            this.removeModal();
            this.showWelcomeModal();
        });

        document.getElementById('switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegistrationForm();
        });
    }
    // 新規登録処理
    async handleRegistration(event) {
        try {
            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value;
            const displayName = document.getElementById('reg-display-name').value.trim();

            // バリデーション
            if (!username) {
                this.showMessage('ユーザー名を入力してください', 'error');
                return;
            }

            if (username.length < 3) {
                this.showMessage('ユーザー名は3文字以上で入力してください', 'error');
                return;
            }

            if (!password) {
                this.showMessage('パスワードを入力してください', 'error');
                return;
            }

            if (password.length < 6) {
                this.showMessage('パスワードは6文字以上で入力してください', 'error');
                return;
            }

            // 登録データ
            const userData = {
                username: username,
                password: password,
                display_name: displayName || username
            };

            this.showMessage('ユーザー登録中...', 'info');

            // API呼び出し
            const result = await api.registerUser(userData);
            
            console.log('登録成功:', result);
            this.currentUser = result;
            this.isAuthenticated = true;

            this.showMessage('登録が完了しました！アプリを初期化中...', 'success');
            
            // モーダルを閉じる
            this.removeModal();
            
            // アプリを初期化
            await this.initializeApp();
            
        } catch (error) {
            console.error('登録エラー:', error);
            this.showMessage(`登録に失敗しました: ${error.message}`, 'error');
        }
    }

    // ログイン処理
    async handleLogin(event) {
        try {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (!username || !password) {
                this.showMessage('ユーザー名とパスワードを入力してください', 'error');
                return;
            }

            this.showMessage('ログイン中...', 'info');
            console.log('ログイン試行:', username);

            // API呼び出し
            const result = await api.loginUser(username, password);
            
            console.log('ログイン成功:', result);
            this.currentUser = result.user;
            this.isAuthenticated = true;

            this.showMessage('ログインしました！アプリを初期化中...', 'success');
            
            // モーダルを閉じる
            this.removeModal();
            
            // アプリを初期化
            await this.initializeApp();
            
        } catch (error) {
            console.error('ログインエラー:', error);
            const errorMessage = error.message || error.toString() || 'ログインに失敗しました';
            this.showMessage(`ログインに失敗しました: ${error.message}`, 'error');
        }
    }

    // モーダル削除
    removeModal() {
        const modal = document.getElementById('welcome-modal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    }

    // メッセージコンテナを作成
    createMessageContainer() {
        let container = document.getElementById('message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'message-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
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
               <img src="images/ramen_koguma.jpeg" alt="${spot.title}" onerror="this.src='images/ramen_koguma.jpeg'"/>
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
                // is_public: true
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

/*    // ログイン処理
    async handleLogin(username, password) {
        console.log('ログイン試行:', username);
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
    }*/

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
    console.log('DOM loaded, starting app...');
    app = new SpotShareApp();

    const userMenuList = document.querySelector('.user-menu-list');
    if (userMenuList) {
        userMenuList.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-nav]');
            if (!li) return;
            const nav = li.getAttribute('data-nav');
            switch (nav) {
                case 'mypost':
                    window.location.href = 'my-posts.html';
                    break;
                case 'friends':
                    window.location.href = 'friends.html';
                    break;
                case 'invite':
                    window.location.href = 'invite.html';
                    break;
                case 'setting':
                    window.location.href = 'setting.html';
                    break;
                case 'logout':
                    window.location.href = 'logout.html';
                    break;
                default:
                    break;
            }
        });
    }
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

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = "index.html";
    });
  }

  const cancelBtn = document.getElementById('btn-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = "index.html";
    });
  }
});