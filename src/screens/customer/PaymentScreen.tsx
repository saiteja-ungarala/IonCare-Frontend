import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../models/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuthStore } from '../../store';
import { paymentService } from '../../services/paymentService';

// react-native-razorpay doesn't ship types; require to avoid TS errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RazorpayCheckout = require('react-native-razorpay').default ?? require('react-native-razorpay');

const TEAL = '#14B8A6';

type PaymentScreenProps = RootStackScreenProps<'PaymentScreen'>;

type PayState = 'idle' | 'creating_order' | 'processing' | 'verifying' | 'success' | 'error';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
    const { amount, entityType, entityId, description } = route.params;
    const user = useAuthStore((s) => s.user);

    const [payState, setPayState] = useState<PayState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [showRetryModal, setShowRetryModal] = useState(false);

    const isBusy = payState === 'creating_order' || payState === 'processing' || payState === 'verifying';

    const getButtonLabel = () => {
        if (payState === 'creating_order') return 'Preparing order...';
        if (payState === 'processing') return 'Opening checkout...';
        if (payState === 'verifying') return 'Confirming payment...';
        return `Pay Now — ₹${amount}`;
    };

    const handlePayNow = async () => {
        if (isBusy) return;
        setErrorMsg('');
        setShowRetryModal(false);

        // Step A: create Razorpay order on backend
        setPayState('creating_order');
        let order;
        try {
            order = await paymentService.createOrder(amount, entityType, entityId);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Could not initiate payment';
            setErrorMsg(msg);
            setPayState('error');
            setShowRetryModal(true);
            return;
        }

        // Step B: open Razorpay SDK
        setPayState('processing');
        const options = {
            key: order.key,
            order_id: order.razorpay_order_id,
            amount: amount * 100,          // paise
            currency: order.currency || 'INR',
            name: 'AquaCare',
            description,
            prefill: {
                name: user?.name ?? '',
                email: user?.email ?? '',
                contact: user?.phone ?? '',
            },
            theme: { color: TEAL },
        };

        try {
            const paymentData = await RazorpayCheckout.open(options);

            // Step C: verify on backend
            setPayState('verifying');
            await paymentService.verifyPayment(
                paymentData.razorpay_order_id,
                paymentData.razorpay_payment_id,
                paymentData.razorpay_signature
            );

            setPayState('success');
            setTimeout(() => {
                if (entityType === 'booking') {
                    navigation.navigate('CustomerTabs');
                } else {
                    navigation.navigate('OrderHistory');
                }
            }, 2000);
        } catch (err: any) {
            // Step D: failed or cancelled
            const description: string =
                err?.description ??
                err?.response?.data?.message ??
                err?.message ??
                'Payment was not completed';

            // Razorpay cancellation has code 0 or description "Cancelled by user"
            const isCancelled = err?.code === 0 || String(description).toLowerCase().includes('cancel');
            setErrorMsg(isCancelled ? 'Payment cancelled.' : description);
            setPayState('error');
            setShowRetryModal(true);
        }
    };

    // ── Success view ──────────────────────────────────────────────
    if (payState === 'success') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={[styles.successIcon, { backgroundColor: TEAL + '20' }]}>
                        <Ionicons name="checkmark-circle" size={72} color={TEAL} />
                    </View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSub}>
                        {entityType === 'booking'
                            ? 'Your booking is confirmed. We\'ll find a technician shortly.'
                            : 'Your order has been placed successfully.'}
                    </Text>
                    <ActivityIndicator color={TEAL} style={{ marginTop: spacing.xl }} />
                </View>
            </SafeAreaView>
        );
    }

    // ── Main view ─────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    disabled={isBusy}
                >
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Complete Payment</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Payment card */}
                <View style={styles.card}>
                    <View style={styles.cardIconRow}>
                        <View style={[styles.cardIcon, { backgroundColor: TEAL + '18' }]}>
                            <Ionicons
                                name={entityType === 'booking' ? 'construct' : 'cube'}
                                size={28}
                                color={TEAL}
                            />
                        </View>
                        <View style={styles.cardEntityBadge}>
                            <Text style={[styles.cardEntityText, { color: TEAL }]}>
                                {entityType === 'booking' ? 'Service Booking' : 'Product Order'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.cardDescription}>{description}</Text>

                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Amount to Pay</Text>
                        <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                        <Text style={styles.infoText}>Secured by Razorpay · 256-bit SSL</Text>
                    </View>
                </View>

                {/* Payment methods badge */}
                <View style={styles.methodsRow}>
                    <Ionicons name="card-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.methodsText}>
                        UPI · Cards · Net Banking · Wallets accepted
                    </Text>
                </View>
            </View>

            {/* Pay Now button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, isBusy && styles.payButtonDisabled]}
                    onPress={handlePayNow}
                    disabled={isBusy}
                    activeOpacity={0.85}
                >
                    {isBusy ? (
                        <View style={styles.payButtonInner}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.payButtonText}>{getButtonLabel()}</Text>
                        </View>
                    ) : (
                        <Text style={styles.payButtonText}>Pay Now — ₹{amount.toLocaleString('en-IN')}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Retry modal */}
            <Modal visible={showRetryModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="close-circle" size={48} color={colors.error} />
                        </View>
                        <Text style={styles.modalTitle}>Payment Failed</Text>
                        <Text style={styles.modalMessage}>
                            {errorMsg || 'Something went wrong. Would you like to try again?'}
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnOutline]}
                                onPress={() => {
                                    setShowRetryModal(false);
                                    navigation.goBack();
                                }}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: TEAL }]}
                                onPress={() => {
                                    setShowRetryModal(false);
                                    setPayState('idle');
                                    handlePayNow();
                                }}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
    },

    content: {
        flex: 1,
        padding: spacing.lg,
    },

    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.md,
        marginBottom: spacing.lg,
    },
    cardIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    cardIcon: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardEntityBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: TEAL + '12',
        borderRadius: borderRadius.full,
    },
    cardEntityText: {
        ...typography.caption,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardDescription: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.lg,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    amountLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    infoText: {
        ...typography.caption,
        color: colors.textMuted,
    },

    methodsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        justifyContent: 'center',
    },
    methodsText: {
        ...typography.caption,
        color: colors.textMuted,
    },

    footer: {
        padding: spacing.lg,
        paddingBottom: Platform.OS === 'android' ? spacing.lg : spacing.xl,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    payButton: {
        backgroundColor: TEAL,
        borderRadius: borderRadius.lg,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
        shadowColor: TEAL,
    },
    payButtonDisabled: {
        opacity: 0.75,
    },
    payButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    payButtonText: {
        ...typography.button,
        color: '#fff',
        fontSize: 17,
    },

    // Success
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    successTitle: {
        ...typography.h1,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    successSub: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        alignItems: 'center',
        ...shadows.lg,
    },
    modalIconWrap: { marginBottom: spacing.md },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    modalMessage: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnOutline: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    modalBtnText: {
        ...typography.body,
        fontWeight: '700',
    },
});
