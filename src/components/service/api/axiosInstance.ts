import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://wdp301-ev-rental-backend.onrender.com',
  timeout: 120000, // 120 seconds timeout for slower operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
};

// Create axios instance
export const axiosInstance: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor - Add auth token and minimal logging
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available (but not for login endpoint)
    const token = localStorage.getItem('auth_token');
    if (token && config.headers && !config.url?.includes('/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Clear auth data and redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.`
      );
      return Promise.reject(networkError);
    }

    // Handle specific HTTP status codes with Vietnamese messages
    const status = error.response.status;
    const errorData = error.response.data as any;
    const errorMessage = errorData?.message || errorData?.error || `Lỗi ${status}`;

    switch (status) {
      case 400:
        return Promise.reject(new Error(`Yêu cầu không hợp lệ: ${errorMessage}`));
      case 401:
        return Promise.reject(new Error(`Không có quyền truy cập: ${errorMessage}`));
      case 403:
        return Promise.reject(new Error(`Truy cập bị từ chối: ${errorMessage}`));
      case 404:
        return Promise.reject(new Error(`Không tìm thấy: ${errorMessage}`));
      case 422:
        return Promise.reject(new Error(`Dữ liệu không hợp lệ: ${errorMessage}`));
      case 500:
        return Promise.reject(new Error(`Lỗi server: ${errorMessage}`));
      default:
        return Promise.reject(new Error(`Yêu cầu thất bại (${status}): ${errorMessage}`));
    }
  }
);

// Export default instance
export default axiosInstance;