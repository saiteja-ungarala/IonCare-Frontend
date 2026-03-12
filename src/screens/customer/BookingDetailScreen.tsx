import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps, Booking, BookingUpdate, BookingUpdateType } from '../../models/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { bookingService } from '../../services/bookingService';
import { CancelReasonModal } from '../../components/CancelReasonModal';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = RootStackScreenProps<'BookingDetail'>;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: '#9CA3AF' },
    confirmed: { label: 'Confirmed', color: colors.info },
    assigned: { label: 'Assigned', color: '#F97316' },
    in_progress: { label: 'In Progress', color: '#EAB308' },
    completed: { label: 'Completed', color: colors.success },
    cancelled: { label: 'Cancelled', color: colors.error },
};

const UPDATE_ICONS: Record<BookingUpdateType, keyof typeof Ionicons.glyphMap> = {
    arrived: 'location',
    diagnosed: 'search',
    in_progress: 'construct',
    completed: 'checkmark-circle',
    photo: 'camera',
    note: 'document-text',
};

const UPDATE_LABELS: Record<BookingUpdateType, string> = {
    arrived: 'Technician Arrived',
    diagnosed: 'Diagnosed',
    in_progress: 'Work In Progress',
    completed: 'Job Completed',
    photo: 'Photo Added',
    note: 'Note',
};

const UPDATE_COLORS: Record<BookingUpdateType, string> = {
    arrived: '#F97316',
    diagnosed: colors.info,
    in_progress: '#EAB308',
    completed: colors.success,
    photo: colors.primary,
    note: '#9CA3AF',
};

const formatDate = (d: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
};

const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleString('en-IN', {
            day: 'numeric', month: 'short',
            hour: 'numeric', minute: '2-digit',
        });
    } catch { return ts; }
};

