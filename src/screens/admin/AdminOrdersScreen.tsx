import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { adminColors } from '../../theme/adminTheme';
import { getBookings, getOrders } from '../../services/adminService';

// ─── Types ─────────────────────────────────────────────────────────────────────

type BookingItem = {
    id: number;
    status: string;
    customer_name: string;
    customer_phone: string;
    service_name: string;
    scheduled_at: string;
    agent_name: string | null;
    total_amount: number;
};

type OrderItem = {
    id: number;
    status: string;
    payment_status: string;
    total_amount: number;
    customer_name: string;
    created_at: string;
    item_count: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const BOOKING_STATUSES = ['all', 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];
const ORDER_STATUSES   = ['all', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['all', 'pending', 'paid', 'failed'];
const PAGE_LIMIT = 20;

const BOOKING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending:     { bg: 'rgba(245,158,11,0.15)',  text: '#B45309' },
    confirmed:   { bg: 'rgba(37,99,235,0.15)',   text: '#1D4ED8' },
    assigned:    { bg: 'rgba(109,40,217,0.15)',  text: '#6D28D9' },
    in_progress: { bg: 'rgba(8,145,178,0.15)',   text: '#0E7490' },
    completed:   { bg: 'rgba(22,163,74,0.15)',   text: '#15803D' },
    cancelled:   { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' },
};

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    paid:      { bg: 'rgba(37,99,235,0.15)',   text: '#1D4ED8' },
    packed:    { bg: 'rgba(109,40,217,0.15)',  text: '#6D28D9' },
    shipped:   { bg: 'rgba(8,145,178,0.15)',   text: '#0E7490' },
    delivered: { bg: 'rgba(22,163,74,0.15)',   text: '#15803D' },
    cancelled: { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' },
};

const PAY_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    paid:    { bg: 'rgba(22,163,74,0.15)',   text: '#15803D' },
    pending: { bg: 'rgba(245,158,11,0.15)',  text: '#B45309' },
    failed:  { bg: 'rgba(239,68,68,0.15)',   text: '#DC2626' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str: string | null): string {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(str: string | null): string {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatRupees(amount: number | null): string {
    if (amount == null) return '—';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function StatusChip({ status, colorMap }: { status: string; colorMap: Record<string, { bg: string; text: string }> }) {
    const c = colorMap[status] ?? { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
        <View style={[chipStyles.chip, { backgroundColor: c.bg }]}>
            <Text style={[chipStyles.text, { color: c.text }]}>{label}</Text>
        </View>
    );
}
const chipStyles = StyleSheet.create({
    chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    text: { fontSize: 11, fontWeight: '700' },
});

// ─── Dropdown component ────────────────────────────────────────────────────────

function FilterDropdown({ value, options, onChange, placeholder }: {
    value: string; options: string[]; onChange: (v: string) => void; placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const display = value === 'all' ? (placeholder ?? 'All') : value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
        <>
            <TouchableOpacity style={ddStyles.btn} onPress={() => setOpen(true)} activeOpacity={0.7}>
                <Text style={ddStyles.btnText} numberOfLines={1}>{display}</Text>
                <Ionicons name="chevron-down" size={13} color={adminColors.textMuted} />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity style={ddStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
                    <View style={ddStyles.list}>
                        {options.map(o => (
                            <TouchableOpacity
                                key={o}
                                style={[ddStyles.option, o === value && ddStyles.optionActive]}
                                onPress={() => { onChange(o); setOpen(false); }}
                            >
                                <Text style={[ddStyles.optionText, o === value && ddStyles.optionTextActive]}>
                                    {o === 'all' ? (placeholder ?? 'All') : o.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                                {o === value && <Ionicons name="checkmark" size={14} color={adminColors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}
const ddStyles = StyleSheet.create({
    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: adminColors.surface, borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, flex: 1,
    },
    btnText:   { flex: 1, fontSize: 12, color: adminColors.text },
    overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: 32 },
    list:      { backgroundColor: adminColors.surface, borderRadius: 12, overflow: 'hidden', maxHeight: 300 },
    option:    { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    optionActive:     { backgroundColor: adminColors.primaryLight },
    optionText:       { fontSize: 14, color: adminColors.text },
    optionTextActive: { fontWeight: '700', color: adminColors.primary },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AdminOrdersScreen() {
    const navigation = useNavigation<any>();
    const [tab, setTab] = useState(0); // 0=Bookings, 1=Orders

    // ── Bookings state ────────────────────────────────────────────────────────
    const [bStatus,    setBStatus]    = useState('all');
    const [bDateFrom,  setBDateFrom]  = useState('');
    const [bDateTo,    setBDateTo]    = useState('');
    const [bItems,     setBItems]     = useState<BookingItem[]>([]);
    const [bTotal,     setBTotal]     = useState(0);
    const [bLoading,   setBLoading]   = useState(false);
    const [bLoadMore,  setBLoadMore]  = useState(false);
    const [bRefreshing,setBRefreshing]= useState(false);
    const bPageRef    = useRef(1);
    const bStatusRef  = useRef('all');
    const bDateFromRef= useRef('');
    const bDateToRef  = useRef('');

    // ── Orders state ──────────────────────────────────────────────────────────
    const [oStatus,    setOStatus]    = useState('all');
    const [oPayStatus, setOPayStatus] = useState('all');
    const [oItems,     setOItems]     = useState<OrderItem[]>([]);
    const [oTotal,     setOTotal]     = useState(0);
    const [oLoading,   setOLoading]   = useState(false);
    const [oLoadMore,  setOLoadMore]  = useState(false);
    const [oRefreshing,setORefreshing]= useState(false);
    const oPageRef      = useRef(1);
    const oStatusRef    = useRef('all');
    const oPayStatusRef = useRef('all');

    // Keep refs current
    bStatusRef.current   = bStatus;
    bDateFromRef.current = bDateFrom;
    bDateToRef.current   = bDateTo;
    oStatusRef.current   = oStatus;
    oPayStatusRef.current= oPayStatus;

    const isMountedRef = useRef(false);

    // ── Load bookings ─────────────────────────────────────────────────────────
    const loadBookings = useCallback(async (pageNum: number, isRefresh = false) => {
        const params: Record<string, any> = { page: pageNum, limit: PAGE_LIMIT };
        if (bStatusRef.current !== 'all') params.status = bStatusRef.current;
        if (bDateFromRef.current)         params.date_from = bDateFromRef.current;
        if (bDateToRef.current)           params.date_to = bDateToRef.current;

        if (pageNum === 1) { if (isRefresh) setBRefreshing(true); else setBLoading(true); }
        else setBLoadMore(true);

        try {
            const data = await getBookings(params);
            const items: BookingItem[] = data?.items ?? data ?? [];
            const total: number = data?.total ?? items.length;
            setBTotal(total);
            setBItems(prev => pageNum === 1 ? items : [...prev, ...items]);
        } catch (e) {
            console.error('[AdminOrders] bookings error:', e);
        } finally {
            setBLoading(false); setBRefreshing(false); setBLoadMore(false);
        }
    }, []);

    // ── Load orders ───────────────────────────────────────────────────────────
    const loadOrders = useCallback(async (pageNum: number, isRefresh = false) => {
        const params: Record<string, any> = { page: pageNum, limit: PAGE_LIMIT };
        if (oStatusRef.current !== 'all')    params.status = oStatusRef.current;
        if (oPayStatusRef.current !== 'all') params.payment_status = oPayStatusRef.current;

        if (pageNum === 1) { if (isRefresh) setORefreshing(true); else setOLoading(true); }
        else setOLoadMore(true);

        try {
            const data = await getOrders(params);
            const items: OrderItem[] = data?.items ?? data ?? [];
            const total: number = data?.total ?? items.length;
            setOTotal(total);
            setOItems(prev => pageNum === 1 ? items : [...prev, ...items]);
        } catch (e) {
            console.error('[AdminOrders] orders error:', e);
        } finally {
            setOLoading(false); setORefreshing(false); setOLoadMore(false);
        }
    }, []);

    const loadBookingsRef = useRef(loadBookings);
    const loadOrdersRef   = useRef(loadOrders);
    loadBookingsRef.current = loadBookings;
    loadOrdersRef.current   = loadOrders;

    // ── Focus refresh ─────────────────────────────────────────────────────────
    useFocusEffect(useCallback(() => {
        if (isMountedRef.current) {
            if (tab === 0) { bPageRef.current = 1; setBItems([]); loadBookingsRef.current(1, true); }
            else           { oPageRef.current = 1; setOItems([]); loadOrdersRef.current(1, true); }
        }
        isMountedRef.current = true;
    }, [tab]));

    // ── Reload on filter change ───────────────────────────────────────────────
    useEffect(() => {
        bPageRef.current = 1; setBItems([]);
        loadBookingsRef.current(1);
    }, [bStatus, bDateFrom, bDateTo]);

    useEffect(() => {
        oPageRef.current = 1; setOItems([]);
        loadOrdersRef.current(1);
    }, [oStatus, oPayStatus]);

    // Switch tab → load that tab on first view
    useEffect(() => {
        if (tab === 0) { bPageRef.current = 1; setBItems([]); loadBookingsRef.current(1); }
        else           { oPageRef.current = 1; setOItems([]); loadOrdersRef.current(1); }
    }, [tab]);

    // ── Render booking card ───────────────────────────────────────────────────
    const renderBooking = ({ item }: { item: BookingItem }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminBookingDetail', { bookingId: item.id })}
        >
            <View style={styles.cardTopRow}>
                <Text style={styles.cardId}>Booking #{item.id}</Text>
                <StatusChip status={item.status} colorMap={BOOKING_STATUS_COLORS} />
            </View>
            <Text style={styles.cardPrimary}>{item.customer_name}</Text>
            <Text style={styles.cardSecondary}>{item.customer_phone}</Text>
            <View style={styles.cardRow}>
                <Ionicons name="construct-outline" size={13} color={adminColors.textMuted} />
                <Text style={styles.cardMeta}>{item.service_name}</Text>
            </View>
            <View style={styles.cardRow}>
                <Ionicons name="calendar-outline" size={13} color={adminColors.textMuted} />
                <Text style={styles.cardMeta}>{formatDateTime(item.scheduled_at)}</Text>
            </View>
            <View style={styles.cardBottomRow}>
                <View style={styles.cardRow}>
                    <Ionicons name="person-outline" size={13} color={item.agent_name ? adminColors.textMuted : '#F59E0B'} />
                    <Text style={[styles.cardMeta, !item.agent_name && { color: '#F59E0B', fontWeight: '600' }]}>
                        {item.agent_name ?? 'Unassigned'}
                    </Text>
                </View>
                <Text style={styles.cardAmount}>{formatRupees(item.total_amount)}</Text>
            </View>
        </TouchableOpacity>
    );

    // ── Render order card ─────────────────────────────────────────────────────
    const renderOrder = ({ item }: { item: OrderItem }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })}
        >
            <View style={styles.cardTopRow}>
                <Text style={styles.cardId}>Order #{item.id}</Text>
                <View style={styles.badgeRow}>
                    <StatusChip status={item.status}         colorMap={ORDER_STATUS_COLORS} />
                    <StatusChip status={item.payment_status} colorMap={PAY_STATUS_COLORS} />
                </View>
            </View>
            <Text style={styles.cardPrimary}>{item.customer_name}</Text>
            <View style={styles.cardBottomRow}>
                <View style={styles.cardRow}>
                    <Ionicons name="cube-outline" size={13} color={adminColors.textMuted} />
                    <Text style={styles.cardMeta}>{item.item_count ?? '?'} item{item.item_count !== 1 ? 's' : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cardAmount}>{formatRupees(item.total_amount)}</Text>
                    <Text style={styles.cardDateSmall}>{formatDate(item.created_at)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const isBookings = tab === 0;
    const loading     = isBookings ? bLoading    : oLoading;
    const refreshing  = isBookings ? bRefreshing : oRefreshing;
    const loadingMore = isBookings ? bLoadMore   : oLoadMore;
    const items       = isBookings ? bItems      : oItems;
    const total       = isBookings ? bTotal      : oTotal;

    const handleRefresh = () => {
        if (isBookings) { bPageRef.current = 1; setBItems([]); loadBookingsRef.current(1, true); }
        else            { oPageRef.current = 1; setOItems([]); loadOrdersRef.current(1, true); }
    };

    const handleLoadMore = () => {
        if (loadingMore || items.length >= total) return;
        if (isBookings) {
            const next = bPageRef.current + 1; bPageRef.current = next;
            loadBookingsRef.current(next);
        } else {
            const next = oPageRef.current + 1; oPageRef.current = next;
            loadOrdersRef.current(next);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Orders & Bookings</Text>
            </View>

            {/* Main tabs */}
            <View style={styles.tabBar}>
                {['Bookings', 'Product Orders'].map((label, idx) => (
                    <TouchableOpacity
                        key={label}
                        style={[styles.tabBtn, tab === idx && styles.tabBtnActive]}
                        onPress={() => setTab(idx)}
                    >
                        <Text style={[styles.tabBtnText, tab === idx && styles.tabBtnTextActive]}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Filter row */}
            {isBookings ? (
                <View style={styles.filters}>
                    <FilterDropdown
                        value={bStatus}
                        options={BOOKING_STATUSES}
                        onChange={setBStatus}
                        placeholder="All Status"
                    />
                    <TextInput
                        style={styles.dateInput}
                        value={bDateFrom}
                        onChangeText={setBDateFrom}
                        placeholder="From YYYY-MM-DD"
                        placeholderTextColor={adminColors.textLight}
                        autoCapitalize="none"
                        returnKeyType="done"
                    />
                    <TextInput
                        style={styles.dateInput}
                        value={bDateTo}
                        onChangeText={setBDateTo}
                        placeholder="To YYYY-MM-DD"
                        placeholderTextColor={adminColors.textLight}
                        autoCapitalize="none"
                        returnKeyType="done"
                    />
                </View>
            ) : (
                <View style={styles.filters}>
                    <FilterDropdown
                        value={oStatus}
                        options={ORDER_STATUSES}
                        onChange={setOStatus}
                        placeholder="All Status"
                    />
                    <FilterDropdown
                        value={oPayStatus}
                        options={PAYMENT_STATUSES}
                        onChange={setOPayStatus}
                        placeholder="Payment"
                    />
                </View>
            )}

            {/* Count */}
            <Text style={styles.countLabel}>{total} result{total !== 1 ? 's' : ''}</Text>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items as any[]}
                    keyExtractor={item => String(item.id)}
                    renderItem={isBookings ? renderBooking as any : renderOrder as any}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminColors.primary} />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? <ActivityIndicator size="small" color={adminColors.primary} style={{ marginVertical: 12 }} /> : null
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name={isBookings ? 'calendar-outline' : 'receipt-outline'} size={48} color={adminColors.textMuted} />
                            <Text style={styles.emptyText}>No {isBookings ? 'bookings' : 'orders'} found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: adminColors.background },
    header:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: adminColors.text },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },

    tabBar: {
        flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
        backgroundColor: adminColors.surface, borderRadius: 10, padding: 3,
        borderWidth: 1, borderColor: adminColors.border,
    },
    tabBtn:         { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    tabBtnActive:   { backgroundColor: adminColors.primary },
    tabBtnText:     { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary },
    tabBtnTextActive: { color: '#FFFFFF' },

    filters: {
        flexDirection: 'row', paddingHorizontal: 16, marginBottom: 6, gap: 8,
    },
    dateInput: {
        flex: 1.2, backgroundColor: adminColors.surface,
        borderWidth: 1, borderColor: adminColors.border, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 7, fontSize: 11, color: adminColors.text,
    },

    countLabel: {
        fontSize: 12, color: adminColors.textMuted,
        paddingHorizontal: 16, marginBottom: 6,
    },
    list: { paddingHorizontal: 16, paddingBottom: 20 },

    card: {
        backgroundColor: adminColors.surface, borderRadius: 12,
        borderWidth: 1, borderColor: adminColors.border,
        padding: 12, marginBottom: 10,
    },
    cardTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardId:        { fontSize: 13, fontWeight: '700', color: adminColors.textSecondary },
    badgeRow:      { flexDirection: 'row', gap: 4 },
    cardPrimary:   { fontSize: 15, fontWeight: '700', color: adminColors.text, marginBottom: 2 },
    cardSecondary: { fontSize: 13, color: adminColors.textSecondary, marginBottom: 4 },
    cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
    cardMeta:      { fontSize: 12, color: adminColors.textSecondary },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
    cardAmount:    { fontSize: 15, fontWeight: '700', color: adminColors.primary },
    cardDateSmall: { fontSize: 11, color: adminColors.textMuted },

    empty:     { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 15, color: adminColors.textSecondary, marginTop: 12 },
});
