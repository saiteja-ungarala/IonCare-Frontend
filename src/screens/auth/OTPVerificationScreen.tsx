import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ImageBackground,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { RootStackParamList } from '../../models/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OTPVerification'>;
    route: RouteProp<RootStackParamList, 'OTPVerification'>;
};

const OTP_LENGTH = 6;
const RESEND_DELAY = 30;

export const OTPVerificationScreen: React.FC<Props> = ({ route, navigation }) => {
    const { phone } = route.params;
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
    const [canResend, setCanResend] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    const { verifyOTP, requestOTP, isLoading, selectedRole, setShowLoginCelebration } = useAuthStore();

    const activeThemeColor =
        selectedRole === 'agent' ? colors.accent :
            selectedRole === 'dealer' ? colors.info :
                customerColors.primary;

    const isAgent = selectedRole === 'agent';
    const isCustomLogin = selectedRole === 'customer' || selectedRole === 'agent' || selectedRole === 'dealer';

    const getBackgroundImage = () => {
        if (selectedRole === 'customer') return require('../../../assets/customer-login.png');
        if (selectedRole === 'agent') return require('../../../assets/technicain-login.jpg');
        if (selectedRole === 'dealer') return require('../../../assets/dealer-login.png');
        return undefined;
    };

    // Auto-focus first box on mount
    useEffect(() => {
        const t = setTimeout(() => inputRefs.current[0]?.focus(), 200);
        return () => clearTimeout(t);
    }, []);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer <= 0) {
            setCanResend(true);
            return;
        }
        const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    const submitOtp = async (otp: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setOtpError('');
        const role = selectedRole || 'customer';
        const success = await verifyOTP(phone, otp, role);
        setIsSubmitting(false);
        if (success) {
            setShowLoginCelebration(true);
        } else {
            const err = useAuthStore.getState().errorMessage || 'Invalid OTP. Please try again.';
            setOtpError(err);
            setDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    };

    const handleChange = (text: string, index: number) => {
        const cleaned = text.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = cleaned;
        setDigits(newDigits);
        setOtpError('');
        setResendMessage('');

        if (cleaned && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (cleaned && index === OTP_LENGTH - 1) {
            const otp = newDigits.join('');
            submitOtp(otp);
        }
    };

    const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            const newDigits = [...digits];
            newDigits[index - 1] = '';
            setDigits(newDigits);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = async () => {
        if (!canResend || isLoading) return;
        setResendMessage('');
        setOtpError('');
        const success = await requestOTP(phone);
        if (success) {
            setResendTimer(RESEND_DELAY);
            setCanResend(false);
            setResendMessage('OTP resent successfully');
            setDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    };

    const Wrapper = (isCustomLogin ? ImageBackground : View) as React.ComponentType<any>;
    const wrapperProps = isCustomLogin
        ? { source: getBackgroundImage(), style: styles.backgroundImage, resizeMode: 'cover' as const }
        : { style: styles.container };

    const isBusy = isLoading || isSubmitting;

    return (
        <Wrapper {...wrapperProps}>
            {isCustomLogin && <View style={styles.overlay} />}
            <SafeAreaView style={isCustomLogin ? styles.safeArea : styles.container}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={[styles.backButton, isCustomLogin && styles.glassButton]}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="chevron-back" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <View style={[styles.content, isCustomLogin && styles.bottomContent]}>
                            <View style={isCustomLogin ? styles.glassContent : undefined}>
                                <Text style={[styles.title, isAgent ? { color: colors.surface } : null]}>
                                    Verify Your Number
                                </Text>
                                <Text style={[styles.subtitle, isAgent ? { color: 'rgba(255,255,255,0.8)' } : null]}>
                                    Enter the 6-digit OTP sent to{' '}
                                    <Text style={[styles.phoneHighlight, { color: activeThemeColor }]}>
                                        +91 {phone}
                                    </Text>
                                </Text>

                                {/* OTP boxes */}
                                <View style={styles.otpRow}>
                                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                                        <TextInput
                                            key={i}
                                            ref={(ref) => { inputRefs.current[i] = ref; }}
                                            style={[
                                                styles.otpBox,
                                                digits[i] ? { borderColor: activeThemeColor } : undefined,
                                                otpError ? { borderColor: colors.error } : undefined,
                                                isCustomLogin ? styles.otpBoxGlass : undefined,
                                            ]}
                                            value={digits[i]}
                                            onChangeText={(text) => handleChange(text, i)}
                                            onKeyPress={(e) => handleKeyPress(e, i)}
                                            keyboardType="numeric"
                                            maxLength={2}
                                            textAlign="center"
                                            selectTextOnFocus
                                            editable={!isBusy}
                                        />
                                    ))}
                                </View>

                                {/* Error */}
                                {otpError ? (
                                    <Text style={styles.otpError}>{otpError}</Text>
                                ) : null}

                                {/* Resend success */}
                                {resendMessage ? (
                                    <Text style={[styles.resendSuccess, { color: activeThemeColor }]}>
                                        {resendMessage}
                                    </Text>
                                ) : null}

                                {/* Loading indicator */}
                                {isBusy && (
                                    <ActivityIndicator
                                        style={styles.loader}
                                        color={activeThemeColor}
                                        size="small"
                                    />
                                )}

                                {/* Resend button */}
                                <View style={styles.resendRow}>
                                    <Text style={[styles.resendLabel, isAgent ? { color: 'rgba(255,255,255,0.7)' } : null]}>
                                        Didn't receive the code?{' '}
                                    </Text>
                                    <TouchableOpacity onPress={handleResend} disabled={!canResend || isBusy}>
                                        <Text style={[
                                            styles.resendBtn,
                                            { color: canResend ? activeThemeColor : colors.textMuted },
                                        ]}>
                                            {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -spacing.sm,
    },
    glassButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
    },
    bottomContent: {
        justifyContent: 'flex-end',
        paddingBottom: spacing.xxl,
    },
    glassContent: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        ...shadows.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    title: {
        ...typography.title,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    phoneHighlight: {
        fontWeight: '700',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    otpBox: {
        width: 45,
        height: 55,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface,
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    otpBoxGlass: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderColor: 'rgba(255,255,255,0.5)',
    },
    otpError: {
        ...typography.caption,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    resendSuccess: {
        ...typography.caption,
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    loader: {
        marginVertical: spacing.md,
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        flexWrap: 'wrap',
    },
    resendLabel: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    resendBtn: {
        ...typography.bodySmall,
        fontWeight: '700',
    },
});
