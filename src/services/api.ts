import axios from 'axios';
import { Platform } from 'react-native';
import {
    API_BASE_URL,
    FORCE_WEB_PROXY,
    STORAGE_KEYS,
    WEB_PROXY_BASE_URL,
    isLocalApiUrl,
} from '../config/constants';
import { authStorage } from './authStorage';

const BASE_URL = API_BASE_URL;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

type TokenRefreshHandler = () => Promise<string | null>;

let tokenRefreshHandler: TokenRefreshHandler | null = null;
let webBaseUrlPromise: Promise<string> | null = null;

axios.defaults.timeout = 15000;

export const setTokenRefreshHandler = (handler: TokenRefreshHandler): void => {
    tokenRefreshHandler = handler;
};

if (__DEV__) {
    console.log('[API] Base URL:', BASE_URL);
}

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'ngrok-skip-browser-warning': 'true',
    },
});

const getStoredToken = async (): Promise<string | null> => {
    try {
        return await authStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
        if (__DEV__) {
            console.error('[API] Error getting auth token:', error);
        }
        return null;
    }
};

const clearStoredTokens = async (): Promise<void> => {
    try {
        await authStorage.clearItems([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER,
        ]);
    } catch (error) {
        if (__DEV__) {
            console.error('[API] Error clearing tokens:', error);
        }
    }
};

const shouldProbeWebProxy = (): boolean => {
    return Platform.OS === 'web'
        && Boolean(WEB_PROXY_BASE_URL)
        && isLocalApiUrl(WEB_PROXY_BASE_URL as string)
        && !FORCE_WEB_PROXY;
};

const probeWebProxy = async (): Promise<string> => {
    if (!shouldProbeWebProxy()) {
        return BASE_URL;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 800) : null;

    try {
        const response = await fetch(`${WEB_PROXY_BASE_URL}/auth/login`, {
            method: 'OPTIONS',
            signal: controller?.signal,
        });

        return response.ok ? (WEB_PROXY_BASE_URL as string) : BASE_URL;
    } catch {
        return BASE_URL;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};

const getRuntimeBaseUrl = async (): Promise<string> => {
    if (!shouldProbeWebProxy()) {
        return BASE_URL;
    }

    webBaseUrlPromise ??= probeWebProxy().then((resolvedBaseUrl) => {
        if (__DEV__ && resolvedBaseUrl !== BASE_URL) {
            console.log('[API] Using local web proxy:', resolvedBaseUrl);
        }
        return resolvedBaseUrl;
    });

    return await webBaseUrlPromise;
};

api.interceptors.request.use(
    async (config) => {
        config.baseURL = await getRuntimeBaseUrl();

        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            const headers = config.headers as Record<string, any> & { delete?: (name: string) => void };
            if (typeof headers?.delete === 'function') {
                headers.delete('Content-Type');
            } else if (headers) {
                delete headers['Content-Type'];
                delete headers['content-type'];
            }
        }

        const token = await getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

const isAuthRoute = (url?: string): boolean => {
    if (!url) return false;
    return /\/(auth)\/(login|signup|send-otp|verify-otp|forgot-password|reset-password)(\/|$|\?)/i.test(url)
        || url.endsWith('/auth/login')
        || url.endsWith('/auth/signup');
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute(originalRequest?.url)) {
            originalRequest._retry = true;
            if (__DEV__) {
                console.log('[API] 401 received - attempting token refresh');
            }

            try {
                const newToken = tokenRefreshHandler ? await tokenRefreshHandler() : null;
                if (newToken) {
                    if (__DEV__) {
                        console.log('[API] Refresh successful - retrying request');
                    }
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                if (__DEV__) {
                    console.error('[API] Token refresh interceptor error:', refreshError);
                }
            }

            await clearStoredTokens();
            if (__DEV__) {
                console.log('[API] Refresh failed or unavailable - session cleared');
            }
            return Promise.reject(error);
        }

        const config = error.config as typeof error.config & { _retryCount?: number };
        const isNetworkError = !error.response;
        const isGet = config?.method?.toLowerCase() === 'get';

        if (isNetworkError && isGet && config) {
            config._retryCount = (config._retryCount ?? 0) + 1;
            if (config._retryCount <= MAX_RETRIES) {
                if (__DEV__) {
                    console.log(`[API] Network error retry ${config._retryCount}/${MAX_RETRIES}`);
                }
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
