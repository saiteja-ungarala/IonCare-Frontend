import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../theme/theme';

const BOOKING_REASONS = [
    'Found a better service provider',
    'Scheduled date/time no longer works',
    'Booked by mistake',
    'Service no longer needed',
    'Waiting too long for agent assignment',
    'Other',
];

const ORDER_REASONS = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Delivery time is too long',
    'Want to change the order',
    'Other',
];

const REFUND_TEXT: Record<'booking' | 'order', string> = {
    booking: 'If you have already paid, the amount will be refunded to your wallet.',
    order:   'If payment was made, the amount will be refunded to your wallet.',
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    type: 'booking' | 'order';
    loading: boolean;
}

export const CancelReasonModal: React.FC<Props> = ({ visible, onClose, onConfirm, type, loading }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [otherText, setOtherText] = useState('');

    const reasons = type === 'booking' ? BOOKING_REASONS : ORDER_REASONS;
    const entityLabel = type === 'booking' ? 'Booking' : 'Order';
    const effectiveReason = selectedReason === 'Other' ? otherText.trim() : selectedReason;
    const canConfirm =
        selectedReason !== '' &&
        (selectedReason !== 'Other' || otherText.trim().length >= 10);

    const handleClose = () => {
        setSelectedReason('');
        setOtherText('');
        onClose();
    };

    const handleConfirm = () => {
        if (!canConfirm || loading) return;
        onConfirm(effectiveReason);
    };

    // Reset internal state when modal closes
    const handleDismiss = () => {
        if (!visible) {
            setSelectedReason('');
            setOtherText('');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
            onDismiss={handleDismiss}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={styles.handle} />

                    <Text style={styles.title}>Why are you cancelling?</Text>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {reasons.map(reason => (
                            <TouchableOpacity
                                key={reason}
                                style={styles.reasonRow}
                                onPress={() => setSelectedReason(reason)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.radioOuter,
                                    selectedReason === reason && styles.radioSelected,
                                ]}>
                                    {selectedReason === reason && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[
                                    styles.reasonText,
                                    selectedReason === reason && styles.reasonTextSelected,
                                ]}>
                                    {reason}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* "Other" free-text input */}
                        {selectedReason === 'Other' && (
                            <View style={styles.otherWrap}>
                                <TextInput
                                    style={styles.otherInput}
                                    placeholder="Please tell us why... (min 10 characters)"
                                    placeholderTextColor={colors.textMuted}
                                    value={otherText}
                                    onChangeText={setOtherText}
                                    multiline
                                    maxLength={300}
                                    textAlignVertical="top"
                                />
                                <Text style={styles.otherCount}>{otherText.length}/300</Text>
                            </View>
                        )}

                        {/* Confirmation warning box — shown once a reason is selected */}
                        {selectedReason !== '' && (
                            <View style={styles.warningBox}>
                                <Ionicons name="warning-outline" size={20} color="#92400E" style={{ marginTop: 1 }} />
                                <View style={styles.warningContent}>
                                    <Text style={styles.warningTitle}>
                                        Are you sure you want to cancel?
                                    </Text>
                                    <Text style={styles.warningBody}>
                                        {REFUND_TEXT[type]}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Action buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.backBtnText}>Go Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                (!canConfirm || loading) && styles.confirmBtnDisabled,
                            ]}
                            onPress={handleConfirm}
                            disabled={!canConfirm || loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.confirmBtnText}>
                                    Yes, Cancel {entityLabel}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1, justifyContent: 'flex-end' },

    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },

    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
        maxHeight: '90%',
    },

    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        marginBottom: spacing.lg,
    },

    title: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.lg,
    },

    reasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    radioSelected: { borderColor: colors.primary },
    radioInner: {
        width: 11,
        height: 11,
        borderRadius: 5.5,
        backgroundColor: colors.primary,
    },

    reasonText: {
        ...typography.body,
        color: colors.textSecondary,
        flex: 1,
    },
    reasonTextSelected: { color: colors.text, fontWeight: '600' },

    otherWrap: {
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    otherInput: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        minHeight: 90,
        ...typography.body,
        color: colors.text,
        backgroundColor: colors.background,
    },
    otherCount: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'right',
        marginTop: 4,
    },

    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: '#FEF3C7',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    warningContent: { flex: 1 },
    warningTitle: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 4,
    },
    warningBody: {
        ...typography.bodySmall,
        color: '#92400E',
        lineHeight: 20,
    },

    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },

    backBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '600',
    },

    confirmBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDisabled: { backgroundColor: colors.textMuted },
    confirmBtnText: {
        ...typography.body,
        color: '#fff',
        fontWeight: '700',
    },
});
