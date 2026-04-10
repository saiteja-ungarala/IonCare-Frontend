import { ImageSourcePropType } from 'react-native';
import { API_BASE_URL } from '../config/constants';
import api from '../services/api';

const getUploadsBaseUrl = (): string => {
    const activeApiBaseUrl = String(api.defaults.baseURL || API_BASE_URL || '').trim();
    return activeApiBaseUrl.replace(/\/api\/?$/, '');
};

const isAbsoluteUrl = (value: string): boolean => {
    return /^https?:\/\//i.test(value) || value.startsWith('data:');
};

const ensureLeadingSlash = (value: string): string => {
    return value.startsWith('/') ? value : `/${value}`;
};

const FILE_NAME_TO_UPLOAD_PATH: Record<string, string> = {
    'watercans.jpg': '/uploads/products/watercans.jpg',
    'watercans.jpeg': '/uploads/products/watercans.jpg',
    'waterdispenser.avif': '/uploads/products/waterdispenser.avif',
    'rofilterset.avif': '/uploads/products/rofilterset.avif',
};

const STEM_TO_UPLOAD_PATH: Record<string, string> = {
    watercan: '/uploads/products/watercans.jpg',
    watercans: '/uploads/products/watercans.jpg',
    waterdispenser: '/uploads/products/waterdispenser.avif',
    rofilterset: '/uploads/products/rofilterset.avif',
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const normalizeStem = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const rewriteLocalAbsoluteUrl = (value: string): string => {
    try {
        const runtimeBase = getUploadsBaseUrl();
        if (!runtimeBase) return value;

        const inputUrl = new URL(value);
        const runtimeUrl = new URL(runtimeBase);

        if (!LOCAL_HOSTS.has(inputUrl.hostname.toLowerCase())) {
            return value;
        }

        if (inputUrl.host === runtimeUrl.host) {
            return value;
        }

        return `${runtimeUrl.origin}${inputUrl.pathname}${inputUrl.search}${inputUrl.hash}`;
    } catch {
        return value;
    }
};

interface StoreMediaResolveOptions {
    defaultUploadDir?: string;
    allowKnownProductAliases?: boolean;
}

export const resolveStoreMediaSource = (
    rawValue: string | null | undefined,
    options?: StoreMediaResolveOptions,
): ImageSourcePropType | null => {
    const value = String(rawValue || '').trim();
    if (!value) return null;
    const defaultUploadDir = String(options?.defaultUploadDir || 'products').trim() || 'products';
    const allowKnownProductAliases = options?.allowKnownProductAliases !== false;

    if (isAbsoluteUrl(value)) {
        if (value.startsWith('data:')) {
            return { uri: value };
        }
        return { uri: rewriteLocalAbsoluteUrl(value) };
    }

    const cleanPath = value.split('?')[0].split('#')[0].trim();
    const fileName = cleanPath.split('/').pop()?.toLowerCase() || '';
    const mappedPath = allowKnownProductAliases ? FILE_NAME_TO_UPLOAD_PATH[fileName] : undefined;
    const stem = normalizeStem(fileName.replace(/\.[^.]+$/, ''));
    const stemMappedPath = allowKnownProductAliases ? STEM_TO_UPLOAD_PATH[stem] : undefined;

    let relativePath: string;
    if (mappedPath) {
        relativePath = mappedPath;
    } else if (stemMappedPath) {
        relativePath = stemMappedPath;
    } else if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
        relativePath = ensureLeadingSlash(cleanPath);
    } else if (cleanPath.startsWith('/')) {
        relativePath = cleanPath;
    } else {
        relativePath = `/uploads/${defaultUploadDir}/${cleanPath}`;
    }

    const base = getUploadsBaseUrl();
    return { uri: base ? `${base}${relativePath}` : relativePath };
};

export const resolveProductImageSource = (rawValue: string | null | undefined): ImageSourcePropType | null => {
    return resolveStoreMediaSource(rawValue, {
        defaultUploadDir: 'products',
        allowKnownProductAliases: true,
    });
};

const PRODUCT_PLACEHOLDER: ImageSourcePropType = require('../../assets/ionora_logo.jpg');

/**
 * Like resolveProductImageSource but always returns a source — never null.
 * Falls back to the local placeholder image when rawValue is empty/null/undefined.
 */
export const getProductImageSource = (rawValue: string | null | undefined): ImageSourcePropType => {
    return resolveProductImageSource(rawValue) ?? PRODUCT_PLACEHOLDER;
};
