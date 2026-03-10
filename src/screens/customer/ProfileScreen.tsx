// Profile Screen — Premium design with enhanced visuals

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useAuthStore } from '../../store';
import { profileService } from '../../services/profileService';

type ProfileScreenProps = { navigation: NativeStackNavigationProp<any> };

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuIcon, danger && { backgroundColor: colors.error + '12' }]}>
            <Ionicons name={icon} size={20} color={danger ? colors.error : customerColors.primary} />
        </View>
        <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, danger && { color: colors.error }]} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.menuArrow}>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
    </TouchableOpacity>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const { user, logout } = useAuthStore();
    const [referralCode, setReferralCode] = useState(user?.referralCode || '');
    const [profileName, setProfileName] = useState(user?.name || 'User');
    const [profilePhone, setProfilePhone] = useState(user?.phone || '');

    // Fetch real profile data on focus
    useFocusEffect(useCallback(() => {
        let isActive = true;

        profileService.getProfile()
            .then((p) => {
                if (!isActive || !p) return;

                setReferralCode(p.referral_code || '');
                setProfileName(p.full_name || 'User');
                setProfilePhone(p.phone || '');
                // Also update the auth store so other screens see it
                useAuthStore.setState((s) => ({
                    user: s.user ? {
                        ...s.user,
                        name: p.full_name,
                        phone: p.phone,
                        referralCode: p.referral_code,
                    } : s.user,
                }));
            })
            .catch((error) => {
                console.error('[ProfileScreen] Failed to load profile on focus:', error);
            });

        return () => {
            isActive = false;
        };
    }, []));

    const handleCopyReferral = async () => {
        if (!referralCode) return;
        await Clipboard.setStringAsync(referralCode);
        Alert.alert('Copied!', 'Referral code copied to clipboard');
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to logout?');
            if (confirmed) {
                logout();
            }
        } else {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Card with gradient */}
                <View style={styles.profileCard}>
                    <LinearGradient
                        colors={[customerColors.primaryLight, '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.profileGradient}
                    >
                        <View style={styles.profileRow}>
                            <View style={styles.avatar}>
                                <LinearGradient
                                    colors={[customerColors.primary, customerColors.primaryDark]}
                                    style={styles.avatarGradient}
                                >
                                    <Text style={styles.avatarLetter}>
                                        {profileName.charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
                                <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
                                <Text style={styles.profilePhone} numberOfLines={1}>{profilePhone}</Text>
                            </View>
                            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
                                <Ionicons name="pencil" size={16} color={customerColors.primary} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Referral Code Card */}
                <TouchableOpacity style={styles.referralCard} onPress={handleCopyReferral} activeOpacity={0.7}>
                    <View style={styles.referralAccent} />
                    <View style={styles.referralInner}>
                        <View>
                            <Text style={styles.referralTitle}>Refer & Earn</Text>
                            <Text style={styles.referralSubtitle}>Share your code</Text>
                        </View>
                        <View style={styles.codeContainer}>
                            <Text style={styles.referralCode}>{referralCode || '...'}</Text>
                            <View style={styles.copyIcon}>
                                <Ionicons name="copy-outline" size={16} color={'#7FA650'} />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <View style={styles.menuCard}>
                        <MenuItem
                            icon="wallet-outline"
                            title="My Wallet"
                            subtitle="Balance, Earnings, History"
                            onPress={() => navigation.navigate('Wallet')}
                        />
                        <MenuItem
                            icon="receipt-outline"
                            title="Order History"
                            subtitle="Purchased products & delivery status"
                            onPress={() => navigation.navigate('OrderHistory', { enableBack: true })}
                        />
                        <MenuItem icon="location-outline" title="Addresses" subtitle="Manage delivery addresses" onPress={() => navigation.navigate('Addresses')} />
                        <MenuItem icon="card-outline" title="Payment Methods" subtitle="Cards, UPI, Wallets" onPress={() => navigation.navigate('PaymentMethods')} />
                        <MenuItem icon="notifications-outline" title="Notifications" subtitle="Manage preferences" onPress={() => navigation.navigate('Notifications')} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT</Text>
                    <View style={styles.menuCard}>
                        <MenuItem icon="help-circle-outline" title="Help & FAQ" onPress={() => navigation.navigate('HelpFAQ')} />
                        <MenuItem icon="chatbubble-outline" title="Contact Us" onPress={() => navigation.navigate('ContactUs')} />
                        <MenuItem icon="document-text-outline" title="Terms & Conditions" onPress={() => navigation.navigate('Terms')} />
                        <MenuItem icon="shield-outline" title="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.menuCard}>
                        <MenuItem icon="log-out-outline" title="Logout" onPress={handleLogout} danger />
                    </View>
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingVertical: spacing.md + 2,
        backgroundColor: '#FFFFFF',
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
    },
    backButton: {
        marginRight: spacing.md,
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    scrollView: { flex: 1, padding: spacing.md },
    profileCard: {
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: spacing.md,
        shadowColor: 'rgba(0, 184, 217, 0.12)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
        backgroundColor: '#FFFFFF',
    },
    profileGradient: {
        padding: spacing.lg,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: spacing.md,
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
        flexShrink: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 2,
        fontWeight: '500',
    },
    profilePhone: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    editButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: customerColors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referralCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: 'rgba(127, 166, 80, 0.15)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    referralAccent: {
        height: 3,
        backgroundColor: '#7FA650',
    },
    referralInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    referralTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D5016',
        marginBottom: 2,
    },
    referralSubtitle: {
        fontSize: 12,
        color: '#5B7A3D',
        fontWeight: '500',
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: '#F1F8E9',
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.sm + 2,
        borderRadius: 10,
    },
    referralCode: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D5016',
    },
    copyIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(127, 166, 80, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: { marginTop: spacing.md },
    sectionTitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingVertical: spacing.md + 2,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F7F9',
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: customerColors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    menuContent: {
        flex: 1,
        flexShrink: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    menuArrow: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#F5F7F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.xs,
    },
    version: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
        fontWeight: '500',
    },
});
