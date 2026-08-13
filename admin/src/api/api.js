import axios from 'axios';
import { attachRenderRetry, wakeRenderServer } from './renderKeepAlive';

// Environment Variable
const BASE = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 30000,
});

attachRenderRetry(API);
wakeRenderServer();

// Attach JWT Token Automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin-token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================
   AUTH
========================== */
export const login = (data) => API.post('/auth/login', data);

/* ==========================
   PROJECTS
========================== */
export const getProjects = () => API.get('/projects');

export const createProject = (data) =>
  API.post('/projects', data);

export const updateProject = (id, data) =>
  API.put(`/projects/${id}`, data);

export const deleteProject = (id) =>
  API.delete(`/projects/${id}`);

/* ==========================
   MESSAGES
========================== */
export const getMessages = () =>
  API.get('/messages');

export const markRead = (id) =>
  API.put(`/messages/${id}/read`);

export const replyMessage = (id, reply) =>
  API.put(`/messages/${id}/reply`, { reply });

export const deleteMessage = (id) =>
  API.delete(`/messages/${id}`);

/* ==========================
   COMPLIMENTS
========================== */
export const getAllCompliments = () =>
  API.get('/compliments/all');

export const approveCompliment = (id) =>
  API.put(`/compliments/${id}/approve`);

export const deleteCompliment = (id) =>
  API.delete(`/compliments/${id}`);

/* ==========================
   PROFILE
========================== */
export const getProfile = () =>
  API.get('/profile');

export const updateProfile = (data) =>
  API.put('/profile', data);

/* ==========================
   IMAGE UPLOAD
========================== */
export const uploadImage = (file) => {
  const fd = new FormData();
  fd.append('image', file);

  return API.post('/upload', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/* ==========================
   RESUME UPLOAD
========================== */
export const uploadResume = (file) => {
  const fd = new FormData();
  fd.append("resume", file);

  return API.post("/upload/resume", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* ==========================
   AVATAR UPLOAD
========================== */
export const uploadAvatar = (file) => {
  const fd = new FormData();
  fd.append("avatar", file);

  return API.post("/upload/avatar", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* ==========================
   SKILLS
========================== */
export const getSkills = () =>
  API.get('/skills');

export const createSkill = (data) =>
  API.post('/skills', data);

export const updateSkill = (id, data) =>
  API.put(`/skills/${id}`, data);

export const deleteSkill = (id) =>
  API.delete(`/skills/${id}`);

/* ==========================
   EXPORT API INSTANCE
========================== */
export default API;