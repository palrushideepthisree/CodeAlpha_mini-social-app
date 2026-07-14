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
          alert(err.message);
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
    alert(err.message);
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
      alert(err.message);
    }
  }

  if (deleteBtn) {
    if (!confirm('Delete this post?')) return;
    try {
      await apiRequest(`/posts/${deleteBtn.dataset.id}`, { method: 'DELETE', auth: true });
      loadProfile();
    } catch (err) {
      alert(err.message);
    }
  }
});

loadProfile();
