// Authentication store using Zustand

import { create } from 'zustand';
import { User, UserRole, LoginCredentials, SignupData } from '../models/types';
import { authService } from '../services/authService';
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
}

interface AuthActions {
    setSelectedRole: (role: UserRole) => void;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    signup: (data: SignupData) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<boolean>;
    requestOTP: (phone: string) => Promise<boolean>;
    verifyOTP: (phone: string, otp: string, role: UserRole) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    clearFieldError: (field: string) => void;
    setShowLoginCelebration: (show: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

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

    // Actions
    setSelectedRole: (role: UserRole) => {
        set({ selectedRole: role });
    },

    login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const { user, token, refreshToken } = await authService.login(credentials);
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
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const { user, token, refreshToken } = await authService.signup(data);
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

    verifyOTP: async (phone: string, otp: string, role: UserRole) => {
        set({ isLoading: true, error: null, errorMessage: null, fieldErrors: {} });
        try {
            const { user, token } = await authService.verifyOTP(phone, otp, role);
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                selectedRole: user.role,
                error: null,
                errorMessage: null,
                fieldErrors: {},
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
                });
            } else {
                // Token was invalid/expired — ensure clean unauthenticated state
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    selectedRole: null,
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
}));
