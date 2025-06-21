// auth.js - 認証関連の処理（UI表示とAPI通信）を専門に担当します

class AuthManager {
    /**
     * @param {UIManager} uiManager - UI操作を行うためのヘルパー
     * @param {SpotShareApp} appInstance - アプリ本体のインスタンス
     */
    constructor(uiManager, appInstance) {
        this.ui = uiManager;
        this.app = appInstance;
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    /**
     * サーバーに認証状態を問い合わせる
     */
    async checkAuthStatus() {
        try {
            if (api.token) {
                this.currentUser = await api.getCurrentUser();
                this.isAuthenticated = true;
            } else {
                this.isAuthenticated = false;
            }
        } catch (error) {
            console.warn('認証状態確認エラー:', error);
            this.isAuthenticated = false;
            api.clearToken();
        }
    }

    /**
     * ログインを促す簡単な確認ダイアログ
     */
    showLoginPrompt() {
        if (confirm('この機能を使用するにはログインが必要です。ログインしますか？')) {
            this.showWelcomeModal();
        }
    }

    /**
     * 【重要】ウェルカムモーダル（ログイン/登録の選択画面）を表示する
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     */
    async showWelcomeModal() {
        console.log("AuthManager: ウェルカムモーダルを表示します。");
        //
        // ▼▼▼ この部分に、元のspots.jsにあったshowWelcomeModalのロジックを貼り付けてください ▼▼▼
        //
        // モーダルのHTMLを生成し、document.bodyに追加する処理です。
        // 「新規登録」「ログイン」ボタンに、それぞれshowRegistrationFormやshowLoginFormを
        // 呼び出すイベントリスナーを設定する部分も含みます。
        //
    }

    /**
     * 【重要】新規登録フォームを表示する
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     */
    async showRegistrationForm() {
        console.log("AuthManager: 新規登録フォームを表示します。");
        //
        // ▼▼▼ この部分に、元のspots.jsにあったshowRegistrationFormのロジックを貼り付けてください ▼▼▼
        //
    }

    /**
     * 【重要】ログインフォームを表示する
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     */
    async showLoginForm() {
        console.log("AuthManager: ログインフォームを表示します。");
        //
        // ▼▼▼ この部分に、元のspots.jsにあったshowLoginFormのロジックを貼り付けてください ▼▼▼
        //
    }

    /**
     * 【重要】新規登録処理を行う
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     * ただし、成功時の処理を以下のように変更してください。
     */
    async handleRegistration(event) {
        try {
            // ... (フォームから値を取得し、バリデーションするロジック) ...
            const userData = { /* ... */ };

            this.ui.showMessage('ユーザー登録中...', 'info');
            await api.registerUser(userData);
            this.ui.showMessage('登録が完了しました！', 'success');
            
            this.removeModal();
            // ★重要: 登録成功後、アプリのメイン処理を再キックする
            await this.app.start(this.app.map, this.app.userLocation);

        } catch (error) {
            this.ui.showMessage(`登録に失敗しました: ${error.message}`, 'error');
        }
    }
    
    /**
     * 【重要】ログイン処理を行う
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     * ただし、成功時の処理を以下のように変更してください。
     */
    async handleLogin(event) {
        try {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            // ... (バリデーション) ...

            this.ui.showMessage('ログイン中...', 'info');
            await api.loginUser(username, password);
            this.ui.showMessage('ログインしました！', 'success');

            this.removeModal();
            // ★重要: ログイン成功後、アプリのメイン処理を再キックする
            await this.app.start(this.app.map, this.app.userLocation);

        } catch (error) {
            this.ui.showMessage(`ログインに失敗しました: ${error.message}`, 'error');
        }
    }

    /**
     * 【重要】モーダルを削除する
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     */
    removeModal() {
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
    }
}
