import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { OrderListItem } from '../../services/ordersService';
import { useOrdersStore } from '../../store/ordersStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveProductImageSource } from '../../utils/productImage';

type OrderHistoryScreenProps = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any, any>;
};

type OrderTab = 'active' | 'delivered' | 'cancelled';

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

const formatCurrency = (value: number): string => `Rs ${Math.round(value || 0).toLocaleString('en-IN')}`;

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { orders, isLoading, fetchOrders } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<OrderTab>('active');

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchOrders();
        } finally {
            setRefreshing(false);
        }
    }, [fetchOrders]);

    const grouped = useMemo(() => {
        return {
            active: orders.filter((o) => o.statusBucket === 'active'),
            delivered: orders.filter((o) => o.statusBucket === 'delivered'),
            cancelled: orders.filter((o) => o.statusBucket === 'cancelled'),
        };
    }, [orders]);

    const filteredOrders = grouped[activeTab];

    const renderOrderCard = (order: OrderListItem) => {
        const badgeColor = getStatusColor(order.status);
        const firstItemName = order.firstItem?.productName || 'Product';
        const firstItemImageSource = resolveProductImageSource(order.firstItem?.imageUrl);

        return (
            <TouchableOpacity
                key={String(order.id)}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>{getStatusLabel(order.status)}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.rowText}>{formatDate(order.createdAt)}</Text>
                </View>

                <View style={styles.row}>
                    <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.rowText}>{order.itemCount} item(s)</Text>
                </View>

                {order.firstItem ? (
                    <View style={styles.previewRow}>
                        <View style={styles.thumbnail}>
                            {firstItemImageSource ? (
                                <Image source={firstItemImageSource} style={styles.thumbnailImage} />
                            ) : (
                                <Ionicons name="cube-outline" size={18} color={colors.primary} />
                            )}
                        </View>
                        <Text style={styles.previewText} numberOfLines={1}>{firstItemName}</Text>
                    </View>
                ) : null}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="receipt" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Order History</Text>
                        <Text style={styles.headerSubtitle}>Track your product purchases</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.tabContainer}>
                {([
                    { key: 'active' as const, label: `Active (${grouped.active.length})` },
                    { key: 'delivered' as const, label: `Delivered (${grouped.delivered.length})` },
                    { key: 'cancelled' as const, label: `Cancelled (${grouped.cancelled.length})` },
                ]).map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : filteredOrders.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="receipt-outline" size={84} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
                    <Text style={styles.emptySubtitle}>Your product orders will appear here.</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                >
                    {filteredOrders.map(renderOrderCard)}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
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
        ...typography.h2,
        color: colors.textOnPrimary,
        fontWeight: '800',
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },
    tabContainer: { flexDirection: 'row', padding: spacing.sm, backgroundColor: colors.surface, marginBottom: 1 },
    tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: colors.primary },
    tabText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
    activeTabText: { color: colors.primary },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1, padding: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    orderId: { ...typography.bodySmall, fontWeight: '700', color: colors.text },
    badge: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
    badgeText: { ...typography.caption, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
    rowText: { ...typography.bodySmall, color: colors.textSecondary },
    previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
    thumbnail: {
        width: 30,
        height: 30,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        borderRadius: borderRadius.sm,
        resizeMode: 'cover',
    },
    previewText: { ...typography.bodySmall, color: colors.text, flex: 1 },
    totalRow: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: { ...typography.caption, color: colors.textSecondary },
    totalValue: { ...typography.body, color: colors.primary, fontWeight: '700' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    emptyTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});
