requireAuth();
const me = getUser();

document.getElementById('myProfileLink').href = `profile.html?id=${me.id}`;

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

const feedList = document.getElementById('feedList');
const postForm = document.getElementById('postForm');

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
    alert(err.message);
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
      alert(err.message);
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
    if (!confirm('Delete this post?')) return;
    const id = deleteBtn.dataset.id;
    try {
      await apiRequest(`/posts/${id}`, { method: 'DELETE', auth: true });
      loadFeed();
    } catch (err) {
      alert(err.message);
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
    alert(err.message);
  }
});

loadFeed();
