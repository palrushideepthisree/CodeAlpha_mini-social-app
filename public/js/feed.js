requireAuth();
const me = getUser();

document.getElementById('myProfileLink').href = `profile.html?id=${me.id}`;

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

const feedList = document.getElementById('feedList');
const postForm = document.getElementById('postForm');

/* ---------- On-page confirm & message boxes (replaces confirm()/alert()) ---------- */

(function injectPopupStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #confirmBox, #msgBox {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      font-family: inherit;
    }
    #confirmBox {
      display: none;
      background: #fff;
      border: 1px solid #ccc;
      padding: 15px 20px;
      text-align: center;
    }
    #confirmBox p { margin: 0 0 10px; }
    #confirmBox button {
      margin: 0 5px;
      padding: 6px 14px;
      border-radius: 5px;
      border: none;
      cursor: pointer;
    }
    #confirmYes { background: #d9363e; color: #fff; }
    #confirmNo { background: #eee; color: #333; }
    #msgBox {
      display: none;
      background: #ffe0e0;
      color: #900;
      padding: 10px 20px;
    }
  `;
  document.head.appendChild(style);

  const confirmBox = document.createElement('div');
  confirmBox.id = 'confirmBox';
  confirmBox.innerHTML = `
    <p id="confirmText"></p>
    <button id="confirmYes">Yes</button>
    <button id="confirmNo">Cancel</button>
  `;
  document.body.appendChild(confirmBox);

  const msgBox = document.createElement('div');
  msgBox.id = 'msgBox';
  document.body.appendChild(msgBox);
})();

function showConfirm(message) {
  return new Promise((resolve) => {
    const box = document.getElementById('confirmBox');
    document.getElementById('confirmText').textContent = message;
    box.style.display = 'block';

    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    const cleanup = (result) => {
      box.style.display = 'none';
      yesBtn.onclick = null;
      noBtn.onclick = null;
      resolve(result);
    };

    yesBtn.onclick = () => cleanup(true);
    noBtn.onclick = () => cleanup(false);
  });
}

function showMessage(message) {
  const box = document.getElementById('msgBox');
  box.textContent = message;
  box.style.display = 'block';
  setTimeout(() => { box.style.display = 'none'; }, 3000);
}

/* ---------- Rest of your app logic ---------- */

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('postText').value.trim();
  const image = document.getElementById('postImage').value.trim();
  if (!text) return;

  try {
    await apiRequest('/posts', { method: 'POST', auth: true, body: { text, image } });
    document.getElementById('postText').value = '';
    document.getElementById('postImage').value = '';
    loadFeed();
  } catch (err) {
    showMessage(err.message);
  }
});

function postCardHtml(post) {
  const liked = post.likes.includes(me.id);
  return `
    <div class="card" data-post-id="${post._id}">
      <div class="post-header">
        ${avatarHtml(post.author)}
        <div class="post-meta">
          <a class="username" href="profile.html?id=${post.author._id}">${escapeHtml(post.author.username)}</a>
          <span class="time">${timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <div class="post-text">${escapeHtml(post.text)}</div>
      ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="">` : ''}
      <div class="post-actions">
        <button class="action-btn like-btn ${liked ? 'liked' : ''}" data-id="${post._id}">
          ${liked ? '♥' : '♡'} <span class="like-count">${post.likes.length}</span>
        </button>
        <button class="action-btn comment-toggle" data-id="${post._id}">💬 Comments</button>
        ${post.author._id === me.id ? `<button class="action-btn delete-post" data-id="${post._id}">🗑 Delete</button>` : ''}
      </div>
      <div class="comments-section hidden" id="comments-${post._id}"></div>
    </div>
  `;
}

async function loadFeed() {
  feedList.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const posts = await apiRequest('/posts');
    if (posts.length === 0) {
      feedList.innerHTML = '<div class="empty-state">No posts yet. Be the first to share something!</div>';
      return;
    }
    feedList.innerHTML = posts.map(postCardHtml).join('');
  } catch (err) {
    feedList.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

feedList.addEventListener('click', async (e) => {
  const likeBtn = e.target.closest('.like-btn');
  const commentToggle = e.target.closest('.comment-toggle');
  const deleteBtn = e.target.closest('.delete-post');

  if (likeBtn) {
    const id = likeBtn.dataset.id;
    try {
      const result = await apiRequest(`/posts/${id}/like`, { method: 'POST', auth: true });
      likeBtn.classList.toggle('liked', result.liked);
      likeBtn.querySelector('.like-count').textContent = result.likesCount;
      likeBtn.innerHTML = `${result.liked ? '♥' : '♡'} <span class="like-count">${result.likesCount}</span>`;
    } catch (err) {
      showMessage(err.message);
    }
  }

  if (commentToggle) {
    const id = commentToggle.dataset.id;
    const section = document.getElementById(`comments-${id}`);
    section.classList.toggle('hidden');
    if (!section.classList.contains('hidden') && !section.dataset.loaded) {
      await loadComments(id, section);
    }
  }

  if (deleteBtn) {
    const ok = await showConfirm('Delete this post?');
    if (!ok) return;
    const id = deleteBtn.dataset.id;
    try {
      await apiRequest(`/posts/${id}`, { method: 'DELETE', auth: true });
      loadFeed();
    } catch (err) {
      showMessage(err.message);
    }
  }
});

async function loadComments(postId, section) {
  section.innerHTML = '<p class="muted">Loading comments...</p>';
  try {
    const comments = await apiRequest(`/posts/${postId}/comments`);
    section.dataset.loaded = 'true';
    section.innerHTML = `
      <div class="comment-list">
        ${comments.map(commentHtml).join('') || '<p class="muted">No comments yet.</p>'}
      </div>
      <form class="comment-form" data-post-id="${postId}">
        <input type="text" placeholder="Write a comment..." maxlength="300" required>
        <button type="submit">Send</button>
      </form>
    `;
  } catch (err) {
    section.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

function commentHtml(c) {
  return `
    <div class="comment">
      ${avatarHtml(c.author, 'small')}
      <div class="comment-bubble">
        <span class="username">${escapeHtml(c.author.username)}</span>
        <div class="text">${escapeHtml(c.text)}</div>
      </div>
    </div>
  `;
}

feedList.addEventListener('submit', async (e) => {
  if (!e.target.classList.contains('comment-form')) return;
  e.preventDefault();
  const form = e.target;
  const postId = form.dataset.postId;
  const input = form.querySelector('input');
  const text = input.value.trim();
  if (!text) return;

  try {
    await apiRequest(`/posts/${postId}/comments`, {
      method: 'POST',
      auth: true,
      body: { text },
    });
    input.value = '';
    const section = document.getElementById(`comments-${postId}`);
    section.dataset.loaded = '';
    loadComments(postId, section);
  } catch (err) {
    showMessage(err.message);
  }
});

loadFeed();
