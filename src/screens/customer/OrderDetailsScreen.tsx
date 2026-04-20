import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, spacing, typography, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useOrdersStore } from '../../store/ordersStore';
import { CancelReasonModal } from '../../components/CancelReasonModal';
import { resolveProductImageSource } from '../../utils/productImage';

type OrderDetailsScreenProps = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any, any>;
};

const getStatusLabel = (status: string): string => {
    const value = String(status || '').toLowerCase();
    switch (value) {
        case 'paid': return 'Paid';
        case 'packed': return 'Packed';
        case 'shipped': return 'Shipped';
        case 'delivered': return 'Delivered';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        case 'refunded': return 'Refunded';
        case 'processing': return 'Processing';
        case 'confirmed': return 'Confirmed';
        default: return 'Pending';
    }
};

const getStatusColor = (status: string): string => {
    const value = String(status || '').toLowerCase();
    switch (value) {
        case 'delivered':
        case 'completed':
            return customerColors.success;
        case 'cancelled':
        case 'refunded':
            return customerColors.error;
        case 'packed':
        case 'pending':
            return customerColors.warning;
        case 'shipped':
            return customerColors.info;
        default:
            return customerColors.primary;
    }
};

const formatCurrency = (value: number): string =>
    `Rs ${Math.round(value || 0).toLocaleString('en-IN')}`;

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatAddress = (address: any): string => {
    if (!address) return 'Address unavailable';
    return [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
        .filter(Boolean)
        .join(', ');
};

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
    const orderId = Number(route.params?.orderId);
    const { selectedOrder, isLoadingDetail, fetchOrderById, clearSelectedOrder, cancelOrder } = useOrdersStore();

    const [cancelModal, setCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (Number.isFinite(orderId) && orderId > 0) {
            fetchOrderById(orderId);
        }
        return () => { clearSelectedOrder(); };
    }, [orderId, fetchOrderById, clearSelectedOrder]);

    const handleCancelConfirm = async (reason: string) => {
        if (!selectedOrder) return;
        setCancelling(true);
        try {
            const result = await cancelOrder(selectedOrder.id, reason);
            setCancelModal(false);
            // Re-fetch so UI reflects the new status
            await fetchOrderById(selectedOrder.id);
            const message = result.refunded && result.refund_amount > 0
                ? `Your order has been cancelled and ₹${result.refund_amount} has been refunded to your wallet.`
                : 'Your order has been cancelled successfully.';
            Alert.alert('Order Cancelled', message, [{ text: 'OK' }]);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to cancel order. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    if (isLoadingDetail || !selectedOrder) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[customerColors.primary, customerColors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: 60 }]}
                >
                    <Ionicons name="receipt" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={28} color={customerColors.textOnPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Order Details</Text>
                            <Text style={styles.headerSubtitle}>Fetching your order info...</Text>
                        </View>
                    </View>
                </LinearGradient>
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={customerColors.primary} />
                </View>
            </View>
        );
    }

    const statusColor = getStatusColor(selectedOrder.status);
    const canCancel = selectedOrder.status === 'pending' || selectedOrder.status === 'paid';
    const isTerminal = selectedOrder.status === 'cancelled' || selectedOrder.status === 'refunded' || selectedOrder.status === 'delivered' || selectedOrder.status === 'completed';
    const canRetryPayment = !isTerminal && String(selectedOrder.paymentStatus ?? '').toLowerCase() !== 'paid';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: 60 }]}
            >
                <Ionicons name="receipt" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color={customerColors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Order #{selectedOrder.id}</Text>
                        <Text style={styles.headerSubtitle}>View and track your package status</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Order header information - Refined summary instead of duplicating ID */}
                <View style={styles.sectionCard}>
                    <View style={styles.topRow}>
                        <Text style={styles.orderSummaryTitle}>Overview</Text>
                        <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>
                                {getStatusLabel(selectedOrder.status)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.metaText}>Placed on {formatDate(selectedOrder.createdAt)}</Text>
                    <Text style={styles.metaText}>Payment: <Text style={{ color: selectedOrder.paymentStatus?.toLowerCase() === 'paid' ? customerColors.success : customerColors.warning, fontWeight: '700' }}>{selectedOrder.paymentStatus}</Text></Text>
                </View>

                {/* Delivery address */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <Text style={styles.bodyText}>{formatAddress(selectedOrder.address)}</Text>
                </View>

                {/* Items */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {selectedOrder.items.map((item) => {
                        const itemImageSource = resolveProductImageSource(item.imageUrl);

                        return (
                            <View key={item.id} style={styles.itemRow}>
                                <View style={styles.itemThumb}>
                                    {itemImageSource ? (
                                        <Image source={itemImageSource} style={styles.itemImage} />
                                    ) : (
                                        <Ionicons name="cube-outline" size={18} color={customerColors.primary} />
                                    )}
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemMeta}>
                                        Qty: {item.qty} x {formatCurrency(item.unitPrice)}
                                    </Text>
                                </View>
                                <Text style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Order summary */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(selectedOrder.subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(selectedOrder.deliveryFee)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount</Text>
                        <Text style={styles.summaryValue}>- {formatCurrency(selectedOrder.discount)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(selectedOrder.totalAmount)}</Text>
                    </View>
                </View>

                {/* Retry payment — for unpaid active orders */}
                {canRetryPayment && (
                    <TouchableOpacity
                        style={styles.retryPaymentBtn}
                        onPress={() => navigation.navigate('PaymentScreen', {
                            amount: selectedOrder.totalAmount,
                            entityType: 'order',
                            entityId: selectedOrder.id,
                            description: 'IONORA CARE Order',
                        })}
                    >
                        <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.retryPaymentBtnText}>Retry Payment</Text>
                    </TouchableOpacity>
                )}

                {/* Cancel button — only for pending / paid */}
                {canCancel && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, canRetryPayment && { marginTop: 8 }]}
                        onPress={() => setCancelModal(true)}
                    >
                        <Ionicons name="close-circle-outline" size={18} color={customerColors.error} />
                        <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Cancel reason modal (shared component) */}
            <CancelReasonModal
                visible={cancelModal}
                type="order"
                loading={cancelling}
                onClose={() => setCancelModal(false)}
                onConfirm={handleCancelConfirm}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: customerColors.background },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerIconBg: {
        position: 'absolute',
        right: -20,
        bottom: -20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
        marginLeft: -spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        ...typography.headerTitle,
        color: customerColors.textOnPrimary,
        fontSize: 22,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    sectionCard: {
        backgroundColor: customerColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderSummaryTitle: { ...typography.body, fontWeight: '700', color: customerColors.text },
    badge: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
    badgeText: { ...typography.caption, fontWeight: '700' },
    metaText: { ...typography.bodySmall, color: customerColors.textSecondary, marginTop: spacing.xs },

    sectionTitle: { ...typography.body, fontWeight: '700', color: customerColors.text, marginBottom: spacing.sm },
    bodyText: { ...typography.bodySmall, color: customerColors.textSecondary },

    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    itemThumb: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.sm,
        backgroundColor: customerColors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
        flexShrink: 0,
    },
    itemImage: { width: '100%', height: '100%', borderRadius: borderRadius.sm, resizeMode: 'cover' },
    itemInfo: { flex: 1 },
    itemName: { ...typography.bodySmall, color: customerColors.text, fontWeight: '600' },
    itemMeta: { ...typography.caption, color: customerColors.textSecondary },
    itemTotal: { ...typography.bodySmall, color: customerColors.text, fontWeight: '700' },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    summaryLabel: { ...typography.bodySmall, color: customerColors.textSecondary },
    summaryValue: { ...typography.bodySmall, color: customerColors.text },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: customerColors.border,
        paddingTop: spacing.sm,
        marginTop: spacing.xs,
    },
    totalLabel: { ...typography.body, color: customerColors.text, fontWeight: '700' },
    totalValue: { ...typography.body, color: customerColors.primary, fontWeight: '700' },

    retryPaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: customerColors.primary,
    },
    retryPaymentBtnText: { ...typography.body, color: '#FFFFFF', fontWeight: '700' },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: customerColors.error,
        backgroundColor: customerColors.error + '0D',
    },
    cancelBtnText: { ...typography.body, color: customerColors.error, fontWeight: '700' },
});

