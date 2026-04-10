import { create } from 'zustand';
import { Alert } from 'react-native';
import {
    JobUpdate,
    TechnicianJob,
    TechnicianJobsMeta,
    TechnicianKycDocument,
    TechnicianMePayload,
    TechnicianProfile,
} from '../models/types';
import { technicianService } from '../services/technicianService';
import { getCurrentLocation } from '../utils/location';

// ── Location polling (module-level, survives re-renders) ─────────────────────
let _locationInterval: ReturnType<typeof setInterval> | null = null;

function startLocationPolling() {
    if (_locationInterval !== null) return;
    _locationInterval = setInterval(async () => {
        try {
            const pos = await getCurrentLocation();
            if (pos) await technicianService.updateLocation(pos.latitude, pos.longitude);
        } catch { /* silent — don't interrupt the UI */ }
    }, 60_000); // every 60 s
}

function stopLocationPolling() {
    if (_locationInterval !== null) {
        clearInterval(_locationInterval);
        _locationInterval = null;
    }
}

interface TechnicianLoadingState {
    me: boolean;
    jobs: boolean;
    kyc: boolean;
    online: boolean;
    action: boolean;
}

interface TechnicianState {
    me: TechnicianProfile | null;
    kycStatus: string | null;
    latestKycDocument: TechnicianKycDocument | null;
    isOnline: boolean;
    jobs: TechnicianJob[];
    jobsMeta: TechnicianJobsMeta | null;
    jobUpdates: Record<string, JobUpdate[]>;
    actionBookingId: string | null;
    loading: TechnicianLoadingState;
    error: string | null;
}

interface TechnicianActions {
    fetchMe: () => Promise<TechnicianMePayload | null>;
    uploadKyc: (formData: FormData) => Promise<boolean>;
    toggleOnline: (isOnline: boolean) => Promise<boolean>;
    fetchJobs: () => Promise<void>;
    fetchJobUpdates: (bookingId: string) => Promise<void>;
    postArrived: (bookingId: string) => Promise<boolean>;
    accept: (bookingId: string) => Promise<boolean>;
    reject: (bookingId: string) => Promise<boolean>;
    updateStatus: (bookingId: string, status: 'in_progress' | 'completed') => Promise<boolean>;
    acceptJob: (bookingId: string) => Promise<boolean>;
    rejectJob: (bookingId: string) => Promise<boolean>;
    updateJobStatus: (bookingId: string, status: 'in_progress' | 'completed') => Promise<boolean>;
    clearError: () => void;
    reset: () => void;
}

type TechnicianStore = TechnicianState & TechnicianActions;

const initialLoadingState: TechnicianLoadingState = {
    me: false,
    jobs: false,
    kyc: false,
    online: false,
    action: false,
};

const extractErrorMessage = (error: any, fallback: string): string => {
    return technicianService.getApiErrorMessage(error, fallback);
};

const sortJobs = (jobs: TechnicianJob[]): TechnicianJob[] =>
    [...jobs].sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return bDate - aDate;
    });

