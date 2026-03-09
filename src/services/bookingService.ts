// Booking Service — API calls for service bookings
import api from './api';
import { Booking, BookingUpdate, Service, Address } from '../models/types';

// Map a backend booking row (with joined service + address) to the frontend Booking type
const mapBackendBooking = (b: any): Booking => {
    const service: Service = {
        id: String(b.service_id),
        name: b.service_name || 'Service',
        description: '',
        image: b.service_image || '',
        price: Number(b.price) || 0,
        duration: b.duration_minutes ? `${b.duration_minutes} mins` : '45-60 mins',
        category: b.service_category || 'water_purifier',
    };

    const address: Address = {
        id: String(b.address_id || ''),
        line1: b.address_line1 || '',
        city: b.address_city || '',
        state: b.address_state || '',
        postal_code: b.address_postal_code || '',
        is_default: false,
    };

    return {
        id: String(b.id),
        service,
        status: b.status,
        scheduledDate: b.scheduled_date,
        scheduledTime: b.scheduled_time,
        address,
        agent: b.agent_name
            ? {
                id: String(b.agent_id || ''),
                name: b.agent_name,
                phone: b.agent_phone || '',
                rating: 0,
                totalJobs: 0,
            }
            : undefined,
        totalAmount: Number(b.price) || 0,
        createdAt: b.created_at,
    };
};

export const bookingService = {
    /** Fetch bookings filtered by status (active | completed | cancelled) */
    async getBookings(status?: string): Promise<Booking[]> {
        try {
            const params = status ? { status } : {};
            const response = await api.get('/bookings', { params });
            const { data } = response.data;
            const list = Array.isArray(data) ? data : (data?.list || []);
            return list.map(mapBackendBooking);
        } catch (error: any) {
            console.error('Error fetching bookings:', error.message);
            return [];
        }
    },

    /** Create a new booking */
    async createBooking(payload: {
        service_id: number;
        address_id: number;
        scheduled_date: string;
        scheduled_time: string;
        notes?: string;
    }): Promise<Booking | null> {
        try {
            const response = await api.post('/bookings', payload);
            const { data } = response.data;
            return mapBackendBooking(data);
        } catch (error: any) {
            console.error('Error creating booking:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to create booking');
        }
    },

    /** Fetch a single booking by id */
    async getBookingById(id: number): Promise<Booking | null> {
        try {
            const response = await api.get(`/bookings/${id}`);
            const { data } = response.data;
            return mapBackendBooking(data);
        } catch (error: any) {
            console.error('Error fetching booking:', error.message);
            return null;
        }
    },

    /** Fetch timeline updates for a booking */
    async getBookingUpdates(bookingId: number): Promise<BookingUpdate[]> {
        try {
            const response = await api.get(`/bookings/${bookingId}/updates`);
            const { data } = response.data;
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            console.error('Error fetching booking updates:', error.message);
            return [];
        }
    },

    /** Cancel an existing booking */
    async cancelBooking(id: string): Promise<void> {
        try {
            await api.patch(`/bookings/${id}/cancel`);
        } catch (error: any) {
            console.error('Error cancelling booking:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to cancel booking');
        }
    },
};
