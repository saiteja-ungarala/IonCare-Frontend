// Authentication store using Zustand

import { create } from 'zustand';
import { User, UserRole, LoginCredentials, SignupData, OtpChannel, OtpSessionPayload } from '../models/types';
import { authService } from '../services/authService';
import api from '../services/api';
import { FieldErrors, getApiErrorMessage } from '../utils/errorMessage';

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    selectedRole: UserRole | null;
    error: string | null;
    errorMessage: string | null;
    fieldErrors: FieldErrors;
    showLoginCelebration: boolean;
    showJoinBonusPopup: boolean;
}

interface AuthActions {
    setSelectedRole: (role: UserRole) => void;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    signup: (data: SignupData) => Promise<boolean>;
    startSignupVerification: (data: SignupData) => Promise<OtpSessionPayload | null>;
    verifySignupOtp: (
        sessionToken: string,
        channel: 'email',
        otp: string,
        role: UserRole,
    ) => Promise<{ completed: boolean; session?: OtpSessionPayload } | null>;
    resendSignupOtp: (
        sessionToken: string,
        channel: 'email',
    ) => Promise<OtpSessionPayload | null>;
    forgotPassword: (email: string) => Promise<boolean>;
    requestOTP: (phone: string) => Promise<boolean>;
    verifyOTP: (phone: string, otp: string, role: UserRole) => Promise<boolean>;
    startLoginOtp: (phone: string, role: UserRole) => Promise<OtpSessionPayload | null>;
    resendLoginOtp: (sessionToken: string, channel: OtpChannel) => Promise<OtpSessionPayload | null>;
    verifyLoginOtp: (sessionToken: string, channel: OtpChannel, otp: string, role: UserRole) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    clearFieldError: (field: string) => void;
    setShowLoginCelebration: (show: boolean) => void;
    setShowJoinBonusPopup: (show: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const shouldShowJoinBonusPopup = async (role: UserRole): Promise<boolean> => {
    if (role !== 'customer') {
        return false;
    }

    try {
        const response = await api.get('/join-bonus/status');
        const data = response?.data?.data ?? response?.data ?? {};
        return Boolean(data.bonusGiven) && !Boolean(data.popupShown);
    } catch (error) {
        console.warn('[Auth] Failed to fetch join bonus popup status:', error);
        return false;
    }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
    // Initial state
    user: null,
    token: null,
    refreshToken: null,
    isLoading: false,
    isAuthenticated: false,
    selectedRole: null,
    error: null,
    errorMessage: null,
    fieldErrors: {},
    showLoginCelebration: false,
    showJoinBonusPopup: false,

    // Actions
    setSelectedRole: (role: UserRole) => {
        set({ selectedRole: role });
    },

    login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {}, showJoinBonusPopup: false });
        try {
            const { user, token, refreshToken } = await authService.login(credentials);
            const showJoinBonusPopup = await shouldShowJoinBonusPopup(user.role);
            set({
                user,
                token,
                refreshToken: refreshToken || null,
                isAuthenticated: true,
                isLoading: false,
                selectedRole: user.role,
                error: null,
                errorMessage: null,
                fieldErrors: {},
                showJoinBonusPopup,
            });
            return true;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return false;
        }
    },

    signup: async (data: SignupData) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {}, showJoinBonusPopup: false });
        try {
            const { user, token, refreshToken } = await authService.signup(data);
            const showJoinBonusPopup = await shouldShowJoinBonusPopup(user.role);
            set({
                user,
                token,
                refreshToken: refreshToken || null,
                isAuthenticated: true,
                isLoading: false,
                selectedRole: user.role,
                error: null,
                errorMessage: null,
                fieldErrors: {},
                showJoinBonusPopup,
            });
            return true;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return false;
        }
    },

    startSignupVerification: async (data: SignupData) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const session = await authService.startSignupVerification(data);
            set({
                isLoading: false,
                error: null,
                errorMessage: null,
                fieldErrors: {},
            });
            return session;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return null;
        }
    },

    verifySignupOtp: async (sessionToken, channel, otp, role) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {}, showJoinBonusPopup: false });
        try {
            const result = await authService.verifySignupOtp(sessionToken, channel, otp, role);

            if (!result.completed) {
                set({
                    isLoading: false,
                    error: null,
                    errorMessage: null,
                    fieldErrors: {},
                });
                return {
                    completed: false,
                    session: result.session,
                };
            }

            const showJoinBonusPopup = await shouldShowJoinBonusPopup(result.user.role);
            set({
                user: result.user,
                token: result.token,
                refreshToken: result.refreshToken || null,
                isAuthenticated: true,
                isLoading: false,
                selectedRole: result.user.role,
                error: null,
                errorMessage: null,
                fieldErrors: {},
                showJoinBonusPopup,
            });

            return { completed: true };
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return null;
        }
    },

    resendSignupOtp: async (sessionToken, channel) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const session = await authService.resendSignupOtp(sessionToken, channel);
            set({
                isLoading: false,
                error: null,
                errorMessage: null,
                fieldErrors: {},
            });
            return session;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return null;
        }
    },

    forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            await authService.forgotPassword(email);
            set({ isLoading: false });
            return true;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return false;
        }
    },

    requestOTP: async (phone: string) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            await authService.requestOTP(phone);
            set({ isLoading: false });
            return true;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return false;
        }
    },

    startLoginOtp: async (phone: string, role: UserRole) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const session = await authService.startLoginOtp(phone, role);
            set({
                isLoading: false,
                error: null,
                errorMessage: null,
                fieldErrors: {},
            });
            return session;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return null;
        }
    },

    resendLoginOtp: async (sessionToken: string, channel: OtpChannel) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const session = await authService.resendLoginOtp(sessionToken, channel);
            set({
                isLoading: false,
                error: null,
                errorMessage: null,
                fieldErrors: {},
            });
            return session;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return null;
        }
    },

    verifyOTP: async (phone: string, otp: string, role: UserRole) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {}, showJoinBonusPopup: false });
        try {
            const { user, token } = await authService.verifyOTP(phone, otp, role);
            const showJoinBonusPopup = await shouldShowJoinBonusPopup(user.role);
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                selectedRole: user.role,
                error: null,
                errorMessage: null,
                fieldErrors: {},
                showJoinBonusPopup,
            });
            return true;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return false;
        }
    },

    verifyLoginOtp: async (sessionToken: string, channel: OtpChannel, otp: string, role: UserRole) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {}, showJoinBonusPopup: false });
        try {
            const { user, token, refreshToken } = await authService.verifyLoginOtp(sessionToken, channel, otp, role);
            const showJoinBonusPopup = await shouldShowJoinBonusPopup(user.role);
            set({
                user,
                token,
                refreshToken: refreshToken || null,
                isAuthenticated: true,
                isLoading: false,
                selectedRole: user.role,
                error: null,
                errorMessage: null,
                fieldErrors: {},
                showJoinBonusPopup,
            });
            return true;
        } catch (error: unknown) {
            const normalized = getApiErrorMessage(error);
            set({
                isLoading: false,
                error: normalized.message,
                errorMessage: normalized.message,
                fieldErrors: normalized.fieldErrors || {},
            });
            return false;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await authService.logout();
        } finally {
            set({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                selectedRole: null,
                error: null,
                errorMessage: null,
                fieldErrors: {},
                showLoginCelebration: false,
                showJoinBonusPopup: false,
            });
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const auth = await authService.checkAuth();
            if (auth) {
                set({
                    user: auth.user,
                    token: auth.token,
                    isAuthenticated: true,
                    selectedRole: auth.user.role,
                    showJoinBonusPopup: false,
                });
            } else {
                // Token was invalid/expired — ensure clean unauthenticated state
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    selectedRole: null,
                    showJoinBonusPopup: false,
                });
            }
        } catch (error) {
            console.warn('[Auth] checkAuth failed:', error);
            set({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                selectedRole: null,
                showJoinBonusPopup: false,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => {
        set({ error: null, errorMessage: null, fieldErrors: {} });
    },

    clearFieldError: (field: string) => {
        set((state) => {
            if (!state.fieldErrors[field]) {
                return {};
            }
            const nextFieldErrors = { ...state.fieldErrors };
            delete nextFieldErrors[field];
            return {
                fieldErrors: nextFieldErrors,
            };
        });
    },

    setShowLoginCelebration: (show: boolean) => {
        set({ showLoginCelebration: show });
    },

    setShowJoinBonusPopup: (show: boolean) => {
        set({ showJoinBonusPopup: show });
    },
}));
