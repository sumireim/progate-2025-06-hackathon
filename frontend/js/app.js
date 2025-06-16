const btnMenu = document.getElementById('btn-menu');
const userMenu = document.getElementById('user-menu');
const userMenuOverlay = document.getElementById('user-menu-overlay');

const btnPost = document.getElementById('btn-post');
const postFormMenu = document.getElementById('post-form-menu');
const postFormOverlay = document.getElementById('post-form-overlay');
const btnClosePostForm = document.getElementById('btn-close-post-form');

btnMenu.addEventListener('click', () => {
  userMenu.classList.remove('hidden');
  userMenuOverlay.classList.remove('hidden');
  document.body.classList.add('menu-open');
});

userMenuOverlay.addEventListener('click', () => {
  userMenu.classList.add('hidden');
  userMenuOverlay.classList.add('hidden');
  document.body.classList.remove('menu-open');
});

// userMenu内で閉じる場合も必ずoverlayも閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    userMenu.classList.add('hidden');
    userMenuOverlay.classList.add('hidden');
    document.body.classList.remove('menu-open');
  }
});

btnPost.addEventListener('click', () => {
  postFormMenu.classList.remove('hidden');
  postFormOverlay.classList.remove('hidden');
  document.body.classList.add('menu-open');
});
btnClosePostForm.addEventListener('click', closePostForm);
postFormOverlay.addEventListener('click', closePostForm);

function closePostForm() {
  postFormMenu.classList.add('hidden');
  postFormOverlay.classList.add('hidden');
  document.body.classList.remove('menu-open');
}

// Escで閉じる（既存のイベントに追加OK。被り注意なら下記も可）
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePostForm();
  }
});