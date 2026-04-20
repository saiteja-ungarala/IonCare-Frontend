import React, { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthErrorBanner, Button, Input } from '../../components';
import { useAuthStore } from '../../store';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { isValidEmail } from '../../utils/errorMapper';
import { isValidIndianMobile, normalizePhoneInput } from '../../utils/phoneValidator';
import { UserRole } from '../../models/types';

type SignupScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

type SignupDesignation = 'doctor' | 'yoga' | 'gym' | 'other';
type FormRole = UserRole;
type FieldKey =
    | 'fullName'
    | 'email'
    | 'phone'
    | 'password'
    | 'role'
    | 'designation'
    | 'designation_custom'
    | 'referral_code';
type SelectFieldKey = 'role' | 'designation' | null;

type SelectOption<T extends string> = {
    label: string;
    value: T;
    helper: string;
};

const ROLE_OPTIONS: SelectOption<FormRole>[] = [
    { label: 'Customer', value: 'customer', helper: 'Buy products and book services' },
    { label: 'Technician', value: 'technician', helper: 'Earn from services and referrals' },
];

const DESIGNATION_OPTIONS: SelectOption<SignupDesignation>[] = [
    { label: 'Doctor', value: 'doctor', helper: 'Medical and clinic professionals' },
    { label: 'Yoga', value: 'yoga', helper: 'Yoga trainers and wellness experts' },
    { label: 'Gym', value: 'gym', helper: 'Fitness coaches and gym professionals' },
    { label: 'Other', value: 'other', helper: 'Enter a custom designation manually' },
];

interface SelectFieldProps<T extends string> {
    label: string;
    value: T | '';
    placeholder: string;
    options: SelectOption<T>[];
    open: boolean;
    error?: string;
    onToggle: () => void;
    onSelect: (value: T) => void;
    inputContainerStyle?: object;
    labelStyle?: object;
    textStyle?: object;
    placeholderTextColor?: string;
    iconColor?: string;
}

