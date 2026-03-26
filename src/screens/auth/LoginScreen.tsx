// Login Screen - Modern Viral India Aesthetic
// Clean, minimal, high contrast

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { AuthErrorBanner, Button, Input } from '../../components';
import { isValidEmail } from '../../utils/errorMapper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isValidIndianMobile, normalizePhoneInput } from '../../utils/phoneValidator';

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

const blurWebActiveElement = () => {
    if (Platform.OS !== 'web') {
        return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur?.();
};

const navigateWithBlur = (callback: () => void) => {
    blurWebActiveElement();
    callback();
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
    const {
        login,
        startLoginOtp,
        isLoading,
        selectedRole,
        setShowLoginCelebration,
        errorMessage,
        fieldErrors,
        clearError,
        clearFieldError,
    } = useAuthStore();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const dismissErrorBanner = () => {
        setLocalErrorMessage(null);
        clearError();
    };

    const clearFieldState = (field: string) => {
        if (localErrorMessage) {
            setLocalErrorMessage(null);
        }
        if (errorMessage) {
            clearError();
        }
        if (fieldErrors[field]) {
            clearFieldError(field);
        }
        if (clientFieldErrors[field]) {
            setClientFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const getRoleLabel = () => {
        switch (selectedRole) {
            case 'customer':
                return 'Customer & Referrals';
            case 'technician':
                return 'Technician';
            case 'dealer':
                return 'Dealer';
            default:
                return 'User';
        }
    };

    const validateLogin = (): boolean => {
        const nextFieldErrors: Record<string, string> = {};

        if (!email.trim()) {
            nextFieldErrors.email = 'Email is required';
        } else if (!isValidEmail(email.trim())) {
            nextFieldErrors.email = 'Enter a valid email address';
        }

        if (!password) {
            nextFieldErrors.password = 'Password is required';
        } else if (password.length < 6) {
            nextFieldErrors.password = 'Password must be at least 6 characters';
        }

        setClientFieldErrors(nextFieldErrors);
        return Object.keys(nextFieldErrors).length === 0;
    };

    const shouldHideBannerForInlineErrors = Boolean(
        clientFieldErrors.email ||
        clientFieldErrors.password ||
        fieldErrors.email ||
        fieldErrors.password,
    );

    const handleLogin = async () => {
        setLocalErrorMessage(null);
        clearError();

        if (!validateLogin()) {
            return;
        }

        if (!selectedRole) {
            setLocalErrorMessage('Please select a role first.');
            navigation.goBack();
            return;
        }

        const success = await login({
            email: email.trim(),
            password,
            role: selectedRole,
        });

        if (success) {
            setShowLoginCelebration(true);
        }
    };

    const handleSendOtp = async () => {
        setLocalErrorMessage(null);
        setPhoneError('');
        clearError();

        if (!isValidIndianMobile(phone)) {
            setPhoneError('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
            return;
        }

        if (!selectedRole) {
            setLocalErrorMessage('Please select a role first.');
            navigation.goBack();
            return;
        }

        const otpSession = await startLoginOtp(phone, selectedRole);
        if (otpSession) {
            blurWebActiveElement();
            navigation.navigate('OTPVerification', { otpSession });
        }
    };

    const handleOtpLogin = async () => {
        setLocalErrorMessage(null);
        clearError();

        if (!selectedRole) {
            setLocalErrorMessage('Please select a role first.');
            navigation.goBack();
            return;
        }

        setActiveTab('phone');
        setLocalErrorMessage('Enter your registered mobile number. We will send the OTP to the email linked with that number.');
    };

    const isCustomLogin = selectedRole === 'customer' || selectedRole === 'technician' || selectedRole === 'dealer';
    const isTechnician = selectedRole === 'technician';
    const Wrapper = (isCustomLogin ? ImageBackground : View) as React.ComponentType<any>;

    const getBackgroundImage = () => {
        if (selectedRole === 'customer') return require('../../../assets/customer-login.png');
        if (selectedRole === 'technician') return require('../../../assets/technicain-login.jpg');
        if (selectedRole === 'dealer') return require('../../../assets/dealer-login.png');
        return undefined;
    };

    const activeThemeColor = selectedRole === 'technician' ? colors.accent : (selectedRole === 'dealer' ? colors.info : customerColors.primary);

    const wrapperProps = isCustomLogin
        ? { source: getBackgroundImage(), style: styles.backgroundImage, resizeMode: 'cover' as const }
        : { style: styles.container };

    return (
        <Wrapper {...wrapperProps}>
            {isCustomLogin && (
                <View style={styles.overlay} />
            )}
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
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={[styles.backButton, isCustomLogin && styles.glassButton]}
                                onPress={() => navigateWithBlur(() => navigation.goBack())}
                            >
                                <Ionicons name="chevron-back" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[
                            styles.content,
                            isCustomLogin && styles.bottomContent,
                        ]}>
                            <View style={isCustomLogin ? styles.glassContent : undefined}>
                                <Text style={[styles.title, isTechnician ? { color: colors.surface } : null]}>Welcome Back</Text>
                                <Text style={[styles.subtitle, isTechnician ? { color: 'rgba(255, 255, 255, 0.8)' } : null]}>
                                    Login as <Text style={[styles.roleText, { color: activeThemeColor }]}>{getRoleLabel()}</Text>
                                </Text>

                                {/* Tab toggle */}
                                <View style={[styles.tabToggle, isTechnician ? styles.tabToggleDark : undefined]}>
                                    <TouchableOpacity
                                        style={[styles.tabBtn, activeTab === 'email' && { backgroundColor: activeThemeColor }]}
                                        onPress={() => { setActiveTab('email'); setPhoneError(''); clearError(); }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.tabBtnText, activeTab === 'email' && styles.tabBtnTextActive]}>
                                            Email Login
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tabBtn, activeTab === 'phone' && { backgroundColor: activeThemeColor }]}
                                        onPress={() => { setActiveTab('phone'); clearError(); }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.tabBtnText, activeTab === 'phone' && styles.tabBtnTextActive]}>
                                            Phone Login
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.form}>
                                    <AuthErrorBanner
                                        message={localErrorMessage || (shouldHideBannerForInlineErrors ? null : errorMessage)}
                                        onClose={dismissErrorBanner}
                                    />

                                    {/* ── Phone Login Tab ── */}
                                    {activeTab === 'phone' && (
                                        <View>
                                            <Input
                                                label="Phone Number"
                                                placeholder="Enter 10-digit mobile number"
                                                value={phone}
                                                onChangeText={(val) => {
                                                    setPhone(normalizePhoneInput(val));
                                                    if (phoneError) setPhoneError('');
                                                    if (errorMessage) clearError();
                                                }}
                                                keyboardType="numeric"
                                                maxLength={10}
                                                leftIcon="phone-portrait-outline"
                                                inputContainerStyle={isCustomLogin ? styles.transparentInput : undefined}
                                                labelStyle={isTechnician ? { color: colors.surface } : undefined}
                                                placeholderTextColor={isTechnician ? 'rgba(255, 255, 255, 0.6)' : undefined}
                                            />
                                            {phoneError ? (
                                                <Text style={styles.phoneError}>{phoneError}</Text>
                                            ) : null}
                                            <Text style={[styles.helperText, isTechnician ? styles.helperTextLight : null]}>
                                                OTP will be delivered to the registered email linked to this mobile number.
                                            </Text>
                                            <Button
                                                title="Send OTP to Email"
                                                onPress={handleSendOtp}
                                                loading={isLoading}
                                                fullWidth
                                                style={{ backgroundColor: activeThemeColor, shadowColor: activeThemeColor, marginTop: spacing.xl }}
                                            />
                                        </View>
                                    )}

                                    {/* ── Email Login Tab ── */}
                                    {activeTab === 'email' && <>

                                        <Input
                                            label="Email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChangeText={(value) => {
                                                setEmail(value);
                                                clearFieldState('email');
                                            }}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            leftIcon="mail-outline"
                                            inputContainerStyle={isCustomLogin ? styles.transparentInput : undefined}
                                            labelStyle={isTechnician ? { color: colors.surface } : undefined}
                                            placeholderTextColor={isTechnician ? 'rgba(255, 255, 255, 0.6)' : undefined}
                                            error={clientFieldErrors.email || fieldErrors.email}
                                        />

                                        <Input
                                            label="Password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChangeText={(value) => {
                                                setPassword(value);
                                                clearFieldState('password');
                                            }}
                                            secureTextEntry
                                            leftIcon="lock-closed-outline"
                                            inputContainerStyle={isCustomLogin ? styles.transparentInput : undefined}
                                            labelStyle={isTechnician ? { color: colors.surface } : undefined}
                                            placeholderTextColor={isTechnician ? 'rgba(255, 255, 255, 0.6)' : undefined}
                                            error={clientFieldErrors.password || fieldErrors.password}
                                        />

                                        <TouchableOpacity
                                            style={styles.forgotPassword}
                                            onPress={() => navigateWithBlur(() => navigation.navigate('ForgotPassword'))}
                                        >
                                            <Text style={[styles.forgotPasswordText, { color: activeThemeColor }]}>Forgot Password?</Text>
                                        </TouchableOpacity>

                                        <Button
                                            title="Login"
                                            onPress={handleLogin}
                                            loading={isLoading}
                                            fullWidth
                                            style={{ backgroundColor: activeThemeColor, shadowColor: activeThemeColor }}
                                        />

                                        <View style={styles.divider}>
                                            <View style={styles.dividerLine} />
                                            <Text style={styles.dividerText}>or</Text>
                                            <View style={styles.dividerLine} />
                                        </View>

                                        <Button
                                            title="Login with OTP"
                                            onPress={handleOtpLogin}
                                            variant="outline"
                                            fullWidth
                                            disabled={isLoading}
                                            icon={<Ionicons name="phone-portrait" size={18} color={activeThemeColor} />}
                                            style={{ borderColor: activeThemeColor }}
                                            textStyle={{ color: activeThemeColor }}
                                        />
                                    </>}
                                </View>

                                <View style={styles.footer}>
                                    <View style={styles.footerRow}>
                                        <Text style={styles.footerText}>Don't have an account? </Text>
                                        <TouchableOpacity onPress={() => navigateWithBlur(() => navigation.navigate('Signup'))}>
                                            <Text style={[styles.footerLink, { color: activeThemeColor }]}>Sign Up</Text>
                                        </TouchableOpacity>
                                    </View>
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
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
    roleText: {
        color: colors.primary,
        fontWeight: '700',
    },
    form: {
        marginTop: spacing.lg,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: spacing.xl,
        marginTop: -spacing.xs,
    },
    forgotPasswordText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        ...typography.caption,
        color: colors.textMuted,
        marginHorizontal: spacing.md,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    footer: {
        marginTop: spacing.xxl,
        alignItems: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    footerLink: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '700',
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
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    glassContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        ...shadows.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    transparentInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
    },
    glassButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: colors.surface2,
        borderRadius: borderRadius.md,
        padding: 3,
        marginBottom: spacing.lg,
    },
    tabToggleDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    tabBtn: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    tabBtnText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textMuted,
    },
    tabBtnTextActive: {
        color: colors.surface,
    },
    phoneError: {
        ...typography.caption,
        color: colors.error,
        marginTop: -spacing.sm,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    helperText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: -spacing.xs,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    helperTextLight: {
        color: 'rgba(255, 255, 255, 0.78)',
    },
});
