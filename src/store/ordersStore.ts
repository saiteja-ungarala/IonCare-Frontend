import { create } from 'zustand';
import ordersService, { OrderDetail, OrderListItem } from '../services/ordersService';

interface OrdersState {
    orders: OrderListItem[];
    selectedOrder: OrderDetail | null;
    isLoading: boolean;
    isLoadingDetail: boolean;
    error: string | null;
}

interface OrdersActions {
    fetchOrders: () => Promise<void>;
    fetchOrderById: (orderId: number) => Promise<OrderDetail | null>;
    cancelOrder: (orderId: number, reason: string) => Promise<{ refunded: boolean; refund_amount: number }>;
    clearSelectedOrder: () => void;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>((set) => ({
    orders: [],
    selectedOrder: null,
    isLoading: false,
    isLoadingDetail: false,
    error: null,

    fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const orders = await ordersService.getOrders();
            set({ orders, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error?.message || 'Failed to load orders', orders: [] });
        }
    },

    fetchOrderById: async (orderId: number) => {
        set({ isLoadingDetail: true, error: null });
        try {
            const order = await ordersService.getOrderById(orderId);
            set({ selectedOrder: order, isLoadingDetail: false });
            return order;
        } catch (error: any) {
            set({ isLoadingDetail: false, error: error?.message || 'Failed to load order details', selectedOrder: null });
            return null;
        }
    },

    cancelOrder: async (orderId: number, reason: string) => {
        const result = await ordersService.cancelOrder(orderId, reason);
        // Update list + selectedOrder to reflect cancelled status
        set(state => ({
            orders: state.orders.map(o =>
                o.id === orderId ? { ...o, status: 'cancelled', statusBucket: 'cancelled' as const } : o
            ),
            selectedOrder: state.selectedOrder?.id === orderId
                ? { ...state.selectedOrder, status: 'cancelled', statusBucket: 'cancelled' as const }
                : state.selectedOrder,
        }));
        return result;
    },

    clearSelectedOrder: () => set({ selectedOrder: null }),
}));

