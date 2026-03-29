import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5264/api', // Backend ASP.NET Core URL
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
