requireAuth();
const me = getUser();

document.getElementById('myProfileLink').href = `profile.html?id=${me.id}`;
document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

const params = new URLSearchParams(window.location.search);
const profileId = params.get('id') || me.id;
const isOwnProfile = profileId === me.id;

const profileCard = document.getElementById('profileCard');
const editCard = document.getElementById('editCard');
const profilePosts = document.getElementById('profilePosts');

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

function profileCardHtml(user, isFollowing) {
  return `
    <div class="profile-header">
      ${avatarHtml(user)}
      <div class="profile-info">
        <h2>${escapeHtml(user.username)}</h2>
        <p class="bio">${escapeHtml(user.bio) || '<span class="muted">No bio yet.</span>'}</p>
      </div>
    </div>
    <div class="profile-stats">
      <div><b>${user.followers.length}</b><span class="muted">Followers</span></div>
      <div><b>${user.following.length}</b><span class="muted">Following</span></div>
    </div>
    <div style="margin-top:14px; display:flex; gap:8px;">
      ${
        isOwnProfile
          ? `<button class="secondary small" id="editProfileBtn">Edit profile</button>`
          : `<button class="small ${isFollowing ? 'secondary' : ''}" id="followBtn">${isFollowing ? 'Unfollow' : 'Follow'}</button>`
      }
    </div>
  `;
}

function postCardHtml(post) {
  const liked = post.likes.includes(me.id);
  return `
    <div class="card" data-post-id="${post._id}">
      <div class="post-header">
        ${avatarHtml(post.author)}
        <div class="post-meta">
          <span class="username">${escapeHtml(post.author.username)}</span>
          <span class="time">${timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <div class="post-text">${escapeHtml(post.text)}</div>
      ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="">` : ''}
      <div class="post-actions">
        <button class="action-btn like-btn ${liked ? 'liked' : ''}" data-id="${post._id}">
          ${liked ? '♥' : '♡'} <span class="like-count">${post.likes.length}</span>
        </button>
        ${post.author._id === me.id ? `<button class="action-btn delete-post" data-id="${post._id}">🗑 Delete</button>` : ''}
      </div>
    </div>
  `;
}

async function loadProfile() {
  try {
    const { user, posts } = await apiRequest(`/users/${profileId}`);
    const isFollowing = user.followers.some((f) => (f._id || f) === me.id);

    profileCard.innerHTML = profileCardHtml(user, isFollowing);

    if (isOwnProfile) {
      document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('editBio').value = user.bio || '';
        document.getElementById('editAvatar').value = user.avatar || '';
        editCard.classList.toggle('hidden');
      });
    } else {
      document.getElementById('followBtn').addEventListener('click', async (e) => {
        try {
          const result = await apiRequest(`/users/${profileId}/follow`, {
            method: 'POST',
            auth: true,
          });
          e.target.textContent = result.following ? 'Unfollow' : 'Follow';
          e.target.classList.toggle('secondary', result.following);
        } catch (err) {
          showMessage(err.message);
        }
      });
    }

    if (posts.length === 0) {
      profilePosts.innerHTML = '<div class="empty-state">No posts yet.</div>';
    } else {
      profilePosts.innerHTML = posts.map(postCardHtml).join('');
    }
  } catch (err) {
    profileCard.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  try {
    await apiRequest(`/users/${me.id}`, {
      method: 'PUT',
      auth: true,
      body: {
        bio: document.getElementById('editBio').value.trim(),
        avatar: document.getElementById('editAvatar').value.trim(),
      },
    });
    editCard.classList.add('hidden');
    loadProfile();
  } catch (err) {
    showMessage(err.message);
  }
});

profilePosts.addEventListener('click', async (e) => {
  const likeBtn = e.target.closest('.like-btn');
  const deleteBtn = e.target.closest('.delete-post');

  if (likeBtn) {
    const id = likeBtn.dataset.id;
    try {
      const result = await apiRequest(`/posts/${id}/like`, { method: 'POST', auth: true });
      likeBtn.innerHTML = `${result.liked ? '♥' : '♡'} <span class="like-count">${result.likesCount}</span>`;
      likeBtn.classList.toggle('liked', result.liked);
    } catch (err) {
      showMessage(err.message);
    }
  }

  if (deleteBtn) {
    const ok = await showConfirm('Delete this post?');
    if (!ok) return;
    try {
      await apiRequest(`/posts/${deleteBtn.dataset.id}`, { method: 'DELETE', auth: true });
      loadProfile();
    } catch (err) {
      showMessage(err.message);
    }
  }
});

loadProfile();