export const useTechnicianStore = create<TechnicianStore>((set, get) => ({
    me: null,
    kycStatus: null,
    latestKycDocument: null,
    isOnline: false,
    jobs: [],
    jobsMeta: null,
    jobUpdates: {},
    actionBookingId: null,
    loading: initialLoadingState,
    error: null,

    fetchMe: async () => {
        set((state) => ({
            loading: { ...state.loading, me: true },
            error: null,
        }));

        try {
            const payload = await technicianService.getMe();
            set((state) => ({
                me: payload.profile,
                kycStatus: payload.profile.verification_status,
                latestKycDocument: payload.kyc.latest_document,
                isOnline: !!payload.profile.is_online,
                loading: { ...state.loading, me: false },
            }));
            // Sync location polling with server-side online state
            if (payload.profile.is_online) startLocationPolling();
            else stopLocationPolling();
            return payload;
        } catch (error: any) {
            set((state) => ({
                loading: { ...state.loading, me: false },
                error: extractErrorMessage(error, 'Failed to load technician profile.'),
            }));
            return null;
        }
    },

    uploadKyc: async (formData: FormData) => {
        set((state) => ({
            loading: { ...state.loading, kyc: true },
            error: null,
        }));

        try {
            await technicianService.submitKyc(formData);
            set((state) => ({
                loading: { ...state.loading, kyc: false },
                kycStatus: 'pending',
            }));
            await get().fetchMe();
            return true;
        } catch (error: any) {
            set((state) => ({
                loading: { ...state.loading, kyc: false },
                error: extractErrorMessage(error, 'Failed to upload KYC documents.'),
            }));
            return false;
        }
    },

    toggleOnline: async (isOnline: boolean) => {
        set((state) => ({
            loading: { ...state.loading, online: true },
            error: null,
        }));

        // When going online, get location first and patch it before going online
        if (isOnline) {
            const position = await getCurrentLocation();
            if (!position) {
                set((state) => ({
                    loading: { ...state.loading, online: false },
                }));
                Alert.alert('Location Required', 'Location required to go online. Please enable location in phone settings.');
                return false;
            }
            try {
                await technicianService.updateLocation(position.latitude, position.longitude);
            } catch {
                // location patch failed — proceed anyway, backend will gate if needed
            }
        }

        try {
            await technicianService.setOnline(isOnline);
            set((state) => ({
                isOnline,
                me: state.me ? { ...state.me, is_online: isOnline } : state.me,
                loading: { ...state.loading, online: false },
            }));
            if (isOnline) startLocationPolling();
            else stopLocationPolling();
            return true;
        } catch (error: any) {
            const code = (error as any)?.response?.data?.code;
            if (code === 'LOCATION_REQUIRED') {
                Alert.alert('Location Required', 'Please enable location in phone settings.');
            }
            set((state) => ({
                loading: { ...state.loading, online: false },
                error: extractErrorMessage(error, 'Failed to update online status.'),
            }));
            return false;
        }
    },

    fetchJobs: async () => {
        set((state) => ({
            loading: { ...state.loading, jobs: true },
            error: null,
        }));

        try {
            const payload = await technicianService.getAvailableJobs();
            set((state) => ({
                jobs: sortJobs(payload.jobs),
                jobsMeta: payload.meta || null,
                actionBookingId: null,
                loading: { ...state.loading, jobs: false },
            }));
        } catch (error: any) {
            set((state) => ({
                loading: { ...state.loading, jobs: false },
                error: extractErrorMessage(error, 'Failed to load available jobs.'),
            }));
        }
    },

    fetchJobUpdates: async (bookingId: string) => {
        try {
            const updates = await technicianService.getJobUpdates(bookingId);
            set((state) => ({
                jobUpdates: { ...state.jobUpdates, [bookingId]: updates },
            }));
        } catch { /* silent — timeline is non-critical */ }
    },

    postArrived: async (bookingId: string) => {
        set((state) => ({ loading: { ...state.loading, action: true }, error: null }));
        try {
            await technicianService.postJobUpdate(Number(bookingId), { update_type: 'arrived' });
            set((state) => ({ loading: { ...state.loading, action: false } }));
            // Refresh updates so timeline updates immediately
            const updates = await technicianService.getJobUpdates(bookingId);
            set((state) => ({
                jobUpdates: { ...state.jobUpdates, [bookingId]: updates },
            }));
            return true;
        } catch (error: any) {
            set((state) => ({
                loading: { ...state.loading, action: false },
                error: extractErrorMessage(error, 'Failed to post arrival.'),
            }));
            return false;
        }
    },

    acceptJob: async (bookingId: string) => {
        const snapshot = get();
        if (!snapshot.isOnline) {
            set({ error: 'Go online to accept jobs.' });
            return false;
        }
        if (snapshot.jobs.some((job) => job.id !== bookingId && (job.status === 'assigned' || job.status === 'in_progress'))) {
            set({ error: 'Complete your current active job before accepting a new one.' });
            return false;
        }

        set((state) => ({
            loading: { ...state.loading, action: true },
            actionBookingId: bookingId,
            error: null,
        }));

        try {
            await technicianService.acceptJob(bookingId);
            set((state) => ({
                jobs: sortJobs(
                    state.jobs.map((job) =>
                        job.id === bookingId
                            ? { ...job, status: 'assigned' }
                            : job
                    )
                ),
                actionBookingId: null,
                loading: { ...state.loading, action: false },
            }));

            // Keep local UI snappy, then sync with server-authoritative job lists.
            const payload = await technicianService.getAvailableJobs();
            set((state) => ({
                jobs: sortJobs(payload.jobs),
                jobsMeta: payload.meta || null,
                actionBookingId: null,
                loading: { ...state.loading, action: false },
            }));
            return true;
        } catch (error: any) {
            set((state) => ({
                actionBookingId: null,
                loading: { ...state.loading, action: false },
                error: extractErrorMessage(error, 'Failed to accept job.'),
            }));
            return false;
        }
    },

    rejectJob: async (bookingId: string) => {
        set((state) => ({
            loading: { ...state.loading, action: true },
            actionBookingId: bookingId,
            error: null,
        }));

        try {
            await technicianService.rejectJob(bookingId);
            const payload = await technicianService.getAvailableJobs();
            set((state) => ({
                jobs: sortJobs(payload.jobs),
                jobsMeta: payload.meta || null,
                actionBookingId: null,
                loading: { ...state.loading, action: false },
            }));
            return true;
        } catch (error: any) {
            set((state) => ({
                actionBookingId: null,
                loading: { ...state.loading, action: false },
                error: extractErrorMessage(error, 'Failed to reject job.'),
            }));
            return false;
        }
    },

    updateJobStatus: async (bookingId: string, status: 'in_progress' | 'completed') => {
        set((state) => ({
            loading: { ...state.loading, action: true },
            actionBookingId: bookingId,
            error: null,
        }));

        try {
            await technicianService.updateJobStatus(bookingId, status);
            const payload = await technicianService.getAvailableJobs();
            set((state) => ({
                jobs: sortJobs(payload.jobs),
                jobsMeta: payload.meta || null,
                actionBookingId: null,
                loading: { ...state.loading, action: false },
            }));
            return true;
        } catch (error: any) {
            set((state) => ({
                actionBookingId: null,
                loading: { ...state.loading, action: false },
                error: extractErrorMessage(error, 'Failed to update job status.'),
            }));
            return false;
        }
    },

    clearError: () => set({ error: null }),

    accept: async (bookingId: string) => get().acceptJob(bookingId),
    reject: async (bookingId: string) => get().rejectJob(bookingId),
    updateStatus: async (bookingId: string, status: 'in_progress' | 'completed') => get().updateJobStatus(bookingId, status),

    reset: () => {
        stopLocationPolling();
        set({
            me: null,
            kycStatus: null,
            latestKycDocument: null,
            isOnline: false,
            jobs: [],
            jobsMeta: null,
            jobUpdates: {},
            actionBookingId: null,
            loading: initialLoadingState,
            error: null,
        });
    },
}));
