// Profile Service - User profile and addresses API
import api from './api';
import { Address } from '../models/types';

// User profile type from API
export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: string;
    referral_code?: string;
    referred_by?: number;
    created_at: string;
}

// Helper to map backend address to frontend Address type
const mapBackendAddress = (a: any): Address => ({
    id: String(a.id),
    label: a.label || undefined,
    line1: a.line1 || '',
    line2: a.line2 || undefined,
    city: a.city || '',
    state: a.state || '',
    postal_code: a.postal_code || '',
    country: a.country || 'India',
    is_default: !!a.is_default,
});

export const profileService = {
    // Get user profile
    async getProfile(): Promise<UserProfile | null> {
        try {
            const response = await api.get('/user/profile');
            const { data } = response.data;
            return data;
        } catch (error: any) {
            console.error('Error fetching profile:', error.message);
            return null;
        }
    },

    // Update user profile
    async updateProfile(updates: Partial<{ full_name: string; phone: string }>): Promise<UserProfile | null> {
        try {
            const response = await api.patch('/user/profile', updates);
            const { data } = response.data;
            return data;
        } catch (error: any) {
            console.error('Error updating profile:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    async deleteAccount(): Promise<boolean> {
        try {
            await api.delete('/user/profile');
            return true;
        } catch (error: any) {
            console.error('Error deleting account:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to delete account');
        }
    },

    // Get all addresses
    async getAddresses(): Promise<Address[]> {
        try {
            console.log('[profileService] getAddresses...');
            const response = await api.get('/user/addresses');
            console.log('[profileService] getAddresses response:', JSON.stringify(response.data));
            const { data } = response.data;
            const list = Array.isArray(data) ? data : (data?.addresses || []);
            return list.map(mapBackendAddress);
        } catch (error: any) {
            console.error('[profileService] getAddresses error:', error?.response?.status, error.message);
            return [];
        }
    },

    // Add new address
    async addAddress(address: Omit<Address, 'id'> & { latitude?: number; longitude?: number }): Promise<Address | null> {
        try {
            console.log('[profileService] addAddress payload:', JSON.stringify(address));
            const response = await api.post('/user/addresses', {
                label: address.label,
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                state: address.state,
                postal_code: address.postal_code,
                country: address.country || 'India',
                is_default: address.is_default,
                ...(address.latitude !== undefined ? { latitude: address.latitude } : {}),
                ...(address.longitude !== undefined ? { longitude: address.longitude } : {}),
            });
            console.log('[profileService] addAddress response:', JSON.stringify(response.data));
            const { data } = response.data;
            return mapBackendAddress(data);
        } catch (error: any) {
            console.error('[profileService] addAddress error:', error?.response?.status, JSON.stringify(error?.response?.data));
            // Re-throw with the full error so caller can inspect response data
            throw error;
        }
    },

    // Update address
    async updateAddress(id: string, updates: Partial<Address> & { latitude?: number; longitude?: number }): Promise<Address | null> {
        try {
            const payload: any = {};
            if (updates.label !== undefined) payload.label = updates.label;
            if (updates.line1 !== undefined) payload.line1 = updates.line1;
            if (updates.line2 !== undefined) payload.line2 = updates.line2;
            if (updates.city !== undefined) payload.city = updates.city;
            if (updates.state !== undefined) payload.state = updates.state;
            if (updates.postal_code !== undefined) payload.postal_code = updates.postal_code;
            if (updates.is_default !== undefined) payload.is_default = updates.is_default;
            if (updates.latitude !== undefined) payload.latitude = updates.latitude;
            if (updates.longitude !== undefined) payload.longitude = updates.longitude;

            const response = await api.patch(`/user/addresses/${id}`, payload);
            const { data } = response.data;
            return mapBackendAddress(data);
        } catch (error: any) {
            console.error('Error updating address:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to update address');
        }
    },

    // Delete address
    async deleteAddress(id: string): Promise<boolean> {
        try {
            console.log('[profileService] deleteAddress id:', id);
            await api.delete(`/user/addresses/${id}`);
            console.log('[profileService] deleteAddress success');
            return true;
        } catch (error: any) {
            console.error('[profileService] deleteAddress error:', error?.response?.status, error.message);
            throw error;
        }
    },

    // Set address as default
    async setDefaultAddress(id: string): Promise<Address[]> {
        try {
            const response = await api.patch(`/user/addresses/${id}/default`);
            const { data } = response.data;
            const list = Array.isArray(data) ? data : [];
            return list.map(mapBackendAddress);
        } catch (error: any) {
            console.error('Error setting default address:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to set default address');
        }
    },
};
