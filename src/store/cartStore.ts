// Cart Store - Backend-authoritative cart state using Zustand

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { STORAGE_KEYS } from '../config/constants';

// Raw backend cart item (snake_case from MySQL)
interface RawBackendCartItem {
    id: number;
    cart_item_id?: number;
    cart_id: number;
    item_type: 'product' | 'service';
    product_id?: number;
    service_id?: number;
    qty: number;
    unit_price?: number;
    line_total?: number;
    booking_date?: string;
    booking_time?: string;
    // Joined fields
    product_name?: string;
    product_price?: number;
    product_image?: string;
    service_name?: string;
    service_price?: number;
    service_image?: string;
    product?: {
        id?: number;
        name?: string;
        price?: number;
        image_url?: string;
    } | null;
    service?: {
        id?: number;
        name?: string;
        price?: number;
        image_url?: string;
    } | null;
}

// Normalized cart item for frontend use (camelCase)
export interface BackendCartItem {
    id: number;           // cart item ID from backend
    itemType: 'product' | 'service';
    productId?: number;
    serviceId?: number;
    productName?: string;
    serviceName?: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    bookingDate?: string;
    bookingTime?: string;
}

// Convert snake_case backend response to camelCase frontend format
const normalizeCartItem = (raw: RawBackendCartItem): BackendCartItem => {
    const itemType = raw.item_type ?? 'product';
    const isProduct = itemType === 'product';
    const qty = Number(raw.qty ?? 0);
    const productId = raw.product_id ?? raw.product?.id;
    const serviceId = raw.service_id ?? raw.service?.id;
    const unitPrice = Number(
        raw.unit_price ??
        (isProduct ? raw.product_price ?? raw.product?.price : raw.service_price ?? raw.service?.price) ??
        0
    );
    const lineTotal = Number(raw.line_total ?? unitPrice * qty);
    const productName = raw.product_name ?? raw.product?.name;
    const serviceName = raw.service_name ?? raw.service?.name;
    const cartItemId = Number(raw.id ?? raw.cart_item_id ?? 0);

    return {
        id: cartItemId,
        itemType,
        productId,
        serviceId,
        productName,
        serviceName,
        qty,
        unitPrice,
        totalPrice: lineTotal,
        bookingDate: raw.booking_date,
        bookingTime: raw.booking_time,
    };
};

export interface CartState {
    items: BackendCartItem[];
    totalItems: number;
    totalAmount: number;
    isLoading: boolean;
    error: string | null;
}

export interface CartActions {
    fetchCart: () => Promise<void>;
    addProductToCart: (productId: number, qty?: number) => Promise<void>;
    addServiceToCart: (serviceId: number, date?: string, time?: string) => Promise<void>;
    addToCart: (item: any, type: 'product' | 'service', options?: { date?: string; time?: string; qty?: number }) => Promise<void>;
    updateCartItemQty: (cartItemId: number, qty: number) => Promise<void>;
    removeCartItem: (cartItemId: number) => Promise<void>;
    clearLocalCart: () => void;
}

type CartStore = CartState & CartActions;

const getStoredAuthToken = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'web') {
            if (typeof localStorage === 'undefined') return null;
            return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        }
        return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
        return null;
    }
};

const calculateTotals = (items: BackendCartItem[]) => {
    return items.reduce(
        (acc, item) => ({
            totalItems: acc.totalItems + item.qty,
            totalAmount: acc.totalAmount + item.totalPrice,
        }),
        { totalItems: 0, totalAmount: 0 }
    );
};

