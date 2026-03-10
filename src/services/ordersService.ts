// Orders Service - API calls for Orders and Checkout

import api from './api';

export type OrderStatusBucket = 'active' | 'delivered' | 'cancelled';

// Types
export interface CheckoutRequest {
    addressId: number;
    paymentMethod?: 'cod' | 'wallet';
    referralCode?: string;
}

export interface CheckoutResponse {
    orderId: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    referred_by_agent_id?: number | null;
    referral_code_used?: string | null;
}

export interface OrderFirstItem {
    productName: string | null;
    imageUrl: string | null;
}

export interface OrderListItem {
    id: number;
    status: string;
    statusBucket: OrderStatusBucket;
    paymentStatus: string;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    totalAmount: number;
    itemCount: number;
    createdAt: string;
    firstItem: OrderFirstItem | null;
}

export interface OrderAddress {
    id: number;
    label?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
}

export interface OrderDetailItem {
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    imageUrl: string | null;
    qty: number;
    unitPrice: number;
    lineTotal: number;
}

export interface OrderDetail extends OrderListItem {
    address: OrderAddress | null;
    items: OrderDetailItem[];
}

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped']);
const DELIVERED_STATUSES = new Set(['delivered', 'completed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'refunded']);

const toNumber = (value: unknown, fallback = 0): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeStatus = (value: unknown): string => {
    return String(value || 'pending').trim().toLowerCase();
};

const deriveStatusBucket = (status: string): OrderStatusBucket => {
    if (DELIVERED_STATUSES.has(status)) return 'delivered';
    if (CANCELLED_STATUSES.has(status)) return 'cancelled';
    if (ACTIVE_STATUSES.has(status)) return 'active';
    return 'active';
};

const normalizeStatusBucket = (statusBucket: unknown, status: string): OrderStatusBucket => {
    const bucket = String(statusBucket || '').toLowerCase();
    if (bucket === 'active' || bucket === 'delivered' || bucket === 'cancelled') {
        return bucket;
    }
    return deriveStatusBucket(status);
};

const normalizeFirstItem = (item: any): OrderFirstItem | null => {
    if (!item) return null;
    return {
        productName: item.productName ?? item.product_name ?? null,
        imageUrl: item.imageUrl ?? item.image_url ?? null,
    };
};

const normalizeOrderListItem = (order: any): OrderListItem => {
    const status = normalizeStatus(order.status);
    return {
        id: toNumber(order.id),
        status,
        statusBucket: normalizeStatusBucket(order.statusBucket ?? order.status_bucket, status),
        paymentStatus: normalizeStatus(order.paymentStatus ?? order.payment_status),
        subtotal: toNumber(order.subtotal),
        deliveryFee: toNumber(order.deliveryFee ?? order.delivery_fee),
        discount: toNumber(order.discount),
        totalAmount: toNumber(order.totalAmount ?? order.total_amount),
        itemCount: toNumber(order.itemCount ?? order.item_count),
        createdAt: String(order.createdAt ?? order.created_at ?? ''),
        firstItem: normalizeFirstItem(order.firstItem ?? order.first_item),
    };
};

const normalizeAddress = (address: any): OrderAddress | null => {
    if (!address) return null;
    return {
        id: toNumber(address.id),
        label: address.label ?? null,
        line1: address.line1 ?? null,
        line2: address.line2 ?? null,
        city: address.city ?? null,
        state: address.state ?? null,
        postalCode: address.postalCode ?? address.postal_code ?? null,
        country: address.country ?? null,
    };
};

const normalizeOrderDetailItem = (item: any): OrderDetailItem => {
    return {
        id: toNumber(item.id),
        orderId: toNumber(item.orderId ?? item.order_id),
        productId: toNumber(item.productId ?? item.product_id),
        productName: item.productName ?? item.product_name ?? 'Product',
        imageUrl: item.imageUrl ?? item.image_url ?? null,
        qty: toNumber(item.qty, 1),
        unitPrice: toNumber(item.unitPrice ?? item.unit_price),
        lineTotal: toNumber(item.lineTotal ?? item.line_total),
    };
};

const normalizeOrderDetail = (order: any): OrderDetail => {
    const base = normalizeOrderListItem(order);
    return {
        ...base,
        address: normalizeAddress(order.address),
        items: Array.isArray(order.items) ? order.items.map(normalizeOrderDetailItem) : [],
    };
};

// API Methods
export const ordersService = {
    /**
     * Checkout cart and create order
     */
    async checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
        const payload: Record<string, unknown> = {
            address_id: data.addressId,
            payment_method: data.paymentMethod || 'cod',
        };

        if (data.referralCode) {
            payload.referral_code = data.referralCode;
        }

        const response = await api.post('/orders/checkout', payload);
        const result = response.data?.data || {};
        return {
            orderId: toNumber(result.orderId ?? result.order_id),
            totalAmount: toNumber(result.totalAmount ?? result.total_amount),
            status: normalizeStatus(result.status),
            paymentStatus: normalizeStatus(result.paymentStatus ?? result.payment_status),
            referred_by_agent_id: result.referred_by_agent_id ?? null,
            referral_code_used: result.referral_code_used ?? null,
        };
    },

    /**
     * Get user's orders
     */
    async getOrders(): Promise<OrderListItem[]> {
        const response = await api.get('/orders');
        const orders = Array.isArray(response.data?.data) ? response.data.data : [];
        return orders.map(normalizeOrderListItem);
    },

    /**
     * Get order details by ID
     */
    async getOrderById(id: number): Promise<OrderDetail> {
        const response = await api.get(`/orders/${id}`);
        return normalizeOrderDetail(response.data?.data);
    },

    /**
     * Cancel an order with a mandatory reason
     */
    async cancelOrder(id: number, reason: string): Promise<{ refunded: boolean; refund_amount: number }> {
        const response = await api.post(`/orders/${id}/cancel`, { reason });
        return response.data?.data ?? { refunded: false, refund_amount: 0 };
    },
};

export default ordersService;

