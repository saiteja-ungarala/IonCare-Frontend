// Forgot Password Screen - Premium Glass Aesthetic

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { AuthErrorBanner, Button, Input } from '../../components';
import { isValidEmail } from '../../utils/errorMapper';
import { useAuthStore } from '../../store';
import { SafeAreaView } from 'react-native-safe-area-context';

type ForgotPasswordScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

const blurWebActiveElement = () => {
    if (Platform.OS !== 'web') return;
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur?.();
};

const goBackWithBlur = (navigation: NativeStackNavigationProp<any>) => {
    blurWebActiveElement();
    navigation.goBack();
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
    const {
        forgotPassword,
        isLoading,
        errorMessage,
        fieldErrors,
        clearError,
        clearFieldError,
        selectedRole
    } = useAuthStore();

    const isTechnician = selectedRole === 'technician';
    const activeThemeColor = isTechnician ? colors.accent : customerColors.primary;

    useEffect(() => {
        clearError();
    }, [clearError]);

    const dismissErrorBanner = () => {
        setLocalErrorMessage(null);
        clearError();
    };

    const clearEmailFieldState = () => {
        if (localErrorMessage) setLocalErrorMessage(null);
        if (errorMessage) clearError();
        if (fieldErrors.email) clearFieldError('email');
        if (clientFieldErrors.email) setClientFieldErrors({});
    };

    const validateForm = (): boolean => {
        const nextFieldErrors: Record<string, string> = {};

        if (!email.trim()) {
            nextFieldErrors.email = 'Email is required';
        } else if (!isValidEmail(email.trim())) {
            nextFieldErrors.email = 'Enter a valid email address';
        }

        setClientFieldErrors(nextFieldErrors);
        return Object.keys(nextFieldErrors).length === 0;
    };

    const shouldHideBannerForInlineErrors = Boolean(
        clientFieldErrors.email || fieldErrors.email,
    );

    const handleSubmit = async () => {
        setLocalErrorMessage(null);
        clearError();

        if (!validateForm()) return;

        const success = await forgotPassword(email.trim());
        if (success) {
            setIsSubmitted(true);
            Alert.alert(
                'Request Sent',
                'If this email exists in our system, we have sent reset instructions.',
                [{ text: 'OK', onPress: () => goBackWithBlur(navigation) }]
            );
        }
    };

    const getBackgroundImage = () => (
        isTechnician
            ? require('../../../assets/technicain-login.jpg')
            : require('../../../assets/customer-login.png')
    );

    return (
        <View style={styles.container}>
            <ImageBackground source={getBackgroundImage()} style={styles.bgImage} resizeMode="cover">
                <LinearGradient
                    colors={isTechnician 
                        ? ['rgba(15, 10, 0, 0.65)', 'rgba(34, 25, 2, 0.82)', 'rgba(25, 20, 3, 0.98)']
                        : ['rgba(3, 10, 15, 0.65)', 'rgba(2, 28, 34, 0.75)', 'rgba(3, 20, 25, 0.96)']
                    }
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={styles.safeArea}>
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
                                    style={styles.backButton}
                                    onPress={() => goBackWithBlur(navigation)}
                                >
                                    <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.content}>
                                <View style={[styles.glassContent, { borderColor: isTechnician ? 'rgba(255, 176, 0, 0.3)' : 'rgba(0, 194, 179, 0.3)' }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: isTechnician ? 'rgba(255, 176, 0, 0.15)' : 'rgba(0, 194, 179, 0.15)' }]}>
                                        <Ionicons name="key" size={36} color={activeThemeColor} />
                                    </View>
                                    <Text style={styles.title}>Recovery</Text>
                                    <Text style={styles.subtitle}>
                                        Enter your email and we'll securely send you reset instructions.
                                    </Text>

                                    <View style={styles.form}>
                                        <AuthErrorBanner
                                            message={localErrorMessage || (shouldHideBannerForInlineErrors ? null : errorMessage)}
                                            onClose={dismissErrorBanner}
                                        />

                                        <Input
                                            label="Email"
                                            placeholder="Enter your registered email"
                                            value={email}
                                            onChangeText={(value) => {
                                                setEmail(value);
                                                clearEmailFieldState();
                                            }}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            leftIcon="mail-outline"
                                            editable={!isSubmitted}
                                            error={clientFieldErrors.email || fieldErrors.email}
                                            inputContainerStyle={styles.transparentInput}
                                            labelStyle={{ color: '#FFFFFF' }}
                                            style={{ color: '#FFFFFF' }}
                                            iconColor="#FFFFFF"
                                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        />

                                        <Button
                                            title={isSubmitted ? 'Request Sent' : 'Send Reset Link'}
                                            onPress={handleSubmit}
                                            loading={isLoading}
                                            fullWidth
                                            disabled={isSubmitted || isLoading}
                                            style={{ backgroundColor: activeThemeColor, shadowColor: activeThemeColor, borderRadius: borderRadius.full, marginTop: spacing.md }}
                                        />

                                        <TouchableOpacity
                                            style={styles.backToLogin}
                                            onPress={() => goBackWithBlur(navigation)}
                                        >
                                            <Ionicons name="chevron-back" size={16} color={activeThemeColor} />
                                            <Text style={[styles.backToLoginText, { color: activeThemeColor }]}>Back to Login</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    bgImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
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
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    glassContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 32,
        padding: spacing.xl,
        borderWidth: 1,
        ...shadows.lg,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        ...typography.h2,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
        fontWeight: 'bold',
    },
    subtitle: {
        ...typography.body,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: spacing.xxl,
        lineHeight: 24,
    },
    form: {
        marginTop: spacing.sm,
    },
    transparentInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        elevation: 0,
        shadowColor: 'transparent',
        shadowOpacity: 0,
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        gap: spacing.xs,
        paddingVertical: spacing.md,
    },
    backToLoginText: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
});
