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
                    p><strong>${spot.title}</strong> - ${spot.description || ''}</p>
                    <div class="post-time">${this.getRelativeTime(spot.created_at)}</div>
                </div>
            </li>
        `).join('');
        this.elements.postList.innerHTML = postsHTML;
    }
    
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