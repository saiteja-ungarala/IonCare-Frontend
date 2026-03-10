import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { adminColors } from '../../theme/adminTheme';
import { getOrderDetail, updateOrderStatus } from '../../services/adminService';

const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api').replace(/\/api$/, '');

type RouteParams = { orderId: number };

type OrderItem = {
    id: number;
    product_name: string;
    product_image_url: string | null;
    qty: number;
    unit_price: number;
    line_total: number;
};

type OrderDetail = {
    id: number;
    status: string;
    payment_status: string;
    total_amount: number;
    subtotal: number;
    delivery_fee: number;
    discount: number;
    created_at: string;
    customer: { id: number; name: string; phone: string; email: string };
    address: { address_line1: string; city: string; state: string; pincode: string } | null;
    items: OrderItem[];
    payment: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        amount: number;
        status: string;
    } | null;
};

const ORDER_TRANSITIONS: Record<string, string[]> = {
    paid:    ['packed', 'cancelled'],
    packed:  ['shipped', 'cancelled'],
    shipped: ['delivered'],
};

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    paid:      { bg: 'rgba(37,99,235,0.15)',   text: '#1D4ED8' },
    packed:    { bg: 'rgba(109,40,217,0.15)',  text: '#6D28D9' },
    shipped:   { bg: 'rgba(8,145,178,0.15)',   text: '#0E7490' },
    delivered: { bg: 'rgba(22,163,74,0.15)',   text: '#15803D' },
    cancelled: { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' },
};

const PAY_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    paid:    { bg: 'rgba(22,163,74,0.15)',  text: '#15803D' },
    pending: { bg: 'rgba(245,158,11,0.15)', text: '#B45309' },
    failed:  { bg: 'rgba(239,68,68,0.15)', text: '#DC2626' },
};

function formatDate(str: string | null): string {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } as any);
}

function formatRupees(amount: number | null | undefined): string {
    if (amount == null) return '—';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function StatusBadge({ status, colorMap }: { status: string; colorMap: Record<string, { bg: string; text: string }> }) {
    const c = colorMap[status] ?? { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return <View style={[badgeStyles.badge, { backgroundColor: c.bg }]}><Text style={[badgeStyles.text, { color: c.text }]}>{label}</Text></View>;
}
const badgeStyles = StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    text:  { fontSize: 12, fontWeight: '700' },
});

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={infoStyles.row}>
            <Ionicons name={icon as any} size={14} color={adminColors.textMuted} style={infoStyles.icon} />
            <Text style={infoStyles.label}>{label}</Text>
            <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
        </View>
    );
}
const infoStyles = StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
    icon:  { marginTop: 1, width: 16 },
    label: { width: 80, fontSize: 12, color: adminColors.textMuted },
    value: { flex: 1, fontSize: 14, color: adminColors.text, fontWeight: '500' },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={secStyles.section}>
            <Text style={secStyles.title}>{title}</Text>
            {children}
        </View>
    );
}
const secStyles = StyleSheet.create({
    section: {
        backgroundColor: adminColors.surface, borderRadius: 14,
        borderWidth: 1, borderColor: adminColors.border,
        padding: 14, marginBottom: 12,
    },
    title: {
        fontSize: 12, fontWeight: '700', color: adminColors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
    },
});

function useToast() {
    const [visible, setVisible] = useState(false);
    const [msg, setMsg]         = useState('');
    const show = (message: string) => {
        setMsg(message); setVisible(true);
        setTimeout(() => setVisible(false), 1800);
    };
    return { visible, msg, show };
}

