import axios from 'axios';
import { supabase } from './supabaseClient';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
});

API.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
    // Optionally also set x-user-id
    config.headers['x-user-id'] = session.user.id;
  }
  return config;
});

API.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err?.response?.data?.error || 'Request failed')
);

export const weightAPI = {
  log: (data) => API.post('/api/weight', data),
  get: (params) => API.get('/api/weight', { params }),
  stats: (params) => API.get('/api/weight/stats', { params }),
};

export const mealsAPI = {
  log: (data) => API.post('/api/meals', data),
  get: (params) => API.get('/api/meals', { params }),
  today: (params) => API.get('/api/meals/today', { params }),
};

export const workoutPlanAPI = {
  create: (data) => API.post('/api/workout-plan', data),
  get: (params) => API.get('/api/workout-plan', { params }),
  delete: (id) => API.delete(`/api/workout-plan/${id}`),
};

export const workoutLogAPI = {
  log: (data) => API.post('/api/workout-log', data),
  get: (params) => API.get('/api/workout-log', { params }),
  stats: (params) => API.get('/api/workout-log/stats', { params }),
};

export const dashboardAPI = {
  get: (params) => API.get('/api/dashboard', { params }),
};

export const reportsAPI = {
  weekly: (params) => API.get('/api/reports/weekly', { params }),
};

export const aiAPI = {
  coach: (data) => API.post('/api/ai/coach', data),
};

export default API;
