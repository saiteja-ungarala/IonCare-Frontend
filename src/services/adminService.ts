import api from './api';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = async (params?: Record<string, any>) => {
    const response = await api.get('/admin/products', { params });
    return response.data.data;
};

export const createProduct = async (data: Record<string, any>) => {
    const response = await api.post('/admin/products', data);
    return response.data.data;
};

export const updateProduct = async (id: number, data: Record<string, any>) => {
    const response = await api.patch(`/admin/products/${id}`, data);
    return response.data.data;
};

export const toggleProduct = async (id: number) => {
    const response = await api.patch(`/admin/products/${id}/toggle`);
    return response.data.data;
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const getAdminCategories = async () => {
    const response = await api.get('/admin/categories');
    return response.data.data;
};

export const createCategory = async (data: Record<string, any>) => {
    const response = await api.post('/admin/categories', data);
    return response.data.data;
};

export const updateCategory = async (id: number, data: Record<string, any>) => {
    const response = await api.patch(`/admin/categories/${id}`, data);
    return response.data.data;
};

export const toggleCategory = async (id: number) => {
    const response = await api.patch(`/admin/categories/${id}/toggle`);
    return response.data.data;
};

// ─── Brands ───────────────────────────────────────────────────────────────────

export const getAdminBrands = async () => {
    const response = await api.get('/admin/brands');
    return response.data.data;
};

export const createBrand = async (data: Record<string, any>) => {
    const response = await api.post('/admin/brands', data);
    return response.data.data;
};

export const updateBrand = async (id: number, data: Record<string, any>) => {
    const response = await api.patch(`/admin/brands/${id}`, data);
    return response.data.data;
};

export const toggleBrand = async (id: number) => {
    const response = await api.patch(`/admin/brands/${id}/toggle`);
    return response.data.data;
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const getAdminServices = async () => {
    const response = await api.get('/admin/services');
    return response.data.data;
};

export const createService = async (data: Record<string, any>) => {
    const response = await api.post('/admin/services', data);
    return response.data.data;
};

export const updateService = async (id: number, data: Record<string, any>) => {
    const response = await api.patch(`/admin/services/${id}`, data);
    return response.data.data;
};

export const toggleService = async (id: number) => {
    const response = await api.patch(`/admin/services/${id}/toggle`);
    return response.data.data;
};

// ─── Banners ───────────────────────────────────────────────────────────────────

export const getBanners = async () => {
    const response = await api.get('/admin/banners');
    return response.data.data;
};

export const createBanner = async (data: Record<string, any>) => {
    const response = await api.post('/admin/banners', data);
    return response.data.data;
};

export const updateBanner = async (id: number, data: Record<string, any>) => {
    const response = await api.patch(`/admin/banners/${id}`, data);
    return response.data.data;
};

export const reorderBanners = async (order: number[]) => {
    const response = await api.patch('/admin/banners/reorder', { order });
    return response.data.data;
};

export const deleteBanner = async (id: number) => {
    const response = await api.delete(`/admin/banners/${id}`);
    return response.data.data;
};

export const uploadBannerImage = async (formData: FormData) => {
    const response = await api.post('/admin/banners/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data; // { image_url: '/uploads/banners/uuid.jpg' }
};

// ─── KYC ──────────────────────────────────────────────────────────────────────

export const getKycStats = async () => {
    const response = await api.get('/admin/kyc/stats');
    return response.data.data;
};

export const getKycAgents = async (params?: Record<string, any>) => {
    const response = await api.get('/admin/kyc/agents', { params });
    return response.data.data;
};

export const getKycAgentDetail = async (agentId: number) => {
    const response = await api.get(`/admin/kyc/agents/${agentId}`);
    return response.data.data;
};

export const approveAgent = async (agentId: number, notes?: string) => {
    const response = await api.post(`/admin/kyc/agents/${agentId}/approve`, { notes });
    return response.data.data;
};

export const rejectAgent = async (agentId: number, notes: string) => {
    const response = await api.post(`/admin/kyc/agents/${agentId}/reject`, { notes });
    return response.data.data;
};

export const getKycDealers = async (params?: Record<string, any>) => {
    const response = await api.get('/admin/kyc/dealers', { params });
    return response.data.data;
};

export const getKycDealerDetail = async (dealerId: number) => {
    const response = await api.get(`/admin/kyc/dealers/${dealerId}`);
    return response.data.data;
};

export const approveDealer = async (dealerId: number, notes?: string) => {
    const response = await api.post(`/admin/kyc/dealers/${dealerId}/approve`, { notes });
    return response.data.data;
};

export const rejectDealer = async (dealerId: number, notes: string) => {
    const response = await api.post(`/admin/kyc/dealers/${dealerId}/reject`, { notes });
    return response.data.data;
};

// ─── Bookings ──────────────────────────────────────────────────────────────────

export const getBookings = async (params?: Record<string, any>) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data.data;
};

export const getBookingDetail = async (id: number) => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data.data;
};

export const assignBooking = async (id: number, agentId: number) => {
    const response = await api.patch(`/admin/bookings/${id}/assign`, { agent_id: agentId });
    return response.data.data;
};

export const cancelBooking = async (id: number, reason: string) => {
    const response = await api.patch(`/admin/bookings/${id}/cancel`, { reason });
    return response.data.data;
};

// ─── Orders ────────────────────────────────────────────────────────────────────

export const getOrders = async (params?: Record<string, any>) => {
    const response = await api.get('/admin/orders', { params });
    return response.data.data;
};

export const getOrderDetail = async (id: number) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data.data;
};

export const updateOrderStatus = async (id: number, status: string) => {
    const response = await api.patch(`/admin/orders/${id}/status`, { status });
    return response.data.data;
};
