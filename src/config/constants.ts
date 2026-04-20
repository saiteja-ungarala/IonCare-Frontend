import { Platform } from 'react-native';

export const DEFAULT_API_URL = 'https://care-api.lifeionizersindia.com/api';
const DEFAULT_IMAGE_BASE_URL = 'https://pub-f1f2c948f5cd4ca485551ff4b5ef1d73.r2.dev/assets/images/';
export const FORCE_WEB_PROXY = process.env.EXPO_PUBLIC_FORCE_WEB_PROXY === 'true';

export const normalizeApiUrl = (url: string): string => {
    const trimmed = url.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const isLocalApiUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    } catch {
        return false;
    }
};

export const WEB_PROXY_BASE_URL = process.env.EXPO_PUBLIC_WEB_API_URL?.trim()
    ? normalizeApiUrl(process.env.EXPO_PUBLIC_WEB_API_URL.trim())
    : null;

const resolveApiBaseUrl = (): string => {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    const configuredWebUrl = WEB_PROXY_BASE_URL;
    const shouldUseWebUrl = Platform.OS === 'web'
        && Boolean(configuredWebUrl)
        && (FORCE_WEB_PROXY || !isLocalApiUrl(configuredWebUrl as string));
    const resolved = normalizeApiUrl(
        shouldUseWebUrl && configuredWebUrl
            ? configuredWebUrl
            : (configuredUrl || DEFAULT_API_URL)
    );

    if (__DEV__) {
        const usingImplicitDirectWebFallback = Platform.OS === 'web'
            && Boolean(configuredWebUrl)
            && isLocalApiUrl(configuredWebUrl as string)
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
const normalizeImageBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

export const API_BASE_URL = resolveApiBaseUrl();
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const IMAGE_BASE_URL = normalizeImageBaseUrl(
    process.env.EXPO_PUBLIC_IMAGE_BASE_URL || DEFAULT_IMAGE_BASE_URL
);
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
