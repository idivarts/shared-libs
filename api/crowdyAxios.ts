import axios, { AxiosRequestConfig } from 'axios';
import { getToken } from './utils/authHelper';
import { CROWDY_API_BASE_URL } from './config';

const crowdyAxios = axios.create({
    baseURL: CROWDY_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
crowdyAxios.interceptors.request.use(
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
crowdyAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized error
        }
        // Work on Adding retry mechanism Add retry mechanism  
        // axiosRetry(crowdyAxios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });  
        return Promise.reject(error);
    }
);

export default crowdyAxios;