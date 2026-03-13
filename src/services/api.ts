import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { authService } from './authService';

const BASE_URL = API_BASE_URL;
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
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling + Token Refresh + Network Error retry
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized - Attempt Token Refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('[API] 401 received - attempting token refresh');
            
            try {
                const newToken = await authService.refreshToken();
                if (newToken) {
                    console.log('[API] Refresh successful - retrying request');
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('[API] Token refresh interceptor error:', refreshError);
            }
            
            // If refresh fails or no new token, clear and reject
            await clearStoredTokens();
            console.log('[API] Refresh failed or unavailable - session cleared');
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
