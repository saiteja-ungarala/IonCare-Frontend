import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackScreenProps } from '../../models/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { paymentService } from '../../services/paymentService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// react-native-razorpay doesn't ship types; require to avoid TS errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RazorpayCheckout = require('react-native-razorpay').default ?? require('react-native-razorpay');

const TEAL = customerColors.primary;
const TEAL_DARK = customerColors.primaryDark;

type PaymentScreenProps = RootStackScreenProps<'PaymentScreen'>;

type PayState = 'idle' | 'creating_order' | 'processing' | 'verifying' | 'success' | 'error';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
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
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark-circle" size={80} color={TEAL} />
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
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="card" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        disabled={isBusy}
                    >
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Complete Payment</Text>
                        <Text style={styles.headerSubtitle}>Secure SSL Encrypted Transaction</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Amount Hero Card */}
                <View style={styles.amountHeroCard}>
                    <LinearGradient
                        colors={[customerColors.primary, customerColors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.amountHeroGradient}
                    >
                        <Text style={styles.amountHeroLabel}>Total Amount</Text>
                        <Text style={styles.amountHeroValue}>₹{amount.toLocaleString('en-IN')}</Text>
                        <View style={styles.amountHeroBadge}>
                            <Ionicons name="shield-checkmark" size={14} color={customerColors.primaryDark} />
                            <Text style={styles.amountHeroBadgeText}>Secured by Razorpay</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Order Details Card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsCardTitle}>Order Details</Text>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: TEAL + '15' }]}>
                            <Ionicons
                                name={entityType === 'booking' ? 'construct' : 'cube'}
                                size={22}
                                color={TEAL}
                            />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>
                                {entityType === 'booking' ? 'Service Booking' : 'Product Order'}
                            </Text>
                            <Text style={styles.detailValue} numberOfLines={2}>{description}</Text>
                        </View>
                    </View>

                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: '#F59E0B15' }]}>
                            <Ionicons name="receipt-outline" size={22} color="#F59E0B" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Amount</Text>
                            <Text style={styles.detailValue}>₹{amount.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>

                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: '#6366F115' }]}>
                            <Ionicons name="person-outline" size={22} color="#6366F1" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Customer</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{user?.name || 'You'}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment methods */}
                <View style={styles.methodsCard}>
                    <Text style={styles.methodsTitle}>Accepted Payment Methods</Text>
                    <View style={styles.methodsGrid}>
                        {[
                            { icon: 'phone-portrait-outline', label: 'UPI' },
                            { icon: 'card-outline', label: 'Cards' },
                            { icon: 'business-outline', label: 'Net Banking' },
                            { icon: 'wallet-outline', label: 'Wallets' },
                        ].map((method, i) => (
                            <View key={i} style={styles.methodItem}>
                                <View style={styles.methodIconWrap}>
                                    <Ionicons name={method.icon as any} size={20} color={TEAL} />
                                </View>
                                <Text style={styles.methodLabel}>{method.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Security info */}
                <View style={styles.securityRow}>
                    <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                    <Text style={styles.securityText}>256-bit SSL encrypted · PCI DSS compliant</Text>
                </View>
            </ScrollView>

            {/* Pay Now button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, isBusy && styles.payButtonDisabled]}
                    onPress={handlePayNow}
                    disabled={isBusy}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[customerColors.primary, customerColors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.payButtonGradient}
                    >
                        {isBusy ? (
                            <View style={styles.payButtonInner}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.payButtonText}>{getButtonLabel()}</Text>
                            </View>
                        ) : (
                            <View style={styles.payButtonInner}>
                                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                                <Text style={styles.payButtonText}>Pay Now — ₹{amount.toLocaleString('en-IN')}</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Retry modal */}
            <Modal visible={showRetryModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="close-circle" size={56} color={colors.error} />
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FA' },

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
        ...typography.headerTitle,
        color: colors.textOnPrimary,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },

    scrollView: { flex: 1 },
    scrollContent: { padding: spacing.lg },

    // Amount Hero
    amountHeroCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: spacing.md,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
    },
    amountHeroGradient: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    amountHeroLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    amountHeroValue: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1,
        marginBottom: spacing.md,
    },
    amountHeroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: 20,
    },
    amountHeroBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: customerColors.primaryDark,
    },

    // Details Card
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    detailsCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    detailIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#F0F3F5',
        marginVertical: spacing.md,
    },

    // Payment Methods
    methodsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    methodsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
    },
    methodsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    methodItem: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    methodIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: TEAL + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },

    // Security
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    securityText: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '500',
    },

    // Footer
    footer: {
        padding: spacing.lg,
        paddingBottom: Platform.OS === 'android' ? spacing.lg : spacing.xl,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F3F5',
    },
    payButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    payButtonDisabled: {
        opacity: 0.75,
    },
    payButtonGradient: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    payButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    payButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Success
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    successCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: TEAL + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    successSub: {
        fontSize: 15,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        ...shadows.lg,
    },
    modalIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 28,
        backgroundColor: colors.error + '12',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    modalMessage: {
        fontSize: 14,
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
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnOutline: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#F9FAFB',
    },
    modalBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
