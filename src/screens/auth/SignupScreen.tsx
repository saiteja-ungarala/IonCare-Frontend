// Signup Screen

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { AuthErrorBanner, Button, Input } from '../../components';
import { isValidEmail } from '../../utils/errorMapper';
import { SafeAreaView } from 'react-native-safe-area-context';

type SignupScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);

    const {
        signup,
        isLoading,
        selectedRole,
        errorMessage,
        fieldErrors,
        clearError,
        clearFieldError,
    } = useAuthStore();
    const isAgent = selectedRole === 'agent';
    const isDealer = selectedRole === 'dealer';
    const activeAccentColor = isAgent ? colors.accent : isDealer ? colors.info : customerColors.primary;

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
            case 'agent':
                return 'Service Agent';
            case 'dealer':
                return 'Dealer';
            default:
                return 'User';
        }
    };

    const validateForm = (): boolean => {
        const nextFieldErrors: Record<string, string> = {};

        if (!name.trim()) {
            nextFieldErrors.name = 'Full name is required';
        }
        if (!email.trim()) {
            nextFieldErrors.email = 'Email is required';
        } else if (!isValidEmail(email.trim())) {
            nextFieldErrors.email = 'Enter a valid email address';
        }
        if (!phone.trim()) {
            nextFieldErrors.phone = 'Phone number is required';
        }
        if (!password) {
            nextFieldErrors.password = 'Password is required';
        } else if (password.length < 6) {
            nextFieldErrors.password = 'Password must be at least 6 characters';
        }
        if (!confirmPassword) {
            nextFieldErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            nextFieldErrors.confirmPassword = 'Passwords do not match';
        }

        setClientFieldErrors(nextFieldErrors);
        return Object.keys(nextFieldErrors).length === 0;
    };

    const handleSignup = async () => {
        setLocalErrorMessage(null);
        clearError();

        if (!validateForm()) return;

        if (!selectedRole) {
            setLocalErrorMessage('Please select a role first.');
            navigation.navigate('RoleSelection');
            return;
        }

        await signup({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            role: selectedRole,
            referralCode: referralCode.trim() || undefined,
        });
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
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    isAgent ? styles.agentIconContainer : null,
                                    isDealer ? styles.dealerIconContainer : null,
                                ]}
                            >
                                <Ionicons name="water" size={48} color={activeAccentColor} />
                            </View>
                            <Text style={styles.headerTitle}>Create Account</Text>
                            <View
                                style={[
                                    styles.roleBadge,
                                    isAgent ? styles.agentRoleBadge : null,
                                    isDealer ? styles.dealerRoleBadge : null,
                                ]}
                            >
                                <Text style={[styles.roleBadgeText, { color: activeAccentColor }]}>{getRoleLabel()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.formTitle}>Fill in your details</Text>

                        <AuthErrorBanner
                            message={localErrorMessage || errorMessage}
                            onClose={dismissErrorBanner}
                        />

                        <Input
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={name}
                            onChangeText={(value) => {
                                setName(value);
                                clearFieldState('name');
                            }}
                            leftIcon="person-outline"
                            error={clientFieldErrors.name || fieldErrors.name}
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
                            error={clientFieldErrors.email || fieldErrors.email}
                        />

                        <Input
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={(value) => {
                                setPhone(value);
                                clearFieldState('phone');
                            }}
                            keyboardType="phone-pad"
                            leftIcon="call-outline"
                            error={clientFieldErrors.phone || fieldErrors.phone}
                        />

                        <Input
                            label="Password"
                            placeholder="Create a password"
                            value={password}
                            onChangeText={(value) => {
                                setPassword(value);
                                clearFieldState('password');
                            }}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                            error={clientFieldErrors.password || fieldErrors.password}
                        />

                        <Input
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={(value) => {
                                setConfirmPassword(value);
                                clearFieldState('confirmPassword');
                            }}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                            error={clientFieldErrors.confirmPassword || fieldErrors.confirmPassword}
                        />

                        <Input
                            label="Referral Code (Optional)"
                            placeholder="Enter referral code if you have one"
                            value={referralCode}
                            onChangeText={setReferralCode}
                            autoCapitalize="characters"
                            leftIcon="gift-outline"
                        />

                        {selectedRole === 'customer' && (
                            <View style={styles.referralNote}>
                                <Ionicons name="information-circle" size={20} color={colors.info} />
                                <Text style={styles.referralNoteText}>
                                    Use a referral code to get your first service free!
                                </Text>
                            </View>
                        )}

                        <Button
                            title="Create Account"
                            onPress={handleSignup}
                            loading={isLoading}
                            fullWidth
                            style={isAgent || isDealer
                                ? { ...styles.signupButton, backgroundColor: activeAccentColor, shadowColor: activeAccentColor }
                                : styles.signupButton}
                        />

                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={[styles.loginLink, { color: activeAccentColor }]}>Login</Text>
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
        backgroundColor: colors.background,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    backButton: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        zIndex: 1,
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -spacing.sm,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: spacing.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    agentIconContainer: {
        backgroundColor: 'rgba(255, 176, 0, 0.22)',
    },
    dealerIconContainer: {
        backgroundColor: 'rgba(37, 99, 235, 0.16)',
    },
    headerTitle: {
        ...typography.title,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    roleBadge: {
        backgroundColor: colors.surface2,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    agentRoleBadge: {
        backgroundColor: 'rgba(255, 176, 0, 0.14)',
    },
    dealerRoleBadge: {
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
    },
    roleBadgeText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '700',
    },
    form: {
        flex: 1,
        padding: spacing.lg,
    },
    formTitle: {
        ...typography.h2,
        fontSize: 20,
        color: colors.text,
        marginBottom: spacing.lg,
    },
    referralNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface2,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    referralNoteText: {
        ...typography.bodySmall,
        color: colors.info,
        flex: 1,
    },
    signupButton: {
        marginTop: spacing.md,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    loginText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    loginLink: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
});

