import axios from "axios";

const rawBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
const BASE_URL = rawBase ? `${rawBase}/api` : '/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const login = (data) => API.post("/auth/login", data);

export const getProjects = () => API.get("/projects");
export const getSkills = () => API.get("/skills");
export const getProfile = () => API.get("/profile");

export const getCompliments = () => API.get("/compliments");

export const sendCompliment = (data) =>
  API.post("/compliments", data);

export const sendMessage = (data) =>
  API.post("/messages", data);

export default API;