const SelectField = <T extends string>({
    label,
    value,
    placeholder,
    options,
    open,
    error,
    onToggle,
    onSelect,
    inputContainerStyle,
    labelStyle,
    textStyle,
    placeholderTextColor,
    iconColor,
}: SelectFieldProps<T>) => {
    const selectedOption = options.find((option) => option.value === value);

    return (
        <View style={styles.selectContainer}>
            <Text style={[styles.selectLabel, labelStyle]}>{label}</Text>
            <TouchableOpacity
                activeOpacity={0.85}
                style={[
                    styles.selectTrigger,
                    inputContainerStyle,
                    open && styles.selectTriggerOpen,
                    error && styles.selectTriggerError,
                ]}
                onPress={onToggle}
            >
                <View style={styles.selectTextWrap}>
                    <Text
                        style={[
                            styles.selectValue,
                            textStyle,
                            !selectedOption && { color: placeholderTextColor || colors.textMuted },
                        ]}
                    >
                        {selectedOption?.label || placeholder}
                    </Text>
                    {selectedOption?.helper ? (
                        <Text style={[styles.selectHelper, textStyle && { opacity: 0.72 }]}>
                            {selectedOption.helper}
                        </Text>
                    ) : null}
                </View>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={iconColor || colors.textSecondary}
                />
            </TouchableOpacity>

            {open ? (
                <View style={[styles.optionsSheet, inputContainerStyle]}>
                    {options.map((option, index) => {
                        const active = option.value === value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                activeOpacity={0.85}
                                style={[
                                    styles.optionRow,
                                    index < options.length - 1 && styles.optionRowBorder,
                                    active && styles.optionRowActive,
                                ]}
                                onPress={() => onSelect(option.value)}
                            >
                                <View style={styles.optionTextWrap}>
                                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                                        {option.label}
                                    </Text>
                                    <Text style={[styles.optionHelper, active && styles.optionHelperActive]}>
                                        {option.helper}
                                    </Text>
                                </View>
                                {active ? (
                                    <Ionicons name="checkmark-circle" size={18} color={customerColors.primary} />
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}

            {error ? <Text style={styles.selectError}>{error}</Text> : null}
        </View>
    );
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
    const {
        startSignupVerification,
        isLoading,
        errorMessage,
        fieldErrors,
        clearError,
        clearFieldError,
        selectedRole,
        setSelectedRole,
    } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<FormRole>(selectedRole ?? 'customer');
    const [designation, setDesignation] = useState<SignupDesignation | ''>('');
    const [designation_custom, setDesignationCustom] = useState('');
    const [referral_code, setReferralCode] = useState('');
    const [openSelect, setOpenSelect] = useState<SelectFieldKey>(null);
    const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});

    const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    }, [slideAnim]);

    useEffect(() => {
        setSelectedRole(role);
    }, [role, setSelectedRole]);

    useEffect(() => {
        if (selectedRole && selectedRole !== role) {
            setRole(selectedRole);
        }
    }, [selectedRole, role]);

    const isTechnician = role === 'technician';
    const activeThemeColor = isTechnician ? colors.accent : customerColors.primary;

    const transparentLabelStyle = useMemo(
        () => ({ color: '#000000' }),
        []
    );
    const transparentTextStyle = useMemo(
        () => ({ color: '#000000' }),
        []
    );
    const transparentPlaceholderColor = 'rgba(0, 0, 0, 0.5)';

    const clearFieldState = (field: FieldKey) => {
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

    const validateForm = (): boolean => {
        const nextFieldErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            nextFieldErrors.fullName = 'Full name is required';
        } else if (fullName.trim().length < 2) {
            nextFieldErrors.fullName = 'Full name must be at least 2 characters';
        } else if (fullName.trim().length > 100) {
            nextFieldErrors.fullName = 'Full name must be 100 characters or fewer';
        }

        if (!email.trim()) {
            nextFieldErrors.email = 'Email is required';
        } else if (!isValidEmail(email.trim())) {
            nextFieldErrors.email = 'Enter a valid email address';
        }

        if (!phone.trim()) {
            nextFieldErrors.phone = 'Phone number is required';
        } else if (!isValidIndianMobile(phone)) {
            nextFieldErrors.phone = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9';
        }

        if (!password) {
            nextFieldErrors.password = 'Password is required';
        } else if (password.length < 8) {
            nextFieldErrors.password = 'Password must be at least 8 characters';
        } else if (password.length > 72) {
            nextFieldErrors.password = 'Password must be 72 characters or fewer';
        } else if (!/[A-Z]/.test(password)) {
            nextFieldErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(password)) {
            nextFieldErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!/\d/.test(password)) {
            nextFieldErrors.password = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
            nextFieldErrors.password = 'Password must contain at least one special character';
        }

        if (!role) {
            nextFieldErrors.role = 'Role is required';
        }

        if (!designation) {
            nextFieldErrors.designation = 'Designation is required';
        }

        if (designation === 'other' && !designation_custom.trim()) {
            nextFieldErrors.designation_custom = 'Please enter your designation';
        }

        setClientFieldErrors(nextFieldErrors);
        return Object.keys(nextFieldErrors).length === 0;
    };

    const shouldHideBannerForInlineErrors = Boolean(
        clientFieldErrors.fullName ||
        clientFieldErrors.email ||
        clientFieldErrors.phone ||
        clientFieldErrors.password ||
        clientFieldErrors.role ||
        clientFieldErrors.designation ||
        clientFieldErrors.designation_custom ||
        clientFieldErrors.referral_code ||
        fieldErrors.name ||
        fieldErrors.email ||
        fieldErrors.phone ||
        fieldErrors.password ||
        fieldErrors.role ||
        fieldErrors.designation ||
        fieldErrors.designation_custom ||
        fieldErrors.referral_code
    );

    const handleRoleSelect = (nextRole: FormRole) => {
        setRole(nextRole);
        setOpenSelect(null);
        clearFieldState('role');
    };

    const handleDesignationSelect = (nextDesignation: SignupDesignation) => {
        setDesignation(nextDesignation);
        if (nextDesignation !== 'other') {
            setDesignationCustom('');
        }
        setOpenSelect(null);
        clearFieldState('designation');
        clearFieldState('designation_custom');
    };

    const handleSignup = async () => {
        clearError();
        if (!validateForm() || !designation) {
            return;
        }

        setSelectedRole(role);

        const otpSession = await startSignupVerification({
            name: fullName.trim(),
            email: email.trim(),
            password,
            phone: phone.trim(),
            role,
            designation,
            designation_custom: designation === 'other' ? designation_custom.trim() : null,
            referral_code: referral_code.trim() || null,
        });

        if (otpSession) {
            navigation.navigate('OTPVerification', {
                otpSession,
            });
        }
    };

    const getBackgroundImage = () => (
        isTechnician
            ? require('../../../assets/technicain-login.jpg')
            : require('../../../assets/customer-login.png')
    );

    return (
        <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
            <View style={styles.overlay} />
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
                                style={[styles.backButton, styles.glassButton]}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="chevron-back" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Animated.View
                            style={[
                                styles.content,
                                styles.bottomContent,
                                { transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <View style={styles.glassContent}>
                                <Text style={styles.title}>
                                    Create Account
                                </Text>
                                <Text style={styles.subtitle}>
                                    Join IONORA CARE today
                                </Text>

                                <View style={styles.form}>
                                    <AuthErrorBanner
                                        message={shouldHideBannerForInlineErrors ? null : errorMessage}
                                        onClose={clearError}
                                    />



                                    <Input
                                        label="Full Name"
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChangeText={(value) => {
                                            setFullName(value);
                                            clearFieldState('fullName');
                                        }}
                                        leftIcon="person-outline"
                                        inputContainerStyle={styles.transparentInput}
                                        labelStyle={transparentLabelStyle}
                                        style={transparentTextStyle}
                                        iconColor="#000000"
                                        placeholderTextColor={transparentPlaceholderColor}
                                        error={clientFieldErrors.fullName || fieldErrors.name}
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
                                        inputContainerStyle={styles.transparentInput}
                                        labelStyle={transparentLabelStyle}
                                        style={transparentTextStyle}
                                        iconColor="#000000"
                                        placeholderTextColor={transparentPlaceholderColor}
                                        error={clientFieldErrors.email || fieldErrors.email}
                                    />

                                    <Input
                                        label="Phone Number"
                                        placeholder="Enter 10-digit mobile number"
                                        value={phone}
                                        onChangeText={(value) => {
                                            setPhone(normalizePhoneInput(value));
                                            clearFieldState('phone');
                                        }}
                                        keyboardType="numeric"
                                        maxLength={10}
                                        leftIcon="call-outline"
                                        inputContainerStyle={styles.transparentInput}
                                        labelStyle={transparentLabelStyle}
                                        style={transparentTextStyle}
                                        iconColor="#000000"
                                        placeholderTextColor={transparentPlaceholderColor}
                                        error={clientFieldErrors.phone || fieldErrors.phone}
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="Create a password (min. 8 characters)"
                                        value={password}
                                        onChangeText={(value) => {
                                            setPassword(value);
                                            clearFieldState('password');
                                        }}
                                        secureTextEntry
                                        leftIcon="lock-closed-outline"
                                        inputContainerStyle={styles.transparentInput}
                                        labelStyle={transparentLabelStyle}
                                        style={transparentTextStyle}
                                        iconColor="#000000"
                                        placeholderTextColor={transparentPlaceholderColor}
                                        error={clientFieldErrors.password || fieldErrors.password}
                                    />

                                    <SelectField
                                        label="Designation"
                                        value={designation}
                                        placeholder="Choose your designation"
                                        options={DESIGNATION_OPTIONS}
                                        open={openSelect === 'designation'}
                                        onToggle={() => setOpenSelect((current) => current === 'designation' ? null : 'designation')}
                                        onSelect={handleDesignationSelect}
                                        error={clientFieldErrors.designation || fieldErrors.designation}
                                        inputContainerStyle={styles.transparentInput}
                                        labelStyle={transparentLabelStyle}
                                        textStyle={transparentTextStyle}
                                        placeholderTextColor={transparentPlaceholderColor}
                                        iconColor="#000000"
                                    />

                                    {designation === 'other' ? (
                                        <Input
                                            label="Custom Designation"
                                            placeholder="Enter your designation"
                                            value={designation_custom}
                                            onChangeText={(value) => {
                                                setDesignationCustom(value);
                                                clearFieldState('designation_custom');
                                            }}
                                            leftIcon="create-outline"
                                            inputContainerStyle={styles.transparentInput}
                                            labelStyle={transparentLabelStyle}
                                            style={transparentTextStyle}
                                            iconColor="#000000"
                                            placeholderTextColor={transparentPlaceholderColor}
                                            error={clientFieldErrors.designation_custom || fieldErrors.designation_custom}
                                        />
                                    ) : null}

                                    <Input
                                        label="Referral Code (Optional)"
                                        placeholder="Enter referral code"
                                        value={referral_code}
                                        onChangeText={(value) => {
                                            setReferralCode(value);
                                            clearFieldState('referral_code');
                                        }}
                                        autoCapitalize="characters"
                                        leftIcon="gift-outline"
                                        inputContainerStyle={styles.transparentInput}
                                        labelStyle={transparentLabelStyle}
                                        style={transparentTextStyle}
                                        iconColor="#000000"
                                        placeholderTextColor={transparentPlaceholderColor}
                                        error={clientFieldErrors.referral_code || fieldErrors.referral_code}
                                    />

                                    <Text style={styles.helperText}>
                                        We will send a verification OTP to your email to complete signup. Your mobile number will be used for service updates and contact.
                                    </Text>

                                    <Button
                                        title="Sign Up & Verify Email"
                                        onPress={handleSignup}
                                        loading={isLoading}
                                        fullWidth
                                        style={{
                                            backgroundColor: activeThemeColor,
                                            shadowColor: activeThemeColor,
                                            marginTop: spacing.lg,
                                        }}
                                    />
                                </View>

                                <View style={styles.footer}>
                                    <View style={styles.footerRow}>
                                        <Text style={styles.footerText}>Already have an account? </Text>
                                        <TouchableOpacity
                                            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] })}
                                        >
                                            <Text style={[styles.footerLink, { color: activeThemeColor }]}>Login</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    glassButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        ...shadows.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    title: {
        ...typography.title,
        color: '#000000',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: '#000000',
        marginBottom: spacing.xl,
    },
    form: {
        marginTop: spacing.md,
    },
    transparentInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
    },
    selectContainer: {
        marginBottom: spacing.md,
    },
    selectLabel: {
        ...typography.bodySmall,
        fontWeight: '500',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    selectTrigger: {
        minHeight: 58,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectTriggerOpen: {
        borderColor: '#000000',
    },
    selectTriggerError: {
        borderColor: colors.error,
    },
    selectTextWrap: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    selectValue: {
        ...typography.body,
        color: colors.text,
        fontWeight: '600',
    },
    selectHelper: {
        ...typography.caption,
        color: 'rgba(255, 255, 255, 0.75)',
        marginTop: 2,
        lineHeight: 16,
    },
    optionsSheet: {
        marginTop: spacing.xs,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    optionRow: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.24)',
    },
    optionRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.18)',
    },
    optionRowActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.34)',
    },
    optionTextWrap: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    optionLabel: {
        ...typography.body,
        color: '#000000',
        fontWeight: '700',
    },
    optionLabelActive: {
        color: '#000000',
    },
    optionHelper: {
        ...typography.caption,
        color: 'rgba(0, 0, 0, 0.6)',
        marginTop: 2,
        lineHeight: 16,
    },
    optionHelperActive: {
        color: 'rgba(0, 0, 0, 0.9)',
    },
    selectError: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        ...typography.body,
        color: '#000000',
    },
    footerLink: {
        ...typography.body,
        fontWeight: '700',
    },
    helperText: {
        ...typography.caption,
        color: '#000000',
        marginTop: -spacing.xs,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
});
