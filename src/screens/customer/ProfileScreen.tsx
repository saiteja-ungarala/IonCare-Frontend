// Profile Screen

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
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
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.menuIcon, danger && { backgroundColor: colors.error + '20' }]}>
            <Ionicons name={icon} size={22} color={danger ? colors.error : colors.primary} />
        </View>
        <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, danger && { color: colors.error }]}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color={colors.primary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profileName}</Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>
                        <Text style={styles.profilePhone}>{profilePhone}</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Referral Code Card */}
                <TouchableOpacity style={styles.referralCard} onPress={handleCopyReferral} activeOpacity={0.7}>
                    <View>
                        <Text style={styles.referralTitle}>Refer & Earn</Text>
                        <Text style={styles.referralSubtitle}>Share your code</Text>
                    </View>
                    <View style={styles.codeContainer}>
                        <Text style={styles.referralCode}>{referralCode || '...'}</Text>
                        <Ionicons name="copy-outline" size={18} color={'#7FA650'} />
                    </View>
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
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
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.menuCard}>
                        <MenuItem icon="help-circle-outline" title="Help & FAQ" onPress={() => navigation.navigate('HelpFAQ')} />
                        <MenuItem icon="chatbubble-outline" title="Contact Us" onPress={() => navigation.navigate('ContactUs')} />
                        <MenuItem icon="document-text-outline" title="Terms & Conditions" onPress={() => navigation.navigate('Terms')} />
                        <MenuItem icon="shield-outline" title="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.menuCard}>
                        <MenuItem icon="log-out-outline" title="Logout" onPress={handleLogout} />
                    </View>
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { marginRight: spacing.md },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    scrollView: { flex: 1, padding: spacing.md },
    profileCard: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm, marginBottom: spacing.md },
    avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    profileInfo: { flex: 1, justifyContent: 'center' },
    profileName: { ...typography.h2, fontSize: 18, color: colors.text, marginBottom: 2 },
    profileEmail: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 2 },
    profilePhone: { ...typography.bodySmall, color: colors.textSecondary },
    editButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
    referralCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    referralTitle: { ...typography.h2, fontSize: 16, color: colors.primary, marginBottom: 2 },
    referralSubtitle: { ...typography.caption, color: colors.textSecondary },
    codeContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm },
    referralCode: { ...typography.body, fontWeight: '700', color: colors.text },
    section: { marginTop: spacing.md },
    sectionTitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm, paddingHorizontal: spacing.xs, textTransform: 'uppercase', fontWeight: '700' },
    menuCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    menuContent: { flex: 1 },
    menuTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 2 },
    menuSubtitle: { ...typography.caption, color: colors.textSecondary },
    version: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
});
