// src/api.js
// Axios instance — all API calls go through this.

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Automatically attach JWT token to every request header.
// Token is saved in localStorage after login/register.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
