// Auth Service - Real API implementation
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { User, LoginCredentials, SignupData, UserRole } from '../models/types';
import { STORAGE_KEYS } from '../config/constants';
import { getApiErrorMessage } from '../utils/errorMessage';

// Storage helper functions
const storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};

const normalizeRole = (value: unknown): UserRole | null => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'customer' || normalized === 'agent' || normalized === 'dealer') {
        return normalized;
    }
    return null;
};

// Map backend user to frontend User type
const mapBackendUser = (backendUser: any, role?: UserRole): User => {
    const backendRole = normalizeRole(backendUser?.role);
    const fallbackRole = normalizeRole(role);

    return {
        id: String(backendUser?.id || ''),
        email: backendUser?.email || '',
        name: backendUser?.full_name || backendUser?.fullName || backendUser?.name || '',
        phone: backendUser?.phone || '',
        // Prefer backend role for routing correctness after login/restart.
        role: backendRole || fallbackRole || 'customer',
        referralCode: backendUser?.referral_code || backendUser?.referralCode,
        createdAt: backendUser?.created_at || backendUser?.createdAt || new Date().toISOString(),
    };
};

export const authService = {
    // Login with email and password
    async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken?: string }> {
        try {
            const response = await api.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                role: credentials.role,
            });

            const { data } = response.data;
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;

            // Validate role from backend /auth/me so role-based navigation is always authoritative.
            let user = mapBackendUser(data.user, credentials.role);
            try {
                const meResponse = await api.get('/auth/me', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                user = mapBackendUser(meResponse.data?.data?.user, user.role);
            } catch (meError: any) {
                console.warn('[Auth] /auth/me hydration after login failed, using login payload:', meError?.message);
            }

            // Store tokens and user in secure storage
            await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
            if (refreshToken) {
                await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            }
            await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            return { user, token: accessToken, refreshToken };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    // Signup new user
    async signup(data: SignupData): Promise<{ user: User; token: string; refreshToken?: string }> {
        try {
            const response = await api.post('/auth/signup', {
                full_name: data.name, // Map frontend 'name' to backend 'full_name'
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role,
            });

            const { data: responseData } = response.data;
            const user = mapBackendUser(responseData.user, data.role);
            const accessToken = responseData.accessToken;
            const refreshToken = responseData.refreshToken;

            // Store tokens and user in secure storage
            await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
            if (refreshToken) {
                await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            }
            await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            return { user, token: accessToken, refreshToken };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        try {
            const response = await api.post('/auth/forgot-password', { email: email.trim() });
            return { message: response?.data?.message || 'If this email exists, we sent reset instructions.' };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    // Logout
    async logout(): Promise<void> {
        try {
            const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
                // Call backend to revoke refresh token
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('[Auth] Logout API error (continuing with local cleanup):', error);
        } finally {
            // Always clear local storage
            await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
            await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
            await storage.deleteItem(STORAGE_KEYS.USER);
            console.log('[Auth] Logged out, tokens cleared');
        }
    },

    // Check if user is logged in and validate token
    async checkAuth(): Promise<{ user: User; token: string } | null> {
        try {
            const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const userJson = await storage.getItem(STORAGE_KEYS.USER);

            if (!token) {
                console.log('[Auth] No token found');
                return null;
            }

            console.log('[Auth] Token found, validating with /auth/me');

            // Validate token with backend
            const response = await api.get('/auth/me');
            const { data } = response.data;

            // Get stored user role (backend might not return it from /me)
            let storedUser: User | null = null;
            if (userJson) {
                try {
                    storedUser = JSON.parse(userJson);
                } catch (e) {
                    // Ignore parse error
                }
            }

            const user = mapBackendUser(data.user, storedUser?.role);

            // Update stored user with fresh data
            await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            console.log('[Auth] Token validated, user:', user.email);
            return { user, token };
        } catch (error: any) {
            console.error('[Auth] checkAuth error:', error.response?.data || error.message);
            // Token is invalid, clear storage
            await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
            await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
            await storage.deleteItem(STORAGE_KEYS.USER);
            return null;
        }
    },

    async requestOTP(phone: string): Promise<boolean> {
        try {
            await api.post('/auth/send-otp', { phone });
            return true;
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async verifyOTP(phone: string, otp: string, role: UserRole): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post('/auth/verify-otp', { phone, otp });
            const { data } = response.data;
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;

            const user = mapBackendUser(data.user, role);

            await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
            if (refreshToken) {
                await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            }
            await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            return { user, token: accessToken };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },
};
