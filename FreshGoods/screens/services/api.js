import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPADD } from '../ipadd';

/**
 * Centralized API service with:
 * - Automatic auth token injection
 * - Request/Response interceptors
 * - Timeout handling
 * - Error standardization
 */
const api = axios.create({
    baseURL: `http://${IPADD}:5000`,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to get auth token:', error.message);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear stored auth data and redirect to login
            await AsyncStorage.multiRemove(['token', 'userId', 'role']);

            // You may want to navigate to login here
            // navigationRef.current?.navigate('Login');
        }

        // Standardize error response
        const errorMessage = error.response?.data?.message
            || error.message
            || 'An unexpected error occurred';

        return Promise.reject({
            ...error,
            message: errorMessage,
            status: error.response?.status,
        });
    }
);

export default api;

// Helper methods for common operations
export const apiHelpers = {
    /**
     * GET request with optional params
     */
    get: (url, params = {}) => api.get(url, { params }),

    /**
     * POST request with data
     */
    post: (url, data) => api.post(url, data),

    /**
     * PUT request with data
     */
    put: (url, data) => api.put(url, data),

    /**
     * DELETE request
     */
    delete: (url) => api.delete(url),
};
