// Forgot Password Screen - Modern Viral India Aesthetic
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
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, shadows } from '../../theme/theme';
import { AuthErrorBanner, Button, Input } from '../../components';
import { isValidEmail } from '../../utils/errorMapper';
import { useAuthStore } from '../../store';
import { SafeAreaView } from 'react-native-safe-area-context';

type ForgotPasswordScreenProps = {
    navigation: NativeStackNavigationProp<any>;
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
    } = useAuthStore();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const dismissErrorBanner = () => {
        setLocalErrorMessage(null);
        clearError();
    };

    const clearEmailFieldState = () => {
        if (localErrorMessage) {
            setLocalErrorMessage(null);
        }
        if (errorMessage) {
            clearError();
        }
        if (fieldErrors.email) {
            clearFieldError('email');
        }
        if (clientFieldErrors.email) {
            setClientFieldErrors({});
        }
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

    const handleSubmit = async () => {
        setLocalErrorMessage(null);
        clearError();

        if (!validateForm()) {
            return;
        }

        const success = await forgotPassword(email.trim());
        if (success) {
            setIsSubmitted(true);
            Alert.alert(
                'Request Sent',
                'If this email exists in our system, we have sent reset instructions.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
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
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="key-outline" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            No worries! Enter your email and we'll send you reset instructions
                        </Text>

                        <View style={styles.form}>
                            <AuthErrorBanner
                                message={localErrorMessage || errorMessage}
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
                            />

                            <Button
                                title={isSubmitted ? 'Request Sent' : 'Send Reset Link'}
                                onPress={handleSubmit}
                                loading={isLoading}
                                fullWidth
                                disabled={isSubmitted || isLoading}
                            />

                            <TouchableOpacity
                                style={styles.backToLogin}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                                <Text style={styles.backToLoginText}>Back to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.title,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    form: {
        marginTop: spacing.lg,
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        gap: spacing.xs,
    },
    backToLoginText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
});
