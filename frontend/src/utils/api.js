import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cybertwin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cybertwin_token');
      localStorage.removeItem('cybertwin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  getMe:    ()     => API.get('/auth/me'),
};

export const investigationAPI = {
  investigate:    (text, inputType = 'message') => API.post('/investigate/message', { text, inputType }),
  getHistory:     (page = 1, limit = 10)        => API.get(`/investigate/history?page=${page}&limit=${limit}`),
  getById:        (id)                           => API.get(`/investigate/${id}`),
  submitFeedback: (id, data)                     => API.post(`/investigate/${id}/feedback`, data),
};

export const profileAPI = {
  getProfile:    ()     => API.get('/profile'),
  updateProfile: (data) => API.put('/profile', data),
};

export const trustCircleAPI = {
  getMyCircle:        ()           => API.get('/trust-circle'),
  sendInvite:         (data)       => API.post('/trust-circle/invite', data),
  getPendingRequests: ()           => API.get('/trust-circle/requests'),
  respondToRequest:   (id, action) => API.put(`/trust-circle/requests/${id}`, { action }),
  removeMember:       (id)         => API.delete(`/trust-circle/${id}`),
  searchUsers:        (q)          => API.get(`/trust-circle/search?q=${encodeURIComponent(q)}`),
};

export const reportsAPI = {
  create:          (data)       => API.post('/reports', data),
  getMyReports:    (page = 1)   => API.get(`/reports?page=${page}`),
  getSharedWithMe: ()           => API.get('/reports/shared'),
  getPublic:       (shareToken) => API.get(`/reports/public/${shareToken}`),
  getById:         (id)         => API.get(`/reports/${id}`),
  update:          (id, data)   => API.put(`/reports/${id}`, data),
  delete:          (id)         => API.delete(`/reports/${id}`),
};

export const networkScanAPI = {
  getDomains:     ()             => API.get('/network-scan/domains'),
  addDomain:      (data)         => API.post('/network-scan/domains', data),
  getDomain:      (id)           => API.get(`/network-scan/domains/${id}`),
  deleteDomain:   (id)           => API.delete(`/network-scan/domains/${id}`),
  verifyDomain:   (id)           => API.post(`/network-scan/domains/${id}/verify`),
  startScan:      (id, scanType) => API.post(`/network-scan/domains/${id}/scan`, { scanType, consentConfirmed: true }),
  getScanResult:  (scanId)       => API.get(`/network-scan/domains/results/${scanId}`),
  getScanHistory: (id)           => API.get(`/network-scan/domains/${id}/history`),
};

export default API;
