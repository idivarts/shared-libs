import axios, { AxiosRequestConfig } from 'axios';
import { getToken } from './utils/authHelper';
import { TRENDY_API_BASE_URL } from './config';

const trendyAxios = axios.create({
    baseURL: TRENDY_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
trendyAxios.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common response errors
trendyAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized error
        }
        return Promise.reject(error);
    }
);

export default trendyAxios;