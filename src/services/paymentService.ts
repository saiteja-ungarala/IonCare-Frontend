import api from './api';

export interface CreateOrderResponse {
    razorpay_order_id: string;
    amount: number;       // in paise (already multiplied by 100)
    currency: string;
    key: string;
}

export const paymentService = {
    async createOrder(
        amount: number,
        entityType: 'booking' | 'order',
        entityId: number
    ): Promise<CreateOrderResponse> {
        const response = await api.post('/payments/create-order', {
            amount,
            entity_type: entityType,
            entity_id: entityId,
        });
        return response.data.data as CreateOrderResponse;
    },

    async verifyPayment(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ): Promise<void> {
        await api.post('/payments/verify', {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        });
    },
};
