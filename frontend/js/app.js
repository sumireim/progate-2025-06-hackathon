// app.js - アプリケーションのメインコントローラー (司令塔)

class SpotShareApp {
    constructor() {
        console.log('SpotShareApp: constructor - インスタンスを生成します');
        this.currentUser = null;
        this.userLocation = null;
        this.map = null;
        this.isAuthenticated = false;

        // 各専門家モジュールを初期化
        this.ui = new UIManager();
        this.auth = new AuthManager(this.ui, this); // 依存関係を渡す

        this.setupEventListeners();
    }

    /**
     * map.jsから呼び出される、アプリのメイン処理開始メソッド
     */
    async start(mapObject, userLocation) {
        console.log('SpotShareApp: start() - メイン処理を開始します');
        this.map = mapObject;
        this.userLocation = userLocation;

        try {
            // シンプル化：認証チェックはauth.jsに完全委譲
            // auth.jsのcheckInitialAuthStatus()が以下を自動で判断・実行する：
            // - 初回アクセス → ウェルカムモーダル表示
            // - 2回目以降 → 自動認証 → initializeApp()呼び出し
            await this.auth.checkInitialAuthStatus();

        } catch (error) {
            console.error('アプリ起動プロセスでエラー:', error);
            this.ui.showMessage('アプリの起動に失敗しました。', 'error');
            await this.auth.showWelcomeModal(); // エラー時も表示
        }
    }

    /**
     * 認証済みユーザー向けのデータ初期化処理
     */
    async initializeApp() {
        console.log('認証済み - データの初期化を開始します...');
        if (!this.currentUser) {
            console.error('ユーザー情報が設定されていません');
            this.ui.showMessage('ユーザー情報の取得に失敗しました', 'error');
            await this.auth.showWelcomeModal();
            return;
        }
        
        try {
            //認証状態設定
            this.isAuthenticated = true;
            console.log('認証状態確定 - this.isAuthenticated:', this.isAuthenticated);
        
            this.ui.updateUIForAuthenticatedUser(this.currentUser);
            await this.loadInitialData();
            
            const displayName = this.currentUser?.display_name || 
                               this.currentUser?.username || 
                               'ユーザー';
            
            this.ui.showMessage(`ようこそ、${displayName}さん！`, 'success');
            
        } catch (error) {
            console.error('アプリ初期化エラー:', error);
            this.ui.showMessage('アプリの初期化に失敗しました', 'error');
        }
    }
    /**
     * 初期データをまとめて読み込む
     */
    async loadInitialData() {
        if (!this.userLocation) {
            console.warn("位置情報がないため、データ読み込みをスキップします。");
            return;
        }
        await Promise.all([
            this.loadRecommendations(),
            this.loadRecentPosts()
        ]);
    }

    /**
     * イベントリスナーをまとめて設定 (司令塔としての役割)
     */
    setupEventListeners() {
        // 投稿ボタン
        this.ui.elements.postBtn?.addEventListener('click', () => {
            if (this.isAuthenticated) {
                this.ui.showPostForm();
            } else {
                // ウェルカムモーダルを表示
                this.auth.showWelcomeModal();
            }
        });
        // 投稿フォーム送信
        this.ui.elements.postForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePostSubmit(e);
        });


        // ユーザーメニュー
        this.ui.elements.menuBtn?.addEventListener('click', () => {
            /*if (this.isAuthenticated) {
                this.ui.toggleUserMenu();
            } else {
                // ★修正：ウェルカムモーダルを表示
                this.auth.showWelcomeModal();
            }*/
            this.ui.toggleUserMenu();
        });

        // 検索ボタン
        this.ui.elements.searchBtn?.addEventListener('click', () => {
            if (this.isAuthenticated) {
                this.showSearchView();
            } else {
                // ★修正：ウェルカムモーダルを表示
                this.auth.showWelcomeModal();
            }
        });
        // ユーザーメニューのナビゲーション 追加
        this.setupUserMenuNavigation();
    }
    //追加
    setupUserMenuNavigation() {
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
                    /*case 'logout':
                        this.auth.logout();
                        break;*/
                }
            });
        }
    }

    /**
     * おすすめスポットを読み込んでUIに表示を依頼する
     */
    async loadRecommendations() {
        try {
            const data = await api.getRecommendations(this.userLocation.lat, this.userLocation.lng, 3);
            this.ui.displayRecommendations(data.recommendations);
        } catch (error) {
            console.error('おすすめスポット読み込みエラー:', error);
        }
    }

    /**
     * 最新の投稿を読み込んでUIに表示を依頼する
     */
    async loadRecentPosts() {
        try {
            const data = await api.getSpots({ per_page: 10, page: 1 });
            this.ui.displayRecentPosts(data.spots);
        } catch (error) {
            console.error('最新投稿読み込みエラー:', error);
        }
    }

    /**
     * 投稿フォームの送信を処理する
     */
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
            };

            if (!spotData.title) {
                this.ui.showMessage('お店の名前を入力してください', 'error');
                return;
            }

            await api.createSpot(spotData);
            this.ui.showMessage('投稿が完了しました！', 'success');
            this.ui.hidePostForm();
            await this.loadInitialData(); // データを再読み込み
            
        } catch (error) {
            console.error('投稿エラー:', error);
            this.ui.showMessage(`投稿に失敗しました: ${error.message}`, 'error');
        }
    }
    /**
     * 検索画面表示（プレースホルダー）
     */
    showSearchView() {
        console.log('検索画面を表示します');
        // TODO: 検索画面の実装
        this.ui.showMessage('検索機能は開発中です', 'info');
    }
}

// アプリケーションのインスタンスを生成
const app = new SpotShareApp();

