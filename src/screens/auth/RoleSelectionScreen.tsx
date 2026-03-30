import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Image,
    ImageBackground,
    Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { UserRole } from '../../models/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AnimatedPressable,
    FadeInView,
} from '../../components';

type RoleSelectionScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

interface RoleCardProps {
    role: UserRole;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    delay: number;
    color: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
    role,
    title,
    description,
    icon,
    onPress,
    delay,
    color,
}) => (
    <FadeInView delay={delay} duration={500} direction="up" distance={30}>
        <AnimatedPressable style={styles.roleCard} onPress={onPress}>
            <View style={[styles.roleIconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>{title}</Text>
                <Text style={styles.roleDescription}>{description}</Text>
            </View>
            <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
            </View>
        </AnimatedPressable>
    </FadeInView>
);

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
    navigation,
}) => {
    const setSelectedRole = useAuthStore((state) => state.setSelectedRole);

    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
        navigation.navigate('Login');
    };

    return (
        <ImageBackground
            source={require('../../../assets/purifier5.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Gradient Overlay: Dark top for white text, transparent middle, slight dark bottom for card contrast */}
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.3)']}
                locations={[0, 0.4, 1]}
                style={styles.overlay}
            />

            <SafeAreaView style={styles.container}>
                {/* Header Section */}
                <FadeInView delay={100} duration={600} direction="down" distance={20} style={styles.header}>
                    <View style={styles.logoBadge}>
                        <Image source={require('../../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
                    </View>
                </FadeInView>

                {/* Role Selection Cards */}
                <View style={styles.content}>
                    <RoleCard
                        role="customer"
                        title="Customer & Referrals"
                        description="Book services, shop products, and share referrals"
                        icon="person"
                        color={customerColors.primary}
                        onPress={() => handleRoleSelect('customer')}
                        delay={300}
                    />

                    <RoleCard
                        role="technician"
                        title="Technician"
                        description="Accept jobs & manage earnings"
                        icon="construct"
                        color={colors.accent}
                        onPress={() => handleRoleSelect('technician')}
                        delay={400}
                    />

                    <RoleCard
                        role="dealer"
                        title="Dealer"
                        description="Manage inventory & orders"
                        icon="business"
                        color={colors.info}
                        onPress={() => handleRoleSelect('dealer')}
                        delay={500}
                    />
                </View>

                {/* Footer */}
                <FadeInView delay={700} duration={400} style={styles.footer}>
                    <Text style={styles.footerText}>
                        By continuing, you agree to our{' '}
                        <Text style={styles.link}>Terms</Text> & <Text style={styles.link}>Privacy Policy</Text>
                    </Text>
                </FadeInView>
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
    },
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 0,
        marginTop: -12,
    },
    logoBadge: {
        width: 280,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    logoImage: {
        width: 280,
        height: 220,
    },
    appName: {
        ...typography.h1,
        color: '#FFFFFF', // White text for contrast against blue water
        marginBottom: spacing.xs,
        ...(Platform.OS === 'web'
            ? { textShadow: '0px 1px 3px rgba(0, 0, 0, 0.5)' }
            : {
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
            }),
    },
    tagline: {
        ...typography.body,
        color: 'rgba(255, 255, 255, 0.9)', // White/Transparent styling
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: 'flex-end',
        gap: spacing.md,
        paddingBottom: spacing.xl,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.75)', // More transparent/glassy
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        ...shadows.md,
    },
    roleIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    roleTitle: {
        ...typography.h2,
        fontSize: 18,
        color: colors.text,
        marginBottom: 2,
    },
    roleDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 13,
    },
    arrowContainer: {
        padding: spacing.xs,
    },
    footer: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        ...typography.caption,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    link: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
