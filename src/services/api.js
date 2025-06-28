import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  verifyOtp: ({ identifier, otp }) => api.post('/auth/verify-otp', { identifier, otp }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOtpResetPassword: ({ identifier, otp }) => api.post('/auth/verify-otp', { identifier, otp }), // Reuse verify-otp endpoint
  resetPassword: ({ identifier, otp, newPassword }) => api.post('/auth/reset-password', { identifier, otp, newPassword }),
};

// Broker API
export const brokerAPI = {
  getConnections: () => api.get('/broker/connections'),
  connect: (data) => api.post('/broker/connect', data),
  disconnect: (connectionId) => api.post('/broker/disconnect', { connectionId }),
};

// Orders API
export const ordersAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getPositions: () => api.get('/orders/positions'),
  getPnL: (params) => api.get('/orders/pnl', { params }),
};

export default api;