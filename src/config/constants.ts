import { Platform } from 'react-native';

const DEFAULT_API_URL = 'https://ioncare-backend-production.up.railway.app/api';
const FORCE_WEB_PROXY = process.env.EXPO_PUBLIC_FORCE_WEB_PROXY === 'true';

const normalizeApiUrl = (url: string): string => {
    const trimmed = url.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const isLocalApiUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    } catch {
        return false;
    }
};

const resolveApiBaseUrl = (): string => {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    const configuredWebUrl = process.env.EXPO_PUBLIC_WEB_API_URL?.trim();
    const shouldUseWebUrl = Platform.OS === 'web'
        && Boolean(configuredWebUrl)
        && (FORCE_WEB_PROXY || !isLocalApiUrl(configuredWebUrl));
    const resolved = normalizeApiUrl(
        shouldUseWebUrl && configuredWebUrl
            ? configuredWebUrl
            : (configuredUrl || DEFAULT_API_URL)
    );

    if (__DEV__) {
        const usingImplicitDirectWebFallback = Platform.OS === 'web'
            && Boolean(configuredWebUrl)
            && isLocalApiUrl(configuredWebUrl)
            && !FORCE_WEB_PROXY;
        console.log(
            usingImplicitDirectWebFallback
                ? '[Config] API_BASE_URL (web direct fallback):'
                : shouldUseWebUrl
                ? '[Config] API_BASE_URL (web proxy):'
                : '[Config] API_BASE_URL:',
            resolved
        );
    }

    return resolved;
};

const normalizeOptionalValue = (value?: string): string => String(value || '').trim();

export const API_BASE_URL = resolveApiBaseUrl();
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const SUPPORT_CONFIG = {
    phone: normalizeOptionalValue(process.env.EXPO_PUBLIC_SUPPORT_PHONE),
    email: normalizeOptionalValue(process.env.EXPO_PUBLIC_SUPPORT_EMAIL),
    whatsapp: normalizeOptionalValue(process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP).replace(/\D/g, ''),
    hours: normalizeOptionalValue(process.env.EXPO_PUBLIC_SUPPORT_HOURS),
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
} as const;
