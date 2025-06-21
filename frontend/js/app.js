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
            await this.auth.checkAuthStatus();
            this.isAuthenticated = this.auth.isAuthenticated;
            this.currentUser = this.auth.currentUser;

            if (!this.isAuthenticated) {
                await this.auth.showWelcomeModal(); 
                return;
            }
            await this.initializeApp();

        } catch (error) {
            console.error('アプリ起動プロセスでエラー:', error);
            this.ui.showMessage('アプリの起動に失敗しました。', 'error');
        }
    }

    /**
     * 認証済みユーザー向けのデータ初期化処理
     */
    async initializeApp() {
        console.log('認証済み - データの初期化を開始します...');
        this.ui.updateUIForAuthenticatedUser(this.currentUser);
        await this.loadInitialData();
        this.ui.showMessage(`ようこそ、${this.currentUser.display_name || this.currentUser.username}さん！`, 'success');
    }

    /**
     * イベントリスナーをまとめて設定 (司令塔としての役割)
     */
    setupEventListeners() {
        // 投稿ボタン
        this.ui.elements.postBtn?.addEventListener('click', () => {
            this.isAuthenticated ? this.ui.showPostForm() : this.auth.showLoginPrompt();
        });

        // 投稿フォーム閉じる
        /*this.elements.closePostFormBtn?.addEventListener('click', () => {
            this.hidePostForm();
        });

        // オーバーレイクリックで閉じる
        this.elements.postFormOverlay?.addEventListener('click', () => {
            this.hidePostForm();
        });*/

        // 投稿フォーム送信
        this.ui.elements.postForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePostSubmit(e);
        });

        // ユーザーメニュー
        this.ui.elements.menuBtn?.addEventListener('click', () => {
            this.isAuthenticated ? this.ui.toggleUserMenu() : this.auth.showLoginPrompt();
        });

        // ユーザーメニューオーバーレイ
        /*this.elements.userMenuOverlay?.addEventListener('click', () => {
            this.hideUserMenu();
        });*/

        // 検索ボタン
        this.ui.elements.searchBtn?.addEventListener('click', () => {
            this.showSearchView();
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
                    case 'logout':
                        this.auth.logout();
                        break;
                }
            });
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
}

// アプリケーションのインスタンスを生成
const app = new SpotShareApp();

