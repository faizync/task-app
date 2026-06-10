// src/api.js
// Axios instance — all API calls go through this.
// baseURL points to the backend EC2 private IP set at build time via REACT_APP_API_URL.

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // e.g. http://10.0.2.15/api
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
