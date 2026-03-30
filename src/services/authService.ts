// Auth Service - Real API implementation
import api, { setTokenRefreshHandler } from './api';
import {
    User,
    LoginCredentials,
    SignupData,
    UserRole,
    OtpChannel,
    OtpSessionPayload,
} from '../models/types';
import { STORAGE_KEYS } from '../config/constants';
import { getApiErrorMessage } from '../utils/errorMessage';
import { authStorage } from './authStorage';

const storage = authStorage;

const normalizeRole = (value: unknown): UserRole | null => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'customer' || normalized === 'technician' || normalized === 'dealer') {
        return normalized;
    }
    return null;
};

interface PersistedAuthResult {
    user: User;
    token: string;
    refreshToken?: string;
}

interface PendingOtpVerificationResult {
    completed: false;
    session: OtpSessionPayload;
}

interface CompletedOtpVerificationResult extends PersistedAuthResult {
    completed: true;
}

type SignupOtpVerificationResult = PendingOtpVerificationResult | CompletedOtpVerificationResult;

const extractResponseData = (response: any) => response?.data?.data ?? response?.data;



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

const persistAuthSession = async (
    data: { user: any; accessToken: string; refreshToken?: string },
    role?: UserRole,
): Promise<PersistedAuthResult> => {
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;

    let user = mapBackendUser(data.user, role);

    try {
        const meResponse = await api.get('/auth/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        user = mapBackendUser(extractResponseData(meResponse)?.user, user.role);
    } catch (meError: any) {
        console.warn('[Auth] /auth/me hydration after auth flow failed, using current payload:', meError?.message);
    }

    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    if (refreshToken) {
        await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user, token: accessToken, refreshToken };
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

            return await persistAuthSession(extractResponseData(response), credentials.role);
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

            return await persistAuthSession(extractResponseData(response), data.role);
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async startSignupVerification(data: SignupData): Promise<OtpSessionPayload> {
        try {
            const response = await api.post('/auth/signup/initiate', {
                full_name: data.name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role,
            });

            return extractResponseData(response) as OtpSessionPayload;
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async verifySignupOtp(
        sessionToken: string,
        channel: Extract<OtpChannel, 'email' | 'sms'>,
        otp: string,
        role: UserRole,
    ): Promise<SignupOtpVerificationResult> {
        try {
            const response = await api.post('/auth/signup/verify-otp', {
                sessionToken,
                channel,
                otp,
            });

            const responseData = extractResponseData(response);

            if (!responseData?.completed) {
                return {
                    completed: false,
                    session: responseData?.session as OtpSessionPayload,
                };
            }

            const persisted = await persistAuthSession(responseData, role);
            return { completed: true, ...persisted };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async verifySignupFirebaseSms(
        sessionToken: string,
        firebaseIdToken: string,
        role: UserRole,
    ): Promise<SignupOtpVerificationResult> {
        try {
            const response = await api.post('/auth/signup/verify-firebase-sms', {
                sessionToken,
                firebaseIdToken,
            });

            const responseData = extractResponseData(response);

            if (!responseData?.completed) {
                return {
                    completed: false,
                    session: responseData?.session as OtpSessionPayload,
                };
            }

            const persisted = await persistAuthSession(responseData, role);
            return { completed: true, ...persisted };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async resendSignupOtp(
        sessionToken: string,
        channel: Extract<OtpChannel, 'email' | 'sms'>,
    ): Promise<OtpSessionPayload> {
        try {
            const response = await api.post('/auth/signup/resend-otp', {
                sessionToken,
                channel,
            });

            return extractResponseData(response) as OtpSessionPayload;
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
            // Expected when token is expired/invalid — not a real error
            console.warn('[Auth] checkAuth: token invalid or expired, clearing session.');
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

    async startLoginOtp(phone: string, role: UserRole): Promise<OtpSessionPayload> {
        try {
            const response = await api.post('/auth/login/send-otp', { phone, role });
            return extractResponseData(response) as OtpSessionPayload;
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async resendLoginOtp(sessionToken: string, channel: OtpChannel): Promise<OtpSessionPayload> {
        try {
            const response = await api.post('/auth/login/resend-otp', { sessionToken, channel });
            return extractResponseData(response) as OtpSessionPayload;
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async verifyOTP(phone: string, otp: string, role: UserRole): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post('/auth/verify-otp', { phone, otp });
            const persisted = await persistAuthSession(extractResponseData(response), role);
            return { user: persisted.user, token: persisted.token };
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    async verifyLoginOtp(
        sessionToken: string,
        channel: OtpChannel,
        otp: string,
        role: UserRole,
    ): Promise<PersistedAuthResult> {
        try {
            const response = await api.post('/auth/login/verify-otp', {
                sessionToken,
                channel,
                otp,
            });

            return await persistAuthSession(extractResponseData(response), role);
        } catch (error: unknown) {
            throw getApiErrorMessage(error);
        }
    },

    // Refresh access token using refresh token
    async refreshToken(): Promise<string | null> {
        try {
            const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) return null;

            console.log('[Auth] Refreshing token...');
            const response = await api.post('/auth/refresh', { refreshToken });
            const { data } = response.data;
            
            const newAccessToken = data.accessToken;
            const newRefreshToken = data.refreshToken;

            if (newAccessToken) {
                await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, newAccessToken);
                if (newRefreshToken) {
                    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                }
                console.log('[Auth] Token refreshed successfully');
                return newAccessToken;
            }
            return null;
        } catch (error) {
            console.error('[Auth] Token refresh failed:', error);
            // Don't clear storage here, the api interceptor will handle it if retry fails
            return null;
        }
    },
};

setTokenRefreshHandler(() => authService.refreshToken());
