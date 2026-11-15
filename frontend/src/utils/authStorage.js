// src/utils/authStorage.js

// ---------- Admin / staff ----------
const TOKEN_KEY = 'smartparking_admin_token';
const ADMIN_KEY = 'smartparking_admin_info';

export function saveAuth(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdmin() {
  const data = localStorage.getItem(ADMIN_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

// ---------- Vehicle owner ----------
const OWNER_TOKEN_KEY = 'smartparking_owner_token';
const OWNER_INFO_KEY = 'smartparking_owner_info';

export function saveOwnerAuth(token, owner) {
  localStorage.setItem(OWNER_TOKEN_KEY, token);
  localStorage.setItem(OWNER_INFO_KEY, JSON.stringify(owner));
}

export function getOwnerToken() {
  return localStorage.getItem(OWNER_TOKEN_KEY);
}

export function getOwner() {
  const data = localStorage.getItem(OWNER_INFO_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearOwnerAuth() {
  localStorage.removeItem(OWNER_TOKEN_KEY);
  localStorage.removeItem(OWNER_INFO_KEY);
}

export function isOwnerLoggedIn() {
  return !!getOwnerToken();
}