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
        // モーダルのHTMLを生成し、document.bodyに追加する処理です。
        // 「新規登録」「ログイン」ボタンに、それぞれshowRegistrationFormやshowLoginFormを
        // 呼び出すイベントリスナーを設定する部分も含みます。
        //

    // ウェルカムモーダル表示（登録/ログイン選択）
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

    /**
     * 【重要】新規登録フォームを表示する
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     */
    async showRegistrationForm() {
        console.log("AuthManager: 新規登録フォームを表示します。");
        //
   // 新規登録フォーム表示
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


    /**
     * 【重要】ログインフォームを表示する
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     */
    async showLoginForm() {
        console.log("AuthManager: ログインフォームを表示します。");
        //
    // ログインフォーム表示
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

    /**
     * 【重要】新規登録処理を行う
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     * ただし、成功時の処理を以下のように変更してください。
     */
    /*async handleRegistration(event) {
        try {
            // ... (フォームから値を取得し、バリデーションするロジック) ...
            const userData = { ...};

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
    */
    /**
     * 【重要】ログイン処理を行う
     * このメソッドの中身を、あなたの元のspots.jsからコピー＆ペーストしてください。
     * ただし、成功時の処理を以下のように変更してください。
     */
    /*async handleLogin(event) {
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
    }*/
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
