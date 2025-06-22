function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

function genreName(index) {
  const genres = ["カフェ", "ラーメン", "イタリアン", "定食", "スイーツ", "バー", "和食"];
  return genres[index] || "その他";
}

const classifier = knnClassifier.create();

// 学習データ（30件分）
classifier.addExample(tf.tensor([1, 3.0, 4, 0]), "bad");
classifier.addExample(tf.tensor([2, 3.2, 4, 0]), "bad");
classifier.addExample(tf.tensor([1, 2.9, 3, 0]), "bad");
classifier.addExample(tf.tensor([5, 3.4, 3, 0]), "bad");
classifier.addExample(tf.tensor([4, 4.6, 15, 0]), "good");
classifier.addExample(tf.tensor([0, 4.5, 20, 1]), "good");
classifier.addExample(tf.tensor([2, 4.8, 18, 1]), "good");
classifier.addExample(tf.tensor([3, 3.0, 2, 0]), "bad");
classifier.addExample(tf.tensor([1, 3.5, 6, 0]), "bad");
classifier.addExample(tf.tensor([0, 4.3, 12, 0]), "good");
classifier.addExample(tf.tensor([4, 4.1, 8, 1]), "good");
classifier.addExample(tf.tensor([3, 3.8, 10, 1]), "good");
classifier.addExample(tf.tensor([1, 2.5, 1, 0]), "bad");
classifier.addExample(tf.tensor([2, 3.6, 5, 0]), "bad");
classifier.addExample(tf.tensor([0, 4.7, 16, 1]), "good");
classifier.addExample(tf.tensor([1, 3.2, 4, 1]), "bad");
classifier.addExample(tf.tensor([3, 4.0, 11, 1]), "good");
classifier.addExample(tf.tensor([5, 3.9, 7, 1]), "good");
classifier.addExample(tf.tensor([6, 3.3, 2, 0]), "bad");
classifier.addExample(tf.tensor([2, 4.9, 25, 1]), "good");
classifier.addExample(tf.tensor([0, 4.0, 7, 0]), "good");
classifier.addExample(tf.tensor([4, 3.5, 6, 0]), "bad");
classifier.addExample(tf.tensor([3, 3.2, 3, 0]), "bad");
classifier.addExample(tf.tensor([1, 4.0, 9, 1]), "good");
classifier.addExample(tf.tensor([2, 4.2, 14, 1]), "good");
classifier.addExample(tf.tensor([5, 3.0, 5, 0]), "bad");
classifier.addExample(tf.tensor([6, 3.6, 5, 0]), "bad");
classifier.addExample(tf.tensor([0, 4.9, 30, 1]), "good");
classifier.addExample(tf.tensor([2, 3.3, 6, 0]), "bad");
classifier.addExample(tf.tensor([1, 3.9, 10, 0]), "good");

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("recommend-list");
  container.innerHTML = "";

  try {
    const res = await fetch("http://localhost:8000/posts");
    const posts = await res.json();

    const goodPosts = [];
    const badPosts = [];

    for (let post of posts) {
      const input = tf.tensor([post.genre, post.rating, post.likes, post.byFriend]);
      const result = await classifier.predictClass(input, 5);
      input.dispose();

      if (result.label === "good") {
        goodPosts.push(post);
      } else {
        badPosts.push(post);
      }
    }

    const displayPosts = [...goodPosts.slice(0, 5)];
    const remaining = 5 - displayPosts.length;
    if (remaining > 0) {
      displayPosts.push(...badPosts.slice(0, remaining));
    }

    for (let post of displayPosts) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${post.photo_url}" alt="${post.name}" />
        <h3>${post.name}</h3>
        <span class="category">${genreName(post.genre)}</span>
        <div class="stars">${getStars(post.rating)}</div>
      `;
      container.appendChild(card);
    }

  } catch (err) {
    console.error("取得失敗:", err);
    container.innerHTML = "<p style='color:red;'>おすすめの取得に失敗しました。</p>";
  }
});