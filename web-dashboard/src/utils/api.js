import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.189.121.234:5000/api/v1', // የሰርቨርህ IP አድራሻ
  timeout: 10000,
});

// ለሁሉም ጥያቄዎች JWT Token በራስ-ሰር እንዲላክ ማድረግ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // በዌብ ከሆነ
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;