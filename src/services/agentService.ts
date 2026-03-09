import api from './api';
import {
    AgentJob,
    AgentJobsMeta,
    AgentKycDocType,
    AgentMePayload,
} from '../models/types';

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data: T;
};

type AgentJobsPayload = {
    jobs: AgentJob[];
    meta?: AgentJobsMeta;
};

const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const mapAgentJob = (job: any): AgentJob => ({
    id: String(job.id),
    user_id: Number(job.user_id || 0),
    service_id: Number(job.service_id || 0),
    address_id: toNumber(job.address_id),
    scheduled_date: job.scheduled_date || '',
    scheduled_time: job.scheduled_time || '',
    status: (job.status || 'pending') as AgentJob['status'],
    price: Number(job.price || 0),
    notes: job.notes || null,
    created_at: job.created_at || '',
    service_name: job.service_name || 'Service',
    service_image: job.service_image || null,
    service_category: job.service_category || null,
    duration_minutes: toNumber(job.duration_minutes),
    address_line1: job.address_line1 || null,
    address_line2: job.address_line2 || null,
    address_city: job.address_city || null,
    address_state: job.address_state || null,
    address_postal_code: job.address_postal_code || null,
    address_latitude: toNumber(job.address_latitude),
    address_longitude: toNumber(job.address_longitude),
    customer_name: job.customer_name || null,
    customer_phone: job.customer_phone || null,
    distance_km: toNumber(job.distance_km),
});

const getApiErrorMessage = (error: any, fallback: string): string => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
    );
};

export const agentService = {
    async getMe(): Promise<AgentMePayload> {
        const response = await api.get<ApiSuccess<AgentMePayload>>('/agent/me');
        return response.data.data;
    },

    async submitKyc(formData: FormData): Promise<{ uploaded: number; verification_status: string }> {
        const response = await api.post<ApiSuccess<{ uploaded: number; verification_status: string }>>('/agent/kyc', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    async updateLocation(lat: number, lng: number): Promise<void> {
        await api.patch('/agent/location', { lat, lng });
    },

    async setOnline(isOnline: boolean): Promise<{ is_online: boolean }> {
        const response = await api.patch<ApiSuccess<{ is_online: boolean }>>('/agent/online', {
            is_online: isOnline,
        });
        return response.data.data;
    },

    async getAvailableJobs(): Promise<AgentJobsPayload> {
        const response = await api.get<ApiSuccess<AgentJobsPayload>>('/agent/jobs/available');
        const payload = response.data.data;
        return {
            jobs: Array.isArray(payload.jobs) ? payload.jobs.map(mapAgentJob) : [],
            meta: payload.meta,
        };
    },

    async acceptJob(bookingId: string): Promise<void> {
        await api.post(`/agent/jobs/${bookingId}/accept`);
    },

    async rejectJob(bookingId: string): Promise<void> {
        await api.post(`/agent/jobs/${bookingId}/reject`);
    },

    async updateJobStatus(bookingId: string, status: 'in_progress' | 'completed'): Promise<void> {
        await api.patch(`/agent/jobs/${bookingId}/status`, { status });
    },

    async postJobUpdate(bookingId: number, payload: {
        update_type: string;
        note?: string;
        media_url?: string;
    }): Promise<void> {
        await api.post(`/agent/jobs/${bookingId}/updates`, payload);
    },

    getApiErrorMessage,
    getSupportedDocTypes(): AgentKycDocType[] {
        return ['aadhaar', 'pan', 'driving_license', 'selfie', 'other'];
    },
};