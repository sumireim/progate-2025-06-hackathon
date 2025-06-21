// ui.js - UI関連の描画・操作を専門に担当するモジュール

class UIManager {
    constructor() {
        // DOM要素を一度だけ取得
        this.elements = {
            recommendList: document.getElementById('recommend-list'),
            postList: document.getElementById('post-list'),
            postBtn: document.getElementById('btn-post'),
            postFormOverlay: document.getElementById('post-form-overlay'),
            postFormMenu: document.getElementById('post-form-menu'),
            postForm: document.getElementById('post-form'),
            closePostFormBtn: document.getElementById('btn-close-post-form'),
            menuBtn: document.getElementById('btn-menu'),
            userMenuOverlay: document.getElementById('user-menu-overlay'),
            userMenu: document.getElementById('user-menu'),
            searchBtn: document.getElementById('btn-search'),
            searchInput: document.getElementById('search-input'),
            userNameInMenu: document.querySelector('.user-menu-name')
        };
        
        this.messageContainer = this.createMessageContainer();

        // 閉じるときのイベントリスナーはUI内で完結させる
        this.elements.closePostFormBtn?.addEventListener('click', () => this.hidePostForm());
        this.elements.postFormOverlay?.addEventListener('click', () => this.hidePostForm());
        this.elements.userMenuOverlay?.addEventListener('click', () => this.hideUserMenu());
    }

    createMessageContainer() {
        let container = document.getElementById('message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'message-container';
            container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10001; max-width: 400px;`;
            document.body.appendChild(container);
        }
        return container;
    }

    showMessage(message, type = 'info', duration = 5000) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        // (スタイル設定は省略。元のコードをコピーしてください)
        this.messageContainer.appendChild(messageElement);
        // (アニメーションや削除のロジックも元のコードをコピーしてください)
    }

    displayRecommendations(recommendations) {
        if (!this.elements.recommendList) return;
        // (おすすめスポットを描画するHTML生成ロジックは元のコードをコピーしてください)
    }

    displayRecentPosts(spots) {
        if (!this.elements.postList) return;
        // (最新投稿を描画するHTML生成ロジックは元のコードをコピーしてください)
    }
    
    getRelativeTime(dateString) {
        // (相対時間を計算するロジックは元のコードをコピーしてください)
    }

    showPostForm() {
        this.elements.postFormOverlay?.classList.remove('hidden');
        this.elements.postFormMenu?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hidePostForm() {
        this.elements.postFormOverlay?.classList.add('hidden');
        this.elements.postFormMenu?.classList.add('hidden');
        document.body.style.overflow = '';
        this.elements.postForm?.reset();
    }

    toggleUserMenu() {
        this.elements.userMenu?.classList.toggle('hidden');
        this.elements.userMenuOverlay?.classList.toggle('hidden');
    }
    
    hideUserMenu() {
        this.elements.userMenu?.classList.add('hidden');
        this.elements.userMenuOverlay?.classList.add('hidden');
    }

    updateUIForAuthenticatedUser(user) {
        if (this.elements.userNameInMenu && user) {
            this.elements.userNameInMenu.textContent = user.display_name || user.username;
        }
    }

    updateUIForGuestUser() {
        if (this.elements.userNameInMenu) {
            this.elements.userNameInMenu.textContent = 'ゲスト';
        }
    }
}