export const BookingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { bookingId } = route.params;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [updates, setUpdates] = useState<BookingUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [photoModal, setPhotoModal] = useState<string | null>(null);
    const [cancelModal, setCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchAll = useCallback(async () => {
        const [b, u] = await Promise.all([
            bookingService.getBookingById(bookingId),
            bookingService.getBookingUpdates(bookingId),
        ]);
        setBooking(b);
        setUpdates(u);
    }, [bookingId]);

    const load = useCallback(async () => {
        setLoading(true);
        await fetchAll();
        setLoading(false);
    }, [fetchAll]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    }, [fetchAll]);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 30s while not in a terminal state
    useEffect(() => {
        if (booking?.status === 'completed' || booking?.status === 'cancelled') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(fetchAll, 30_000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [booking?.status, fetchAll]);

    const handleCancelConfirm = async (reason: string) => {
        if (!booking) return;
        setCancelling(true);
        try {
            const result = await bookingService.cancelBooking(booking.id, reason);
            setCancelModal(false);
            // Re-fetch so status reflects cancelled
            await fetchAll();
            const message = result.refunded && result.refund_amount > 0
                ? `Your booking has been cancelled and ₹${result.refund_amount} has been refunded to your wallet.`
                : 'Your booking has been cancelled successfully.';
            Alert.alert('Booking Cancelled', message, [{ text: 'OK' }]);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to cancel booking. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed';
    const statusCfg = STATUS_CONFIG[booking?.status ?? ''] ?? { label: booking?.status ?? '', color: '#9CA3AF' };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Detail</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Detail</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
                    <Text style={styles.emptyText}>Booking not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking #{booking.id}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Status badge */}
                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                        <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                </View>

                {/* Service info card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Details</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="construct-outline" size={18} color={colors.primary} />
                        <Text style={styles.infoText}>{booking.service?.name || 'Service'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.infoText}>
                            {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                        </Text>
                    </View>
                    {booking.address?.line1 ? (
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                            <Text style={styles.infoText}>
                                {booking.address.line1}, {booking.address.city}
                            </Text>
                        </View>
                    ) : null}
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Amount</Text>
                        <Text style={styles.amountValue}>₹{booking.totalAmount}</Text>
                    </View>
                </View>

                {/* Agent card */}
                {booking.agent?.name ? (
                    <View style={[styles.card, styles.agentCard]}>
                        <View style={styles.agentRow}>
                            <View style={styles.agentAvatar}>
                                <Ionicons name="person" size={22} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.agentName}>{booking.agent.name}</Text>
                                {booking.agent.phone ? (
                                    <Text style={styles.agentPhone}>{booking.agent.phone}</Text>
                                ) : null}
                            </View>
                            <View style={[styles.assignedBadge, { backgroundColor: '#F97316' + '18' }]}>
                                <Text style={[styles.assignedText, { color: '#F97316' }]}>Assigned</Text>
                            </View>
                        </View>
                    </View>
                ) : null}

                {/* Service Updates timeline */}
                <Text style={styles.sectionTitle}>Service Updates</Text>

                {updates.length === 0 ? (
                    <View style={styles.emptyUpdates}>
                        <Ionicons name="time-outline" size={40} color={colors.textMuted} />
                        <Text style={styles.emptyUpdatesText}>No updates yet.</Text>
                        <Text style={styles.emptyUpdatesSub}>Updates will appear here once the technician starts.</Text>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {updates.map((upd, idx) => {
                            const type = upd.update_type as BookingUpdateType;
                            const icon = UPDATE_ICONS[type] ?? 'ellipse-outline';
                            const label = UPDATE_LABELS[type] ?? type;
                            const tintColor = UPDATE_COLORS[type] ?? colors.textMuted;
                            const isLast = idx === updates.length - 1;

                            return (
                                <View key={upd.id} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, { backgroundColor: tintColor }]}>
                                            <Ionicons name={icon} size={14} color="#fff" />
                                        </View>
                                        {!isLast && <View style={styles.timelineLine} />}
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.updateLabel, { color: tintColor }]}>{label}</Text>
                                        {upd.note ? <Text style={styles.updateNote}>{upd.note}</Text> : null}
                                        {upd.media_url ? (
                                            <TouchableOpacity onPress={() => setPhotoModal(upd.media_url)}>
                                                <Image source={{ uri: upd.media_url }} style={styles.photoThumb} />
                                            </TouchableOpacity>
                                        ) : null}
                                        <Text style={styles.updateTimestamp}>{formatTimestamp(upd.created_at)}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Cancel button — only for pending / confirmed */}
                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setCancelModal(true)}
                    >
                        <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                        <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Cancel reason modal (shared component) */}
            <CancelReasonModal
                visible={cancelModal}
                type="booking"
                loading={cancelling}
                onClose={() => setCancelModal(false)}
                onConfirm={handleCancelConfirm}
            />

            {/* Fullscreen photo modal */}
            <Modal visible={!!photoModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.photoModal}
                    activeOpacity={1}
                    onPress={() => setPhotoModal(null)}
                >
                    {photoModal ? (
                        <Image
                            source={{ uri: photoModal }}
                            style={styles.photoFull}
                            resizeMode="contain"
                        />
                    ) : null}
                    <TouchableOpacity style={styles.photoClose} onPress={() => setPhotoModal(null)}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        ...shadows.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...typography.h2, color: colors.text },

    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

    statusRow: { alignItems: 'flex-start', marginBottom: spacing.lg },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { ...typography.bodySmall, fontWeight: '700' },

    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
        gap: spacing.sm,
    },
    cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    infoText: { ...typography.body, color: colors.textSecondary, flex: 1 },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    amountLabel: { ...typography.bodySmall, color: colors.textSecondary },
    amountValue: { ...typography.h3, color: colors.primary, fontWeight: '700' },

    agentCard: { backgroundColor: colors.primaryLight },
    agentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    agentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    agentName: { ...typography.body, fontWeight: '700', color: colors.text },
    agentPhone: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    assignedBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
    },
    assignedText: { ...typography.caption, fontWeight: '700' },

    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },

    emptyUpdates: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
    emptyUpdatesText: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
    emptyUpdatesSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

    timeline: { gap: 0 },
    timelineItem: { flexDirection: 'row', gap: spacing.md },
    timelineLeft: { alignItems: 'center', width: 32 },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
    timelineContent: {
        flex: 1,
        paddingBottom: spacing.xl,
        gap: spacing.xs,
    },
    updateLabel: { ...typography.body, fontWeight: '700' },
    updateNote: { ...typography.bodySmall, color: colors.textSecondary },
    updateTimestamp: { ...typography.caption, color: colors.textMuted },
    photoThumb: {
        width: 120,
        height: 80,
        borderRadius: borderRadius.sm,
        marginTop: spacing.xs,
        backgroundColor: colors.surface2,
    },

    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.error,
        backgroundColor: colors.error + '0D',
    },
    cancelBtnText: { ...typography.body, color: colors.error, fontWeight: '700' },

    photoModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoFull: { width: '100%', height: '80%' },
    photoClose: {
        position: 'absolute',
        top: 52,
        right: spacing.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
