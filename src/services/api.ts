// Axios API configuration

import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../config/constants';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api';
axios.defaults.timeout = 10000;

// Log API base URL at startup
console.log('[API] Base URL:', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// Storage helper for cross-platform token retrieval
const getStoredToken = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        }
        return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
        console.error('[API] Error getting auth token:', error);
        return null;
    }
};

// Storage helper for clearing tokens
const clearStoredTokens = async (): Promise<void> => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
        } else {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
        }
    } catch (error) {
        console.error('[API] Error clearing tokens:', error);
    }
};

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API] Token attached:', token ? 'Yes' : 'No');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling + GET retry on network error
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage and redirect to login
            await clearStoredTokens();
            console.log('[API] 401 received - tokens cleared');
            // Navigation to login will be handled by auth state change
            return Promise.reject(error);
        }

        const config = error.config as typeof error.config & { _retryCount?: number };
        const isNetworkError = !error.response;
        const isGet = config?.method?.toLowerCase() === 'get';

        if (isNetworkError && isGet && config) {
            config._retryCount = (config._retryCount ?? 0) + 1;
            if (config._retryCount <= MAX_RETRIES) {
                console.log(`[API] Network error — retry ${config._retryCount}/${MAX_RETRIES}`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
