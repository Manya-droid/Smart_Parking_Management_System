// src/api/axiosClient.js
import axios from 'axios';
import { getToken, getOwnerToken } from '../utils/authStorage';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  // owner pages use the owner token; everything else uses the staff/admin token
  const onOwnerPage = window.location.pathname.startsWith('/owner');
  const token = onOwnerPage ? getOwnerToken() : getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;