export default function AdminOrderDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { orderId } = route.params as RouteParams;
    const toast = useToast();

    const [detail,     setDetail]     = useState<OrderDetail | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [updating,   setUpdating]   = useState(false);
    const [nextStatus, setNextStatus] = useState<string>('');
    const [dropOpen,   setDropOpen]   = useState(false);

    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getOrderDetail(orderId);
            setDetail(data);
            // Pre-select first valid transition
            const transitions = ORDER_TRANSITIONS[data?.status] ?? [];
            setNextStatus(transitions[0] ?? '');
        } catch (e) {
            Alert.alert('Error', 'Failed to load order detail.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useFocusEffect(useCallback(() => { loadDetail(); }, [loadDetail]));

    const handleUpdateStatus = async () => {
        if (!nextStatus) return;
        Alert.alert(
            'Update Order Status',
            `Change status to "${nextStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await updateOrderStatus(orderId, nextStatus);
                            toast.show('Status updated!');
                            setTimeout(loadDetail, 1000);
                        } catch (e: any) {
                            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update status.');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}><ActivityIndicator size="large" color={adminColors.primary} /></View>
            </SafeAreaView>
        );
    }
    if (!detail) return null;

    const transitions  = ORDER_TRANSITIONS[detail.status] ?? [];
    const hasTransition = transitions.length > 0;
    const addressStr = detail.address
        ? [detail.address.address_line1, detail.address.city, detail.address.state, detail.address.pincode].filter(Boolean).join(', ')
        : '—';

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={adminColors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{detail.id}</Text>
                <View style={styles.badgeRow}>
                    <StatusBadge status={detail.status}         colorMap={ORDER_STATUS_COLORS} />
                    <StatusBadge status={detail.payment_status} colorMap={PAY_STATUS_COLORS} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Customer ─────────────────────────────────────────────── */}
                <Section title="Customer">
                    <InfoRow icon="person-outline" label="Name"  value={detail.customer.name} />
                    <InfoRow icon="call-outline"   label="Phone" value={detail.customer.phone || '—'} />
                    <InfoRow icon="mail-outline"   label="Email" value={detail.customer.email} />
                </Section>

                {/* ── Delivery address ─────────────────────────────────────── */}
                <Section title="Delivery Address">
                    <InfoRow icon="location-outline" label="Address" value={addressStr} />
                </Section>

                {/* ── Order items ──────────────────────────────────────────── */}
                <Section title={`Items (${detail.items?.length ?? 0})`}>
                    {(detail.items ?? []).map(item => (
                        <View key={item.id} style={styles.itemRow}>
                            {item.product_image_url ? (
                                <Image
                                    source={{ uri: SERVER_BASE + item.product_image_url }}
                                    style={styles.itemThumb}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                                    <Ionicons name="cube-outline" size={20} color={adminColors.textMuted} />
                                </View>
                            )}
                            <View style={styles.itemBody}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                                <Text style={styles.itemMeta}>
                                    {formatRupees(item.unit_price)} × {item.qty}
                                </Text>
                            </View>
                            <Text style={styles.itemTotal}>{formatRupees(item.line_total)}</Text>
                        </View>
                    ))}
                </Section>

                {/* ── Price summary ─────────────────────────────────────────── */}
                <Section title="Price Summary">
                    <PriceRow label="Subtotal"     value={formatRupees(detail.subtotal)} />
                    <PriceRow label="Delivery Fee" value={formatRupees(detail.delivery_fee)} />
                    {detail.discount > 0 && (
                        <PriceRow label="Discount" value={`-${formatRupees(detail.discount)}`} color={adminColors.success} />
                    )}
                    <View style={styles.totalDivider} />
                    <PriceRow label="Total" value={formatRupees(detail.total_amount)} bold />
                </Section>

                {/* ── Payment info ──────────────────────────────────────────── */}
                {detail.payment && (
                    <Section title="Payment">
                        <InfoRow icon="card-outline"    label="Status"     value={(detail.payment.status || '—').replace(/\b\w/g, l => l.toUpperCase())} />
                        <InfoRow icon="receipt-outline" label="Order ID"   value={detail.payment.razorpay_order_id || '—'} />
                        <InfoRow icon="cash-outline"    label="Payment ID" value={detail.payment.razorpay_payment_id || '—'} />
                        <InfoRow icon="pricetag-outline" label="Amount"    value={formatRupees(detail.payment.amount)} />
                    </Section>
                )}

                {/* ── Status update ─────────────────────────────────────────── */}
                {hasTransition && (
                    <Section title="Update Status">
                        <Text style={styles.transitionHint}>
                            Current: <Text style={{ fontWeight: '700', color: adminColors.text }}>
                                {detail.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                        </Text>

                        {/* Next status dropdown */}
                        <TouchableOpacity style={styles.statusDropBtn} onPress={() => setDropOpen(true)}>
                            <Text style={styles.statusDropText}>
                                {nextStatus
                                    ? nextStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                    : 'Select next status'
                                }
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={adminColors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.updateBtn, (!nextStatus || updating) && { opacity: 0.5 }]}
                            onPress={handleUpdateStatus}
                            disabled={!nextStatus || updating}
                        >
                            {updating
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <>
                                    <Ionicons name="refresh-outline" size={16} color="#FFF" />
                                    <Text style={styles.updateBtnText}>Update Status</Text>
                                  </>
                            }
                        </TouchableOpacity>
                    </Section>
                )}

                {!hasTransition && (
                    <View style={styles.terminalNote}>
                        <Ionicons name="checkmark-circle" size={16} color={adminColors.textMuted} />
                        <Text style={styles.terminalText}>
                            Order is {detail.status} — no further status updates available
                        </Text>
                    </View>
                )}

            </ScrollView>

            {/* Status transition dropdown modal */}
            <Modal visible={dropOpen} transparent animationType="fade" onRequestClose={() => setDropOpen(false)}>
                <TouchableOpacity style={styles.dropOverlay} activeOpacity={1} onPress={() => setDropOpen(false)}>
                    <View style={styles.dropList}>
                        <Text style={styles.dropTitle}>Select Next Status</Text>
                        {transitions.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.dropOption, t === nextStatus && styles.dropOptionActive]}
                                onPress={() => { setNextStatus(t); setDropOpen(false); }}
                            >
                                <Text style={[styles.dropOptionText, t === nextStatus && styles.dropOptionTextActive]}>
                                    {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                                {t === nextStatus && <Ionicons name="checkmark" size={16} color={adminColors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {toast.visible && (
                <View style={styles.toast}><Text style={styles.toastText}>{toast.msg}</Text></View>
            )}
        </SafeAreaView>
    );
}

function PriceRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
    return (
        <View style={priceStyles.row}>
            <Text style={[priceStyles.label, bold && priceStyles.bold]}>{label}</Text>
            <Text style={[priceStyles.value, bold && priceStyles.bold, color ? { color } : {}]}>{value}</Text>
        </View>
    );
}
const priceStyles = StyleSheet.create({
    row:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { fontSize: 14, color: adminColors.textSecondary },
    value: { fontSize: 14, color: adminColors.text },
    bold:  { fontWeight: '700', fontSize: 15, color: adminColors.text },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll:    { padding: 16, paddingBottom: 60 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: adminColors.surface,
        borderBottomWidth: 1, borderBottomColor: adminColors.border, gap: 8,
    },
    backBtn:     { padding: 4 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: adminColors.text },
    badgeRow:    { flexDirection: 'row', gap: 6 },

    // Item row
    itemRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: adminColors.border,
    },
    itemThumb: {
        width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
        backgroundColor: adminColors.backgroundAlt,
    },
    itemThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    itemBody:    { flex: 1 },
    itemName:    { fontSize: 14, fontWeight: '600', color: adminColors.text, marginBottom: 2 },
    itemMeta:    { fontSize: 12, color: adminColors.textSecondary },
    itemTotal:   { fontSize: 14, fontWeight: '700', color: adminColors.primary },

    // Price summary
    totalDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: 8 },

    // Status update
    transitionHint:  { fontSize: 13, color: adminColors.textSecondary, marginBottom: 10 },
    statusDropBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: adminColors.backgroundAlt,
        borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10,
    },
    statusDropText: { fontSize: 15, color: adminColors.text, fontWeight: '500' },
    updateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: adminColors.primary,
        paddingVertical: 12, borderRadius: 10, gap: 8,
    },
    updateBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    terminalNote: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 4, marginBottom: 12,
    },
    terminalText: { fontSize: 13, color: adminColors.textMuted, flex: 1 },

    // Dropdown modal
    dropOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: 40 },
    dropList:        { backgroundColor: adminColors.surface, borderRadius: 14, overflow: 'hidden', paddingBottom: 8 },
    dropTitle: {
        fontSize: 14, fontWeight: '700', color: adminColors.textSecondary,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: adminColors.border,
    },
    dropOption:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
    dropOptionActive:   { backgroundColor: adminColors.primaryLight },
    dropOptionText:     { fontSize: 15, color: adminColors.text },
    dropOptionTextActive: { fontWeight: '700', color: adminColors.primary },

    toast: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        backgroundColor: adminColors.success,
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, elevation: 10,
    },
    toastText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
