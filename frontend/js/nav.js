document.addEventListener('DOMContentLoaded', () => {
  // ユーザーメニューでの遷移
  const userMenuList = document.querySelector('.user-menu-list');
  if (userMenuList) {
      userMenuList.addEventListener('click', (e) => {
          const li = e.target.closest('li[data-nav]');
          if (!li) return;
          const nav = li.getAttribute('data-nav');
          switch (nav) {
              case 'mypost': window.location.href = 'my-posts.html'; break;
              case 'friends': window.location.href = 'friends.html'; break;
              case 'invite': window.location.href = 'invite.html'; break;
              case 'setting': window.location.href = 'setting.html'; break;
              case 'logout': window.location.href = 'logout.html'; break;
              default: break;
          }
      });
  }

  // 戻るボタン
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = "index.html";
    });
  }

  // キャンセルボタン
  const cancelBtn = document.getElementById('btn-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = "index.html";
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const requestList = document.getElementById('friend-request-list');
  if (requestList) {
    requestList.addEventListener('click', (e) => {
      if (e.target.classList.contains('accept-btn')) {
        const li = e.target.closest('li');
        if (li) {
          li.style.opacity = 0.5;
          e.target.textContent = '承認済み';
          e.target.disabled = true;
          // API連携するときは↓のように
          // api.acceptFriendRequest(li.dataset.username);
        }
      }
    });
  }
});
