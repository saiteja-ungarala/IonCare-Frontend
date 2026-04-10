import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
    Image,
    Easing,
    StyleProp,
    ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store';
import { UserRole } from '../../models/types';
import { AuthErrorBanner, Button, Input, FadeInView } from '../../components';
import { isValidEmail } from '../../utils/errorMapper';

const { width } = Dimensions.get('window');

const blurWebActiveElement = () => {
    if (Platform.OS !== 'web') return;
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur?.();
};

const navigateWithBlur = (callback: () => void) => {
    blurWebActiveElement();
    callback();
};

type RoleSelectionScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);

    const {
        login,
        isLoading,
        selectedRole,
        setSelectedRole,
        setShowLoginCelebration,
        errorMessage,
        fieldErrors,
        clearError,
        clearFieldError,
    } = useAuthStore();

    const currentRole = selectedRole || 'customer';

    const shiftAnim = useRef(new Animated.Value(currentRole === 'customer' ? 0 : 1)).current;
    const pageAnim = useRef(new Animated.Value(1)).current;

    const navigateAnimated = (route: string) => {
        blurWebActiveElement();
        Animated.timing(pageAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            navigation.navigate(route);
            setTimeout(() => {
                pageAnim.setValue(1);
            }, 600);
        });
    };

    useEffect(() => {
        clearError();
    }, [clearError]);

    useEffect(() => {
        Animated.timing(shiftAnim, {
            toValue: currentRole === 'customer' ? 0 : 1,
            duration: 800,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
            useNativeDriver: false,
        }).start();
    }, [currentRole, shiftAnim]);

    const handleRoleSelect = (role: UserRole) => {
        if (role === currentRole) return;
        setSelectedRole(role);
        setLocalErrorMessage(null);
        clearError();
    };

    const clearFieldState = (field: string) => {
        if (localErrorMessage) setLocalErrorMessage(null);
        if (errorMessage) clearError();
        if (fieldErrors[field]) clearFieldError(field);
        if (clientFieldErrors[field]) {
            setClientFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateLogin = (): boolean => {
        const nextFieldErrors: Record<string, string> = {};
        if (!email.trim()) nextFieldErrors.email = 'Email is required';
        else if (!isValidEmail(email.trim())) nextFieldErrors.email = 'Enter a valid email address';

        if (!password) nextFieldErrors.password = 'Password is required';
        else if (password.length < 6) nextFieldErrors.password = 'Password must be at least 6 characters';

        setClientFieldErrors(nextFieldErrors);
        return Object.keys(nextFieldErrors).length === 0;
    };

    const handleLogin = async () => {
        setLocalErrorMessage(null);
        clearError();

        if (!validateLogin()) return;

        const success = await login({
            email: email.trim(),
            password,
            role: currentRole as UserRole,
        });

        if (success) {
            setShowLoginCelebration(true);
        }
    };

    const dismissErrorBanner = () => {
        setLocalErrorMessage(null);
        clearError();
    };

    const shouldHideBannerForInlineErrors = Boolean(
        clientFieldErrors.email || clientFieldErrors.password || fieldErrors.email || fieldErrors.password,
    );

    const activeThemeColor = currentRole === 'technician' ? colors.accent : customerColors.primary;
    const isTechnician = currentRole === 'technician';

    // Interpolations
    const customerBgOp = shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const technicianBgOp = shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    const customerCardOp = shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const technicianCardOp = shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    const customerTextTranslateX = shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 0.3] });
    const technicianTextTranslateX = shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [width * 0.3, 0] });

    const cardBorderColor = shiftAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0, 194, 179, 0.5)', 'rgba(255, 176, 0, 0.5)'],
        extrapolate: 'clamp'
    });

    const cardScale = shiftAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.98, 1],
        extrapolate: 'clamp'
    });

    const [tabWidth, setTabWidth] = useState(0);
    const tabAnim = useRef(new Animated.Value(currentRole === 'customer' ? 0 : 1)).current;

    useEffect(() => {
        Animated.spring(tabAnim, {
            toValue: currentRole === 'customer' ? 0 : 1,
            friction: 8,
            tension: 50,
            useNativeDriver: false,
        }).start();
    }, [currentRole, tabAnim]);

    const tabIndicatorBg = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [customerColors.primary, colors.accent]
    });

    const tabTranslateX = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, tabWidth]
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Backgrounds */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: customerBgOp }]}>
                <ImageBackground source={require('../../../assets/customer-login.png')} style={styles.bgImage} resizeMode="cover">
                    <LinearGradient
                        colors={['rgba(3, 10, 15, 0.65)', 'rgba(2, 28, 34, 0.75)', 'rgba(3, 20, 25, 0.96)']}
                        locations={[0, 0.4, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                </ImageBackground>
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, { opacity: technicianBgOp }]}>
                <ImageBackground source={require('../../../assets/technicain-login.jpg')} style={styles.bgImage} resizeMode="cover">
                    <LinearGradient
                        colors={['rgba(15, 10, 0, 0.65)', 'rgba(34, 25, 2, 0.82)', 'rgba(25, 20, 3, 0.98)']}
                        locations={[0, 0.4, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                </ImageBackground>
            </Animated.View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.topBar}>
                    <View style={styles.logoContainer}>
                        <Image source={require('../../../assets/icon.png')} style={styles.smallLogo} resizeMode="contain" />
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.glassContent,
                                {
                                    borderColor: cardBorderColor,
                                    opacity: pageAnim,
                                    transform: [
                                        { scale: pageAnim },
                                        { scale: cardScale }
                                    ]
                                } as any as StyleProp<ViewStyle>
                            ]}
                        >
                            <View style={styles.tabContainer} onLayout={(e) => setTabWidth((e.nativeEvent.layout.width - 12) / 2)}>
                                {tabWidth > 0 && (
                                    <Animated.View style={[
                                        styles.tabIndicator,
                                        { 
                                            width: tabWidth, 
                                            transform: [{ translateX: tabTranslateX }],
                                            backgroundColor: tabIndicatorBg
                                        }
                                    ]} />
                                )}
                                <TouchableOpacity
                                    style={styles.tabButton}
                                    onPress={() => handleRoleSelect('customer')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="sparkles" size={16} color={!isTechnician ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} />
                                    <Text style={[styles.tabText, !isTechnician && { color: '#FFFFFF', fontWeight: 'bold' }]}>Customer</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.tabButton}
                                    onPress={() => handleRoleSelect('technician')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="construct" size={16} color={isTechnician ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} />
                                    <Text style={[styles.tabText, isTechnician && { color: '#FFFFFF', fontWeight: 'bold' }]}>Technician</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.titleWrapper}>
                                <Animated.View style={[StyleSheet.absoluteFill, { opacity: customerCardOp, transform: [{ translateX: customerTextTranslateX }] }]} pointerEvents="none">
                                    <Text style={[styles.title, { color: '#FFFFFF' }]}>Welcome Back</Text>
                                    <Text style={styles.subtitle}>
                                        Login as <Text style={{ color: customerColors.primary, fontWeight: '700' }}>Customer</Text>
                                    </Text>
                                </Animated.View>
                                <Animated.View style={[StyleSheet.absoluteFill, { opacity: technicianCardOp, transform: [{ translateX: technicianTextTranslateX }] }]} pointerEvents="none">
                                    <Text style={[styles.title, { color: colors.surface }]}>Welcome Back</Text>
                                    <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                                        Login as <Text style={{ color: colors.accent, fontWeight: '700' }}>Technician</Text>
                                    </Text>
                                </Animated.View>
                            </View>

                            <View style={styles.formContainer}>
                                <AuthErrorBanner
                                    message={localErrorMessage || (shouldHideBannerForInlineErrors ? null : errorMessage)}
                                    onClose={dismissErrorBanner}
                                />

                                <Input
                                    label="Email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={(value: string) => {
                                        setEmail(value);
                                        clearFieldState('email');
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    leftIcon="mail-outline"
                                    inputContainerStyle={styles.transparentInput}
                                    labelStyle={{ color: '#FFFFFF' }}
                                    style={{ color: '#FFFFFF' }}
                                    iconColor="#FFFFFF"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    error={clientFieldErrors.email || fieldErrors.email}
                                />

                                <Input
                                    label="Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={(value: string) => {
                                        setPassword(value);
                                        clearFieldState('password');
                                    }}
                                    secureTextEntry
                                    leftIcon="lock-closed-outline"
                                    inputContainerStyle={styles.transparentInput}
                                    labelStyle={{ color: '#FFFFFF' }}
                                    style={{ color: '#FFFFFF' }}
                                    iconColor="#FFFFFF"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    error={clientFieldErrors.password || fieldErrors.password}
                                />

                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={() => navigateAnimated('ForgotPassword')}
                                >
                                    <Text style={[styles.forgotPasswordText, { color: activeThemeColor }]}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <Button
                                    title="Connect Securely"
                                    onPress={handleLogin}
                                    loading={isLoading}
                                    fullWidth
                                    style={{ backgroundColor: activeThemeColor, shadowColor: activeThemeColor, borderRadius: borderRadius.full, marginTop: spacing.md }}
                                />
                            </View>

                            <View style={styles.footerRow}>
                                <Text style={[styles.footerText, isTechnician && { color: 'rgba(255, 255, 255, 0.6)' }]}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigateWithBlur(() => navigation.navigate('Signup'))}>
                                    <Text style={[styles.footerLink, { color: activeThemeColor }]}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    logoContainer: {
        width: 80,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallLogo: {
        width: 140,   // reduced from 160
        height: 140,
        marginTop: 12, // shift graphic downward
    },
    roleSwitcher: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    roleSwitchBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleSwitchBtnActiveCus: {
        backgroundColor: customerColors.primary,
        ...shadows.md,
    },
    roleSwitchBtnActiveTech: {
        backgroundColor: colors.accent,
        ...shadows.md,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xxl,
    },
    glassContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 32,
        padding: spacing.xl,
        borderWidth: 1,
        ...shadows.lg,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 16,
        padding: 6,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    tabIndicator: {
        position: 'absolute',
        top: 6,
        bottom: 6,
        left: 6,
        borderRadius: 12,
        ...shadows.md,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    tabText: {
        ...typography.bodySmall,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
    },
    titleWrapper: {
        height: 80,
        marginBottom: spacing.lg,
        justifyContent: 'center',
    },
    title: {
        ...typography.h1,
        fontSize: 32,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
    },
    formContainer: {
        marginTop: spacing.sm,
    },
    transparentInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderRadius: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginVertical: spacing.sm,
    },
    forgotPasswordText: {
        ...typography.bodySmall,
        fontWeight: '700',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        ...typography.body,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    footerLink: {
        ...typography.body,
        fontWeight: '700',
    },
});
