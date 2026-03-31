// Modern Button Component - Viral India Aesthetic
// Flat surfaces, high contrast, consistent radius

import React, { useRef } from 'react';
import {
    TouchableWithoutFeedback,
    Text,
    StyleSheet,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle,
    View,
    Animated,
    Platform,
} from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../theme/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    style,
    textStyle,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled || loading) return;
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled || loading) return;
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const getContainerStyle = (): ViewStyle => {
        const base: ViewStyle = {
            ...styles.container,
            ...(fullWidth ? styles.fullWidth : {}),
        };
        const primaryShadowStyle = Platform.OS === 'web'
            ? ({ boxShadow: '0px 3px 6px rgba(0, 194, 179, 0.28)' } as ViewStyle)
            : { ...shadows.md, shadowColor: colors.primary };

        switch (variant) {
            case 'primary':
                return { ...base, backgroundColor: colors.primary, ...primaryShadowStyle };
            case 'secondary':
                return { ...base, backgroundColor: colors.primaryLight };
            case 'outline':
                return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
            case 'ghost':
                return { ...base, backgroundColor: 'transparent' };
            default:
                return { ...base, backgroundColor: colors.primary };
        }
    };

    const getSizeStyle = (): ViewStyle => {
        switch (size) {
            case 'small': return styles.small;
            case 'large': return styles.large;
            default: return styles.medium;
        }
    };

    const getTextStyle = (): TextStyle => {
        const base: TextStyle = { ...styles.text };

        if (size === 'small') base.fontSize = 14;
        if (size === 'large') base.fontSize = 18;

        switch (variant) {
            case 'primary':
                return { ...base, color: colors.textOnPrimary };
            case 'secondary':
                return { ...base, color: colors.primaryDark };
            case 'outline':
                return { ...base, color: colors.primary };
            case 'ghost':
                return { ...base, color: colors.primary };
            default:
                return { ...base, color: colors.textOnPrimary };
        }
    };

    const contentStyle = [
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
    ];

    return (
        <TouchableWithoutFeedback
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
        >
            <Animated.View style={[contentStyle, { transform: [{ scale: scaleAnim }] }]}>
                {loading ? (
                    <ActivityIndicator
                        color={variant === 'primary' ? colors.textOnPrimary : colors.primary}
                        size="small"
                    />
                ) : (
                    <View style={styles.content}>
                        {icon}
                        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
                    </View>
                )}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    small: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        minHeight: 36,
    },
    medium: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        minHeight: 48,
    },
    large: {
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xxl,
        minHeight: 56,
    },
    text: {
        ...typography.button,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
        ...(Platform.OS === 'web'
            ? ({ boxShadow: 'none' } as ViewStyle)
            : {
                elevation: 0,
                shadowOpacity: 0,
            }),
    },
});
