import axios from 'axios';

// Sanitize BASE_URL to avoid double /api or trailing slashes
let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
if (rawBaseUrl.endsWith('/')) rawBaseUrl = rawBaseUrl.slice(0, -1);
if (rawBaseUrl.endsWith('/api')) rawBaseUrl = rawBaseUrl.slice(0, -4);

export const BASE_URL = rawBaseUrl;

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
});

export const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};

// Request interceptor to add JWT token
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

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - logout user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
