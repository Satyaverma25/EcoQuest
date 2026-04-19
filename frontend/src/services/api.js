import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ecoquest_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const quizAPI = {
  getAll: (params) => api.get('/quizzes', { params }),
  getOne: (id) => api.get(`/quizzes/${id}`),
  submit: (id, answers, timeTaken) => api.post(`/quizzes/${id}/submit`, { answers, timeTaken }),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
};

export const challengeAPI = {
  getAll: () => api.get('/challenges'),
  complete: (id) => api.post(`/challenges/${id}/complete`),
  create: (data) => api.post('/challenges', data),
};

export const leaderboardAPI = {
  get: (period = 'all', limit = 50) => api.get('/leaderboard', { params: { period, limit } }),
};

export const userAPI = {
  getStats: () => api.get('/users/me/stats'),
  getProfile: (id) => api.get(`/users/${id}/profile`),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const badgeAPI = {
  getAll: () => api.get('/badges'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
};

// ── NEW APIs ──────────────────────────────────────────────────────────────────
export const activityAPI = {
  submit: (formData) => api.post('/activities', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: () => api.get('/activities/my'),
  getPending: () => api.get('/activities/pending'),
  getAll: (params) => api.get('/activities/all', { params }),
  review: (id, data) => api.put(`/activities/${id}/review`, data),
};

export const missionAPI = {
  getAll: () => api.get('/missions'),
  getOne: (id) => api.get(`/missions/${id}`),
  start: (id) => api.post(`/missions/${id}/start`),
  completeStep: (id, stepOrder) => api.post(`/missions/${id}/step/${stepOrder}`),
  create: (data) => api.post('/missions', data),
  update: (id, data) => api.put(`/missions/${id}`, data),
  delete: (id) => api.delete(`/missions/${id}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const analyticsAPI = {
  getTeacher: () => api.get('/analytics/teacher'),
  getStudent: (id) => api.get(`/analytics/student/${id}`),
};
