// Small wrapper around fetch() that automatically attaches the JWT token
// and points to the right base URL. Because the frontend is served by the
// same Express server as the API, we can just use relative paths ("/api/...")
// and it will work both locally and on Render.

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.message) || 'Something went wrong';
    throw new Error(message);
  }

  return data;
}

// Redirect to login if not authenticated. Call at the top of protected pages.
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

// Format an ISO date string into something like "2h ago"
function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  const intervals = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return 'just now';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function initials(name) {
  if (!name) return '?';
  return name.trim().slice(0, 2).toUpperCase();
}

function avatarHtml(user, sizeClass = '') {
  if (user && user.avatar) {
    return `<div class="avatar ${sizeClass}"><img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.username)}"></div>`;
  }
  return `<div class="avatar ${sizeClass}">${initials(user ? user.username : '?')}</div>`;
}
