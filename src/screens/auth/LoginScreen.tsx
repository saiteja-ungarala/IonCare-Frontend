import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { AuthErrorBanner, Button, Input } from '../../components';
import { isValidEmail } from '../../utils/errorMapper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
    const {
        login,
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
                return 'Customer';
            case 'technician':
                return 'Technician';
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

    const isCustomLogin = selectedRole === 'customer' || selectedRole === 'technician';
    const isTechnician = selectedRole === 'technician';
    const Wrapper = (isCustomLogin ? ImageBackground : View) as React.ComponentType<any>;

    const getBackgroundImage = () => {
        if (selectedRole === 'customer') return require('../../../assets/customer-login.png');
        if (selectedRole === 'technician') return require('../../../assets/technicain-login.jpg');
        return undefined;
    };

    const activeThemeColor =
        selectedRole === 'technician' ? colors.accent : customerColors.primary;

    const wrapperProps = isCustomLogin
        ? { source: getBackgroundImage(), style: styles.backgroundImage, resizeMode: 'cover' as const }
        : { style: styles.container };

    const handleBack = () => {
        navigateWithBlur(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: 'RoleSelection' }],
            });
        });
    };

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
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={[styles.backButton, isCustomLogin && styles.glassButton]}
                                onPress={handleBack}
                            >
                                <Ionicons name="chevron-back" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.content, isCustomLogin && styles.bottomContent]}>
                            <View style={isCustomLogin ? styles.glassContent : undefined}>
                                <Text style={[styles.title, isTechnician ? { color: colors.surface } : null]}>Welcome Back</Text>
                                <Text style={[styles.subtitle, isTechnician ? styles.lightSubtitle : null]}>
                                    Login as <Text style={[styles.roleText, { color: activeThemeColor }]}>{getRoleLabel()}</Text>
                                </Text>

                                <View style={styles.form}>
                                    <AuthErrorBanner
                                        message={localErrorMessage || (shouldHideBannerForInlineErrors ? null : errorMessage)}
                                        onClose={dismissErrorBanner}
                                    />

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
    lightSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
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
});
