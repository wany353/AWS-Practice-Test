import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // 开发环境由 Vite proxy 转发，生产环境由 nginx 转发
  timeout: 10000,
});

// 请求拦截器，给所有请求带上 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
