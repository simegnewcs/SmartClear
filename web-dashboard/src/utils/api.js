import axios from 'axios';

const api = axios.create({
  // Use localhost for local development, or network IP for testing on devices
  baseURL: 'http://localhost:5000/api/v1',  // Local development
  // baseURL: 'http://10.161.68.44:5000/api/v1',  // Network IP for device testing
  timeout: 15000,  // Increased timeout for slower networks
  headers: {
    'Content-Type': 'application/json'
  }
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