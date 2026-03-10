import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { adminColors } from '../../theme/adminTheme';
import { assignBooking, cancelBooking, getBookingDetail } from '../../services/adminService';

type RouteParams = { bookingId: number };

type Update = {
    id: number;
    update_type: string;
    note: string | null;
    media_url: string | null;
    agent_name: string | null;
    created_at: string;
};

type BookingDetail = {
    id: number;
    status: string;
    scheduled_at: string;
    total_amount: number;
    payment_status: string;
    razorpay_order_id: string | null;
    customer: { id: number; name: string; phone: string; email: string };
    service: { id: number; name: string };
    agent: { id: number; name: string; phone: string } | null;
    address: { address_line1: string; city: string; state: string; pincode: string } | null;
    updates: Update[];
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending:     { bg: 'rgba(245,158,11,0.15)',  text: '#B45309' },
    confirmed:   { bg: 'rgba(37,99,235,0.15)',   text: '#1D4ED8' },
    assigned:    { bg: 'rgba(109,40,217,0.15)',  text: '#6D28D9' },
    in_progress: { bg: 'rgba(8,145,178,0.15)',   text: '#0E7490' },
    completed:   { bg: 'rgba(22,163,74,0.15)',   text: '#15803D' },
    cancelled:   { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' },
};

const UPDATE_TYPE_ICONS: Record<string, string> = {
    started:   'play-circle-outline',
    arrived:   'location-outline',
    completed: 'checkmark-circle-outline',
    photo:     'camera-outline',
    note:      'document-text-outline',
};

function formatDateTime(str: string | null): string {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(str: string | null): string {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupees(amount: number | null): string {
    if (amount == null) return '—';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function useToast() {
    const [visible, setVisible] = useState(false);
    const [msg, setMsg]         = useState('');
    const show = (message: string) => {
        setMsg(message); setVisible(true);
        setTimeout(() => setVisible(false), 1800);
    };
    return { visible, msg, show };
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={infoRowStyles.row}>
            <Ionicons name={icon as any} size={15} color={adminColors.textMuted} style={infoRowStyles.icon} />
            <Text style={infoRowStyles.label}>{label}</Text>
            <Text style={infoRowStyles.value} numberOfLines={2}>{value}</Text>
        </View>
    );
}
const infoRowStyles = StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
    icon:  { marginTop: 1, width: 18 },
    label: { width: 80, fontSize: 12, color: adminColors.textMuted },
    value: { flex: 1, fontSize: 14, color: adminColors.text, fontWeight: '500' },
});

export default function AdminBookingDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { bookingId } = route.params as RouteParams;
    const toast = useToast();

    const [detail,       setDetail]       = useState<BookingDetail | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [actionBusy,   setActionBusy]   = useState(false);

    // Assign agent
    const [agentInput,     setAgentInput]     = useState('');
    const [showAssignInput, setShowAssignInput] = useState(false);

    // Cancel
    const [showCancelInput, setShowCancelInput] = useState(false);
    const [cancelReason,    setCancelReason]    = useState('');

    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getBookingDetail(bookingId);
            setDetail(data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load booking detail.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useFocusEffect(useCallback(() => { loadDetail(); }, [loadDetail]));

    const handleAssign = async () => {
        const agentId = parseInt(agentInput.trim(), 10);
        if (!agentInput.trim() || isNaN(agentId)) {
            Alert.alert('Validation', 'Please enter a valid agent ID.');
            return;
        }
        setActionBusy(true);
        try {
            await assignBooking(bookingId, agentId);
            toast.show('Agent assigned!');
            setShowAssignInput(false);
            setAgentInput('');
            setTimeout(loadDetail, 1000);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to assign agent.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert('Required', 'Please enter a reason to cancel the booking.');
            return;
        }
        setActionBusy(true);
        try {
            await cancelBooking(bookingId, cancelReason.trim());
            toast.show('Booking cancelled.');
            setTimeout(() => navigation.goBack(), 1800);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to cancel booking.');
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}><ActivityIndicator size="large" color={adminColors.primary} /></View>
            </SafeAreaView>
        );
    }
    if (!detail) return null;

    const { status } = detail;
    const chip = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
    const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const canAssign = (status === 'pending' || status === 'confirmed') && !detail.agent;
    const canCancel = status !== 'completed' && status !== 'cancelled';
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
                <Text style={styles.headerTitle}>Booking #{detail.id}</Text>
                <View style={[styles.headerChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.headerChipText, { color: chip.text }]}>{statusLabel}</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Customer ─────────────────────────────────────────── */}
                    <Section title="Customer">
                        <InfoRow icon="person-outline"  label="Name"  value={detail.customer.name} />
                        <InfoRow icon="call-outline"    label="Phone" value={detail.customer.phone || '—'} />
                        <InfoRow icon="mail-outline"    label="Email" value={detail.customer.email} />
                    </Section>

                    {/* ── Service ──────────────────────────────────────────── */}
                    <Section title="Service">
                        <InfoRow icon="construct-outline"  label="Service"   value={detail.service.name} />
                        <InfoRow icon="calendar-outline"   label="Scheduled" value={formatDateTime(detail.scheduled_at)} />
                        <InfoRow icon="location-outline"   label="Address"   value={addressStr} />
                    </Section>

                    {/* ── Agent ────────────────────────────────────────────── */}
                    <Section title="Agent">
                        {detail.agent ? (
                            <>
                                <InfoRow icon="person-circle-outline" label="Name"  value={detail.agent.name} />
                                <InfoRow icon="call-outline"          label="Phone" value={detail.agent.phone || '—'} />
                                <InfoRow icon="id-card-outline"       label="ID"    value={String(detail.agent.id)} />
                            </>
                        ) : (
                            <Text style={styles.unassigned}>Not assigned yet</Text>
                        )}

                        {/* Assign button */}
                        {canAssign && !showAssignInput && (
                            <TouchableOpacity style={styles.assignBtn} onPress={() => setShowAssignInput(true)}>
                                <Ionicons name="person-add-outline" size={16} color={adminColors.primary} />
                                <Text style={styles.assignBtnText}>Assign Agent</Text>
                            </TouchableOpacity>
                        )}
                        {showAssignInput && (
                            <View style={styles.assignBox}>
                                <Text style={styles.assignLabel}>Agent ID</Text>
                                <TextInput
                                    style={styles.assignInput}
                                    value={agentInput}
                                    onChangeText={setAgentInput}
                                    placeholder="Enter agent user ID"
                                    placeholderTextColor={adminColors.textLight}
                                    keyboardType="numeric"
                                />
                                <View style={styles.assignBtns}>
                                    <TouchableOpacity
                                        style={styles.assignCancelBtn}
                                        onPress={() => { setShowAssignInput(false); setAgentInput(''); }}
                                    >
                                        <Text style={styles.assignCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.assignConfirmBtn, actionBusy && { opacity: 0.6 }]}
                                        onPress={handleAssign}
                                        disabled={actionBusy}
                                    >
                                        {actionBusy
                                            ? <ActivityIndicator size="small" color="#FFF" />
                                            : <Text style={styles.assignConfirmText}>Assign</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </Section>

                    {/* ── Payment ──────────────────────────────────────────── */}
                    <Section title="Payment">
                        <InfoRow icon="cash-outline"    label="Amount"         value={formatRupees(detail.total_amount)} />
                        <InfoRow icon="card-outline"    label="Payment Status" value={(detail.payment_status || '—').replace(/\b\w/g, l => l.toUpperCase())} />
                        {detail.razorpay_order_id && (
                            <InfoRow icon="receipt-outline" label="Order ID" value={detail.razorpay_order_id} />
                        )}
                    </Section>

                    {/* ── Updates timeline ─────────────────────────────────── */}
                    {detail.updates && detail.updates.length > 0 && (
                        <Section title={`Updates (${detail.updates.length})`}>
                            {detail.updates.map((upd, idx) => (
                                <View key={upd.id} style={styles.timelineItem}>
                                    <View style={styles.timelineDot}>
                                        <Ionicons
                                            name={(UPDATE_TYPE_ICONS[upd.update_type] ?? 'ellipse-outline') as any}
                                            size={16}
                                            color={adminColors.primary}
                                        />
                                    </View>
                                    {idx < detail.updates.length - 1 && <View style={styles.timelineLine} />}
                                    <View style={styles.timelineBody}>
                                        <Text style={styles.timelineType}>
                                            {upd.update_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Text>
                                        {upd.note && <Text style={styles.timelineNote}>{upd.note}</Text>}
                                        <Text style={styles.timelineMeta}>
                                            {upd.agent_name ? `${upd.agent_name}  ·  ` : ''}{formatDateTime(upd.created_at)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </Section>
                    )}

                    {/* ── Cancel action ────────────────────────────────────── */}
                    {canCancel && (
                        <Section title="Admin Actions">
                            {!showCancelInput ? (
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowCancelInput(true)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.cancelBox}>
                                    <Text style={styles.cancelLabel}>
                                        Cancellation Reason <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={styles.cancelInput}
                                        value={cancelReason}
                                        onChangeText={setCancelReason}
                                        placeholder="Enter reason for cancellation..."
                                        placeholderTextColor={adminColors.textLight}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                    <View style={styles.cancelBtns}>
                                        <TouchableOpacity
                                            style={styles.cancelBackBtn}
                                            onPress={() => { setShowCancelInput(false); setCancelReason(''); }}
                                        >
                                            <Text style={styles.cancelBackText}>Back</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.cancelConfirmBtn, actionBusy && { opacity: 0.6 }]}
                                            onPress={handleCancel}
                                            disabled={actionBusy}
                                        >
                                            {actionBusy
                                                ? <ActivityIndicator size="small" color="#FFF" />
                                                : <Text style={styles.cancelConfirmText}>Confirm Cancel</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </Section>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {toast.visible && (
                <View style={styles.toast}><Text style={styles.toastText}>{toast.msg}</Text></View>
            )}
        </SafeAreaView>
    );
}

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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll:    { padding: 16, paddingBottom: 60 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: adminColors.surface,
        borderBottomWidth: 1, borderBottomColor: adminColors.border, gap: 10,
    },
    backBtn:        { padding: 4 },
    headerTitle:    { flex: 1, fontSize: 17, fontWeight: '700', color: adminColors.text },
    headerChip:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    headerChipText: { fontSize: 12, fontWeight: '700' },

    unassigned: { fontSize: 14, color: '#F59E0B', fontWeight: '600', marginBottom: 8 },

    // Assign
    assignBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1.5, borderColor: adminColors.primary,
        borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14,
        marginTop: 4, alignSelf: 'flex-start',
    },
    assignBtnText:    { fontSize: 14, fontWeight: '600', color: adminColors.primary },
    assignBox: {
        backgroundColor: adminColors.backgroundAlt,
        borderRadius: 10, borderWidth: 1, borderColor: adminColors.border,
        padding: 12, marginTop: 4,
    },
    assignLabel:      { fontSize: 12, fontWeight: '600', color: adminColors.textSecondary, marginBottom: 8 },
    assignInput: {
        backgroundColor: adminColors.surface, borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9,
        fontSize: 14, color: adminColors.text, marginBottom: 10,
    },
    assignBtns:       { flexDirection: 'row', gap: 8 },
    assignCancelBtn: {
        flex: 1, paddingVertical: 9, borderRadius: 8,
        borderWidth: 1, borderColor: adminColors.border, alignItems: 'center',
    },
    assignCancelText: { fontSize: 13, color: adminColors.textSecondary, fontWeight: '600' },
    assignConfirmBtn: {
        flex: 2, paddingVertical: 9, borderRadius: 8,
        backgroundColor: adminColors.primary, alignItems: 'center',
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    assignConfirmText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    // Timeline
    timelineItem:  { flexDirection: 'row', marginBottom: 14 },
    timelineDot: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: adminColors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10, flexShrink: 0,
    },
    timelineLine: {
        position: 'absolute', left: 15, top: 34,
        width: 2, height: '100%', backgroundColor: adminColors.border,
    },
    timelineBody:  { flex: 1, paddingTop: 4 },
    timelineType:  { fontSize: 14, fontWeight: '700', color: adminColors.text },
    timelineNote:  { fontSize: 13, color: adminColors.textSecondary, marginTop: 2 },
    timelineMeta:  { fontSize: 11, color: adminColors.textMuted, marginTop: 3 },

    // Cancel
    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: adminColors.error,
        paddingVertical: 13, borderRadius: 10, gap: 8,
    },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    cancelBox: {
        backgroundColor: adminColors.backgroundAlt,
        borderRadius: 10, borderWidth: 1, borderColor: adminColors.border, padding: 12,
    },
    cancelLabel: { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary, marginBottom: 8 },
    required:    { color: adminColors.error },
    cancelInput: {
        backgroundColor: adminColors.surface, borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 8, padding: 10, fontSize: 14, color: adminColors.text,
        minHeight: 80, marginBottom: 12,
    },
    cancelBtns:       { flexDirection: 'row', gap: 8 },
    cancelBackBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: adminColors.border, alignItems: 'center',
    },
    cancelBackText:    { fontSize: 13, color: adminColors.textSecondary, fontWeight: '600' },
    cancelConfirmBtn: {
        flex: 2, paddingVertical: 10, borderRadius: 8,
        backgroundColor: adminColors.error, alignItems: 'center',
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    cancelConfirmText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    toast: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        backgroundColor: adminColors.success,
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, elevation: 10,
    },
    toastText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
