// Bookings Screen — Premium design with status-colored cards & Amazon-style cancel flow

import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    Platform,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useBookingsStore } from '../../store';
import { Booking } from '../../models/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BookingsScreenProps = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any, any>;
};

const CANCEL_REASONS = [
    'Schedule conflict — I am not available at the booked time',
    'Found a better price elsewhere',
    'Booked by mistake',
    'Service is no longer needed',
    'Want to change the service date/time',
    'Taking too long to assign a technician',
    'Other reason',
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return '#16A34A';
        case 'cancelled': return '#EF4444';
        case 'in_progress': case 'assigned': return '#F59E0B';
        default: return customerColors.primary;
    }
};

const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
        case 'completed': return 'checkmark-circle';
        case 'cancelled': return 'close-circle';
        case 'in_progress': return 'refresh-circle';
        case 'assigned': return 'person-circle';
        case 'confirmed': return 'shield-checkmark';
        default: return 'time';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'pending': return 'Pending';
        case 'confirmed': return 'Confirmed';
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return status;
    }
};

export const BookingsScreen: React.FC<BookingsScreenProps> = ({ navigation, route }) => {
    const { bookings, isLoading, fetchBookings, cancelBooking } = useBookingsStore();
    const [activeTab, setActiveTab] = React.useState<'active' | 'completed' | 'cancelled'>('active');
    const [refreshing, setRefreshing] = React.useState(false);

    // Cancel flow state
    const [cancelStep, setCancelStep] = React.useState<'hidden' | 'select_reason' | 'confirm' | 'processing' | 'success' | 'error'>('hidden');
    const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(null);
    const [selectedReason, setSelectedReason] = React.useState<string | null>(null);
    const [otherReason, setOtherReason] = React.useState('');
    const [cancelError, setCancelError] = React.useState('');

    const loadBookings = useCallback(() => {
        fetchBookings(activeTab);
    }, [activeTab, fetchBookings]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBookings(activeTab);
        setRefreshing(false);
    }, [activeTab, fetchBookings]);

    // ── Cancel flow handlers ────────────────────────────────────────
    const handleCancel = (booking: Booking) => {
        setBookingToCancel(booking);
        setSelectedReason(null);
        setOtherReason('');
        setCancelError('');
        setCancelStep('select_reason');
    };

    const handleReasonSelected = () => {
        setCancelStep('confirm');
    };

    const getFinalReason = (): string => {
        if (selectedReason === 'Other reason') {
            return otherReason.trim() || 'Other reason';
        }
        return selectedReason || '';
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        const reason = getFinalReason();
        if (!reason) return;

        setCancelStep('processing');
        try {
            await cancelBooking(bookingToCancel.id, reason);
            setCancelStep('success');
            setTimeout(() => {
                setCancelStep('hidden');
                setBookingToCancel(null);
                fetchBookings(activeTab);
            }, 2200);
        } catch (e: any) {
            setCancelError(e?.message || 'Failed to cancel booking. Please try again.');
            setCancelStep('error');
        }
    };

    const closeCancelFlow = () => {
        setCancelStep('hidden');
        setBookingToCancel(null);
    };

    // ── Date/Time formatters ────────────────────────────────────────
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    // ── Booking Card ────────────────────────────────────────────────
    const renderBookingCard = (booking: Booking) => {
        const canCancel = activeTab === 'active' && (booking.status === 'pending' || booking.status === 'confirmed');
        const statusColor = getStatusColor(booking.status);

        return (
            <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('BookingDetail', { bookingId: Number(booking.id) })}
            >
                {/* Status gradient top bar */}
                <View style={[styles.cardTopBar, { backgroundColor: statusColor }]} />

                <View style={styles.cardInner}>
                    <View style={styles.bookingHeader}>
                        <Text style={styles.bookingId}>#{booking.id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Ionicons name={getStatusIcon(booking.status)} size={14} color={statusColor} />
                            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(booking.status)}</Text>
                        </View>
                    </View>

                    <Text style={styles.serviceName} numberOfLines={1}>{booking.service?.name || 'Service'}</Text>

                    <View style={styles.bookingRow}>
                        <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                        <Text style={styles.bookingInfo} numberOfLines={1}>
                            {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                        </Text>
                    </View>

                    {booking.address?.city ? (
                        <View style={styles.bookingRow}>
                            <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
                            <Text style={styles.bookingInfo} numberOfLines={1}>
                                {booking.address.line1}, {booking.address.city}
                            </Text>
                        </View>
                    ) : null}

                    {booking.technician?.name ? (
                        <View style={styles.agentBlock}>
                            <View style={styles.bookingRow}>
                                <Ionicons name="person-circle-outline" size={15} color={customerColors.primary} />
                                <Text style={styles.agentName} numberOfLines={1}>Technician: {booking.technician.name}</Text>
                            </View>
                            {booking.technician.phone ? (
                                <View style={styles.bookingRow}>
                                    <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.bookingInfo} numberOfLines={1}>{booking.technician.phone}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    <View style={styles.bookingFooter}>
                        <Text style={styles.bookingPrice}>₹{booking.totalAmount}</Text>
                        {canCancel && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking)}>
                                <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const TABS = ['active', 'completed', 'cancelled'] as const;

    // ── Cancel Reason Picker Modal ─────────────────────────────────
    const renderCancelModal = () => {
        const isReasonStep = cancelStep === 'select_reason';
        const isConfirmStep = cancelStep === 'confirm';
        const isProcessing = cancelStep === 'processing';
        const isSuccess = cancelStep === 'success';
        const isError = cancelStep === 'error';
        const isVisible = cancelStep !== 'hidden';

        const isOtherSelected = selectedReason === 'Other reason';
        const canProceed = selectedReason && (!isOtherSelected || otherReason.trim().length > 0);

        return (
            <Modal transparent visible={isVisible} animationType="slide" onRequestClose={closeCancelFlow}>
                <View style={styles.modalOverlay}>
                    <View style={styles.cancelModal}>
                        {/* ── Processing state ── */}
                        {isProcessing && (
                            <View style={styles.cancelStateContainer}>
                                <ActivityIndicator size="large" color={customerColors.primary} />
                                <Text style={styles.cancelStateTitle}>Cancelling your booking...</Text>
                                <Text style={styles.cancelStateDesc}>Please wait while we process your request.</Text>
                            </View>
                        )}

                        {/* ── Success state ── */}
                        {isSuccess && (
                            <View style={styles.cancelStateContainer}>
                                <View style={styles.successCircle}>
                                    <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
                                </View>
                                <Text style={[styles.cancelStateTitle, { color: '#16A34A' }]}>Booking Cancelled</Text>
                                <Text style={styles.cancelStateDesc}>
                                    Your booking has been cancelled successfully. Any payment will be refunded to your wallet.
                                </Text>
                            </View>
                        )}

                        {/* ── Error state ── */}
                        {isError && (
                            <View style={styles.cancelStateContainer}>
                                <View style={[styles.successCircle, { backgroundColor: '#FEE2E2' }]}>
                                    <Ionicons name="close-circle" size={64} color="#EF4444" />
                                </View>
                                <Text style={[styles.cancelStateTitle, { color: '#EF4444' }]}>Cancellation Failed</Text>
                                <Text style={styles.cancelStateDesc}>{cancelError}</Text>
                                <View style={styles.errorActions}>
                                    <TouchableOpacity style={styles.errorBtnOutline} onPress={closeCancelFlow}>
                                        <Text style={styles.errorBtnOutlineText}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.errorBtnRetry} onPress={() => setCancelStep('select_reason')}>
                                        <Text style={styles.errorBtnRetryText}>Try Again</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* ── Step 1: Select Reason ── */}
                        {isReasonStep && (
                            <>
                                <View style={styles.cancelModalHeader}>
                                    <View style={styles.cancelModalDragHandle} />
                                    <View style={styles.cancelModalTitleRow}>
                                        <View style={styles.cancelIconWrap}>
                                            <Ionicons name="help-circle" size={24} color={colors.error} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cancelModalTitle}>Why are you cancelling?</Text>
                                            <Text style={styles.cancelModalSubtitle}>
                                                {bookingToCancel?.service?.name} — #{bookingToCancel?.id}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={closeCancelFlow} style={styles.closeBtn}>
                                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                                    {CANCEL_REASONS.map((reason) => {
                                        const isSelected = selectedReason === reason;
                                        return (
                                            <TouchableOpacity
                                                key={reason}
                                                style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                                                onPress={() => setSelectedReason(reason)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                                    {isSelected && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                                                    {reason}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {isOtherSelected && (
                                        <View style={styles.otherInputWrap}>
                                            <TextInput
                                                style={styles.otherInput}
                                                placeholder="Please describe your reason..."
                                                placeholderTextColor={colors.textMuted}
                                                value={otherReason}
                                                onChangeText={setOtherReason}
                                                multiline
                                                maxLength={200}
                                                textAlignVertical="top"
                                            />
                                            <Text style={styles.charCount}>{otherReason.length}/200</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={[styles.cancelModalFooter, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
                                    <TouchableOpacity style={styles.keepBtn} onPress={closeCancelFlow}>
                                        <Text style={styles.keepBtnText}>Keep Booking</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.continueBtn, !canProceed && styles.continueBtnDisabled]}
                                        onPress={handleReasonSelected}
                                        disabled={!canProceed}
                                    >
                                        <Text style={styles.continueBtnText}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── Step 2: Confirm ── */}
                        {isConfirmStep && (
                            <View style={styles.confirmContainer}>
                                <View style={styles.confirmIconWrap}>
                                    <Ionicons name="warning" size={40} color="#F59E0B" />
                                </View>
                                <Text style={styles.confirmTitle}>Confirm Cancellation</Text>
                                <Text style={styles.confirmDesc}>
                                    Are you sure you want to cancel your booking for{' '}
                                    <Text style={{ fontWeight: '700' }}>{bookingToCancel?.service?.name}</Text>?
                                </Text>

                                <View style={styles.confirmReasonCard}>
                                    <Text style={styles.confirmReasonLabel}>Reason</Text>
                                    <Text style={styles.confirmReasonValue}>{getFinalReason()}</Text>
                                </View>

                                <View style={styles.confirmNotice}>
                                    <Ionicons name="information-circle" size={18} color={customerColors.primary} />
                                    <Text style={styles.confirmNoticeText}>
                                        If you've already paid, the amount will be refunded to your IONORA CARE wallet.
                                    </Text>
                                </View>

                                <View style={styles.confirmActions}>
                                    <TouchableOpacity style={styles.confirmBackBtn} onPress={() => setCancelStep('select_reason')}>
                                        <Ionicons name="chevron-back" size={20} color={colors.text} />
                                        <Text style={styles.confirmBackText}>Go Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmCancelBtn} onPress={confirmCancel}>
                                        <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                                        <Text style={styles.confirmCancelText}>Yes, Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={customerColors.primary} />
            {/* Gradient Header */}
            <LinearGradient
                colors={['#A7F3D0', customerColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientHeader, { paddingTop: insets.top + spacing.md }]}
            >
                {/* Background Decor */}
                <Ionicons name="calendar" size={100} color="rgba(255,255,255,0.08)" style={styles.headerBgDecor} />

                <View style={styles.headerTopRow}>
                    {route.params?.enableBack && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>My Bookings</Text>
                        <Text style={styles.headerSubtitle}>Track your service appointments</Text>
                    </View>
                </View>

                {/* Tabs inside the gradient */}
                <View style={styles.tabPillRow}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={customerColors.primary} />
                </View>
            ) : bookings.length === 0 ? (
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[customerColors.primary]} tintColor={customerColors.primary} />}
                >
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="calendar-outline" size={56} color={customerColors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
                    <Text style={styles.emptyDesc}>
                        {activeTab === 'active' ? 'Book a service to get started' : `No ${activeTab} bookings yet`}
                    </Text>
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[customerColors.primary]} tintColor={customerColors.primary} />}
                >
                    {bookings.map(renderBookingCard)}
                    <View style={{ height: spacing.lg }} />
                </ScrollView>
            )}

            {renderCancelModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FA' },
    gradientHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    headerBgDecor: {
        position: 'absolute',
        right: -15,
        top: 10,
        transform: [{ rotate: '-15deg' }],
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
        marginLeft: -spacing.sm,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        ...typography.headerTitle,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    tabPillRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 3,
    },

    tab: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    activeTabText: {
        color: customerColors.primary,
    },
    scrollView: { flex: 1, padding: spacing.md },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    bookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTopBar: {
        height: 3,
        width: '100%',
    },
    cardInner: {
        padding: spacing.md,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    bookingId: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs + 2,
        marginBottom: 4,
    },
    bookingInfo: {
        fontSize: 13,
        color: colors.textSecondary,
        flex: 1,
        fontWeight: '500',
    },
    agentBlock: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        borderRadius: 12,
        backgroundColor: customerColors.primaryLight,
    },
    agentName: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
        flex: 1,
    },
    bookingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F0F3F5',
    },
    bookingPrice: {
        fontSize: 17,
        fontWeight: '700',
        color: customerColors.primary,
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.error + '10',
    },
    cancelText: {
        fontSize: 13,
        color: colors.error,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    emptyIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 32,
        backgroundColor: customerColors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.lg,
    },
    emptyDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },

    // ── Cancel Modal ─────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    cancelModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '88%',
        ...shadows.lg,
    },
    cancelModalHeader: {
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F5',
    },
    cancelModalDragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    cancelModalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    cancelIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    cancelModalSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Reason list
    reasonsList: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        maxHeight: 340,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 14,
        marginBottom: spacing.sm,
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#F0F3F5',
    },
    reasonItemSelected: {
        backgroundColor: '#FFF7ED',
        borderColor: '#F59E0B',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    radioOuterSelected: {
        borderColor: '#F59E0B',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F59E0B',
    },
    reasonText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
        lineHeight: 20,
    },
    reasonTextSelected: {
        fontWeight: '600',
        color: '#92400E',
    },
    otherInputWrap: {
        marginBottom: spacing.md,
    },
    otherInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: spacing.md,
        fontSize: 14,
        color: colors.text,
        minHeight: 80,
        fontWeight: '500',
    },
    charCount: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'right',
        marginTop: 4,
    },

    // Footer
    cancelModalFooter: {
        flexDirection: 'row',
        padding: spacing.lg,

        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F0F3F5',
    },
    keepBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    keepBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    continueBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.error,
    },
    continueBtnDisabled: {
        opacity: 0.4,
    },
    continueBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Confirm step
    confirmContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    confirmIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    confirmDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    confirmReasonCard: {
        width: '100%',
        backgroundColor: '#FFF7ED',
        borderRadius: 14,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    confirmReasonLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    confirmReasonValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#78350F',
        lineHeight: 20,
    },
    confirmNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        backgroundColor: customerColors.primaryLight,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
        width: '100%',
    },
    confirmNoticeText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
        lineHeight: 20,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    confirmBackBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
    },
    confirmBackText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    confirmCancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.error,
    },
    confirmCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // State containers (processing, success, error)
    cancelStateContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        minHeight: 280,
        justifyContent: 'center',
    },
    cancelStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
    cancelStateDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
        lineHeight: 22,
    },
    successCircle: {
        width: 96,
        height: 96,
        borderRadius: 32,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
        width: '100%',
    },
    errorBtnOutline: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    errorBtnOutlineText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    errorBtnRetry: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.error,
    },
    errorBtnRetryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
