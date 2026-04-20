import { ImageSourcePropType } from 'react-native';
import { IMAGE_BASE_URL } from '../config/constants';

const isAbsoluteUrl = (value: string): boolean => {
    return /^https?:\/\//i.test(value) || value.startsWith('data:');
};

const stripQueryAndHash = (value: string): string => {
    return value.split('?')[0].split('#')[0].trim();
};

const normalizeSlashes = (value: string): string => {
    return value.replace(/\\/g, '/');
};

const normalizeRelativePath = (value: string): string => {
    let normalized = normalizeSlashes(stripQueryAndHash(value));
    normalized = normalized.replace(/^\/+/, '');
    normalized = normalized.replace(/^uploads\/+/i, '');
    normalized = normalized.replace(/^assets\/images\/+/i, '');
    return normalized;
};

const NUMERIC_DOTTED_FILE_REGEX = /^\d+(?:\.\d+)+\.(?:webp|avif|png|jpe?g)$/i;

const isNumericDottedFileName = (value: string): boolean => {
    return NUMERIC_DOTTED_FILE_REGEX.test(String(value || '').trim());
};

const joinWithImageBaseUrl = (value: string): string => {
    const relativePath = normalizeRelativePath(value);
    if (!relativePath) {
        return IMAGE_BASE_URL;
    }
    return `${IMAGE_BASE_URL}/${relativePath}`;
};

const FILE_NAME_TO_UPLOAD_PATH: Record<string, string> = {
    'watercans.jpg': 'products/watercans.jpg',
    'watercans.jpeg': 'products/watercans.jpg',
    'waterdispenser.avif': 'products/waterdispenser.avif',
    'rofilterset.avif': 'products/rofilterset.avif',
};

const STEM_TO_UPLOAD_PATH: Record<string, string> = {
    watercan: 'products/watercans.jpg',
    watercans: 'products/watercans.jpg',
    waterdispenser: 'products/waterdispenser.avif',
    rofilterset: 'products/rofilterset.avif',
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const API_UPLOAD_HOSTS = new Set(['care-api.lifeionizersindia.com']);
const UPLOAD_PATH_PREFIX_REGEX = /^\/?(uploads|assets\/images)\//i;

const normalizeStem = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

interface StoreMediaResolveOptions {
    defaultUploadDir?: string;
    allowKnownProductAliases?: boolean;
}

const unique = (values: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    values.forEach((entry) => {
        const normalized = String(entry || '').trim();
        if (!normalized) return;
        if (seen.has(normalized)) return;
        seen.add(normalized);
        result.push(normalized);
    });

    return result;
};

const buildRelativePathCandidates = (
    rawPath: string,
    options?: StoreMediaResolveOptions,
): string[] => {
    const defaultUploadDir = String(options?.defaultUploadDir || 'products').trim() || 'products';
    const allowKnownProductAliases = options?.allowKnownProductAliases !== false;
    const normalizedPath = normalizeRelativePath(rawPath);
    if (!normalizedPath) return [];

    const fileName = normalizedPath.split('/').pop()?.toLowerCase() || '';
    const mappedPath = allowKnownProductAliases ? FILE_NAME_TO_UPLOAD_PATH[fileName] : undefined;
    const stem = normalizeStem(fileName.replace(/\.[^.]+$/, ''));
    const stemMappedPath = allowKnownProductAliases ? STEM_TO_UPLOAD_PATH[stem] : undefined;
    const hasDirectory = normalizedPath.includes('/');

    const candidates: string[] = [];

    if (mappedPath) candidates.push(mappedPath);
    if (stemMappedPath) candidates.push(stemMappedPath);

    if (hasDirectory) {
        candidates.push(normalizedPath);
    } else {
        candidates.push(`${defaultUploadDir}/${normalizedPath}`);
        candidates.push(normalizedPath);
    }

    if (!hasDirectory && isNumericDottedFileName(normalizedPath)) {
        candidates.unshift(normalizedPath);
        candidates.push(`products/${normalizedPath}`);
    }

    if (normalizedPath.toLowerCase().startsWith('products/')) {
        const maybeFileName = normalizedPath.slice('products/'.length);
        if (isNumericDottedFileName(maybeFileName)) {
            candidates.push(maybeFileName);
        }
    }

    return unique(candidates.map(normalizeRelativePath));
};

const buildAbsoluteUriCandidates = (
    absoluteUrl: string,
    options?: StoreMediaResolveOptions,
): string[] => {
    try {
        const inputUrl = new URL(absoluteUrl);
        const hostname = inputUrl.hostname.toLowerCase();
        const pathname = normalizeSlashes(inputUrl.pathname || '');
        const isKnownUploadHost = API_UPLOAD_HOSTS.has(hostname);
        const isLocalHost = LOCAL_HOSTS.has(hostname);
        const isUploadLikePath = UPLOAD_PATH_PREFIX_REGEX.test(pathname);
        const shouldRewrite = isKnownUploadHost || isLocalHost || isUploadLikePath;

        if (!shouldRewrite) {
            return [absoluteUrl];
        }

        const rewrittenUris = buildRelativePathCandidates(pathname, options).map((relativePath) => {
            const baseUri = joinWithImageBaseUrl(relativePath);
            return `${baseUri}${inputUrl.search}${inputUrl.hash}`;
        });

        return unique([...rewrittenUris, absoluteUrl]);
    } catch {
        return [absoluteUrl];
    }
};

const toSources = (uris: string[]): ImageSourcePropType[] => {
    return uris.map((uri) => ({ uri }));
};

export const resolveStoreMediaSources = (
    rawValue: string | null | undefined,
    options?: StoreMediaResolveOptions,
): ImageSourcePropType[] => {
    const value = String(rawValue || '').trim();
    if (!value) return [];

    if (isAbsoluteUrl(value)) {
        if (value.startsWith('data:')) {
            return [{ uri: value }];
        }
        return toSources(buildAbsoluteUriCandidates(value, options));
    }

    const relativeCandidates = buildRelativePathCandidates(value, options);
    return toSources(relativeCandidates.map(joinWithImageBaseUrl));
};

export const resolveStoreMediaSource = (
    rawValue: string | null | undefined,
    options?: StoreMediaResolveOptions,
): ImageSourcePropType | null => {
    return resolveStoreMediaSources(rawValue, options)[0] ?? null;
};

export const resolveProductImageSource = (rawValue: string | null | undefined): ImageSourcePropType | null => {
    return resolveStoreMediaSource(rawValue, {
        defaultUploadDir: 'products',
        allowKnownProductAliases: true,
    });
};

export const resolveProductImageSources = (rawValue: string | null | undefined): ImageSourcePropType[] => {
    return resolveStoreMediaSources(rawValue, {
        defaultUploadDir: 'products',
        allowKnownProductAliases: true,
    });
};

const PRODUCT_PLACEHOLDER: ImageSourcePropType = require('../../assets/ionora_logo.jpg');

/**
 * Like resolveProductImageSource but always returns a source, never null.
 * Falls back to the local placeholder image when rawValue is empty/null/undefined.
 */
export const getProductImageSource = (rawValue: string | null | undefined): ImageSourcePropType => {
    return resolveProductImageSource(rawValue) ?? PRODUCT_PLACEHOLDER;
};