export const useCartStore = create<CartStore>((set, get) => ({
    // Initial state
    items: [],
    totalItems: 0,
    totalAmount: 0,
    isLoading: false,
    error: null,

    // Fetch cart from backend
    fetchCart: async () => {
        set({ isLoading: true, error: null });

        const token = await getStoredAuthToken();
        if (!token) {
            set({ isLoading: false, error: null, items: [], totalItems: 0, totalAmount: 0 });
            return;
        }

        try {
            const response = await api.get('/cart');
            console.log('[CartStore] fetchCart response:', response.data);
            const cartData = response.data.data;
            const rawItems: RawBackendCartItem[] = cartData?.items || [];
            const items = rawItems.map(normalizeCartItem);
            const totals = calculateTotals(items);
            console.log('[CartStore] Normalized items:', items);
            set({ items, ...totals, isLoading: false });
        } catch (error: any) {
            if (error?.response?.status === 401) {
                set({ isLoading: false, error: null, items: [], totalItems: 0, totalAmount: 0 });
                return;
            }

            const message = error?.response?.data?.message || error?.message || 'Failed to fetch cart';
            console.error('[CartStore] fetchCart error:', message);
            set({ isLoading: false, error: message, items: [] });
        }
    },

    // Add product to cart
    addProductToCart: async (productId: number, qty: number = 1) => {
        set({ isLoading: true, error: null });
        try {
            console.log('[CartStore] addProductToCart:', { productId, qty });
            const response = await api.post('/cart/items', {
                item_type: 'product',
                product_id: productId,
                qty,
            });
            console.log('[CartStore] addProductToCart response:', response.data);

            const cartData = response.data.data;
            if (!cartData || !Array.isArray(cartData.items)) {
                console.warn('[CartStore] Response missing items, refetching cart...');
                await get().fetchCart();
                return;
            }

            const rawItems: RawBackendCartItem[] = cartData.items;
            const items = rawItems.map(normalizeCartItem);
            const totals = calculateTotals(items);
            set({ items, ...totals, isLoading: false });
            await get().fetchCart();
        } catch (error: any) {
            console.error('[CartStore] addProductToCart error:', error.response?.data || error);
            set({ isLoading: false, error: error.response?.data?.message || error.message });
            throw error;
        }
    },

    // Add service to cart
    addServiceToCart: async (serviceId: number, date?: string, time?: string) => {
        set({ isLoading: true, error: null });
        try {
            console.log('[CartStore] addServiceToCart:', { serviceId, date, time });
            const response = await api.post('/cart/items', {
                item_type: 'service',
                service_id: serviceId,
                booking_date: date,
                booking_time: time,
                qty: 1
            });
            console.log('[CartStore] addServiceToCart response:', response.data);

            const cartData = response.data.data;
            if (!cartData || !Array.isArray(cartData.items)) {
                console.warn('[CartStore] Response missing items, refetching cart...');
                await get().fetchCart();
                return;
            }

            const rawItems: RawBackendCartItem[] = cartData.items;
            const items = rawItems.map(normalizeCartItem);
            const totals = calculateTotals(items);
            set({ items, ...totals, isLoading: false });
            await get().fetchCart();
        } catch (error: any) {
            console.error('[CartStore] addServiceToCart error:', error.response?.data || error);
            set({ isLoading: false, error: error.response?.data?.message || error.message });
            throw error;
        }
    },

    // Generic add to cart (handles both products and services)
    addToCart: async (item: any, type: 'product' | 'service', options?: { date?: string; time?: string; qty?: number }) => {
        if (type === 'product') {
            await get().addProductToCart(Number(item.id), options?.qty || 1);
        } else {
            await get().addServiceToCart(Number(item.id), options?.date, options?.time);
        }
    },

    // Update cart item quantity
    updateCartItemQty: async (cartItemId: number, qty: number) => {
        set({ isLoading: true, error: null });
        try {
            if (qty <= 0) {
                await get().removeCartItem(cartItemId);
                return;
            }
            const response = await api.patch(`/cart/items/${cartItemId}`, { qty });

            const cartData = response.data.data;
            if (!cartData || !Array.isArray(cartData.items)) {
                console.warn('[CartStore] Response missing items, refetching cart...');
                await get().fetchCart();
                return;
            }

            const rawItems: RawBackendCartItem[] = cartData.items;
            const items = rawItems.map(normalizeCartItem);
            const totals = calculateTotals(items);
            set({ items, ...totals, isLoading: false });
            await get().fetchCart();
        } catch (error: any) {
            console.error('[CartStore] updateCartItemQty error:', error);
            set({ isLoading: false, error: error.response?.data?.message || error.message });
            throw error;
        }
    },

    // Remove cart item
    removeCartItem: async (cartItemId: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.delete(`/cart/items/${cartItemId}`);

            const cartData = response.data.data;
            if (!cartData || !Array.isArray(cartData.items)) {
                console.warn('[CartStore] Response missing items, refetching cart...');
                await get().fetchCart();
                return;
            }

            const rawItems: RawBackendCartItem[] = cartData.items;
            const items = rawItems.map(normalizeCartItem);
            const totals = calculateTotals(items);
            set({ items, ...totals, isLoading: false });
            await get().fetchCart();
        } catch (error: any) {
            if (error?.response?.status === 404) {
                // If the item was already removed on the server, sync local state from backend
                // and treat the delete as effectively successful.
                await get().fetchCart();
                const itemStillExists = get().items.some((item) => item.id === cartItemId);
                if (!itemStillExists) {
                    set({ isLoading: false, error: null });
                    return;
                }
            }
            console.error('[CartStore] removeCartItem error:', error);
            set({ isLoading: false, error: error.response?.data?.message || error.message });
            throw error;
        }
    },

    // Clear local cart state (used after checkout)
    clearLocalCart: () => {
        set({ items: [], totalItems: 0, totalAmount: 0 });
    },
}));
