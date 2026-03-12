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
import { borderRadius, colors, shadows, spacing, typography } from '../../theme/theme';
import { useOrdersStore } from '../../store/ordersStore';
import { CancelReasonModal } from '../../components/CancelReasonModal';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            return colors.success;
        case 'cancelled':
        case 'refunded':
            return colors.error;
        case 'packed':
        case 'pending':
            return colors.warning;
        case 'shipped':
            return colors.info;
        default:
            return colors.primary;
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
    return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
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
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                </View>
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const statusColor = getStatusColor(selectedOrder.status);
    const canCancel = selectedOrder.status === 'pending' || selectedOrder.status === 'paid';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Order header */}
                <View style={styles.sectionCard}>
                    <View style={styles.topRow}>
                        <Text style={styles.orderId}>Order #{selectedOrder.id}</Text>
                        <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>
                                {getStatusLabel(selectedOrder.status)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.metaText}>Placed on {formatDate(selectedOrder.createdAt)}</Text>
                    <Text style={styles.metaText}>Payment: {selectedOrder.paymentStatus}</Text>
                </View>

                {/* Delivery address */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <Text style={styles.bodyText}>{formatAddress(selectedOrder.address)}</Text>
                </View>

                {/* Items */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {selectedOrder.items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemThumb}>
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                                ) : (
                                    <Ionicons name="cube-outline" size={18} color={colors.primary} />
                                )}
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.productName}</Text>
                                <Text style={styles.itemMeta}>
                                    Qty: {item.qty} × {formatCurrency(item.unitPrice)}
                                </Text>
                            </View>
                            <Text style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
                        </View>
                    ))}
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

                {/* Cancel button — only for pending / paid */}
                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setCancelModal(true)}
                    >
                        <Ionicons name="close-circle-outline" size={18} color={colors.error} />
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        ...shadows.sm,
    },
    backButton: { marginRight: spacing.md },
    headerTitle: { ...typography.h3, color: colors.text },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    scroll: { flex: 1 },
    scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { ...typography.body, fontWeight: '700', color: colors.text },
    badge: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
    badgeText: { ...typography.caption, fontWeight: '700' },
    metaText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },

    sectionTitle: { ...typography.body, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    bodyText: { ...typography.bodySmall, color: colors.textSecondary },

    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    itemThumb: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
        flexShrink: 0,
    },
    itemImage: { width: '100%', height: '100%', borderRadius: borderRadius.sm, resizeMode: 'cover' },
    itemInfo: { flex: 1 },
    itemName: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
    itemMeta: { ...typography.caption, color: colors.textSecondary },
    itemTotal: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    summaryLabel: { ...typography.bodySmall, color: colors.textSecondary },
    summaryValue: { ...typography.bodySmall, color: colors.text },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
        marginTop: spacing.xs,
    },
    totalLabel: { ...typography.body, color: colors.text, fontWeight: '700' },
    totalValue: { ...typography.body, color: colors.primary, fontWeight: '700' },

    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.error,
        backgroundColor: colors.error + '0D',
    },
    cancelBtnText: { ...typography.body, color: colors.error, fontWeight: '700' },
});
