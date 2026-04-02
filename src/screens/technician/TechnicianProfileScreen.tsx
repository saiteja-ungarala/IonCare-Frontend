import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { technicianTheme } from '../../theme/technicianTheme';
import { TechnicianButton, TechnicianCard, TechnicianChip, TechnicianScreen, TechnicianSectionHeader } from '../../components/technician';
import { useTechnicianStore, useAuthStore } from '../../store';
import { profileService } from '../../services/profileService';

export const TechnicianProfileScreen: React.FC = () => {
    const { me, isOnline, fetchMe, reset } = useTechnicianStore();
    const { logout, isLoading } = useAuthStore();

    useFocusEffect(
        React.useCallback(() => {
            fetchMe();
        }, [fetchMe])
    );

    const doLogout = async () => {
        reset();
        await logout();
    };

    const logoutUser = () => {
        if (Platform.OS === 'web') {
            const confirmed = typeof window !== 'undefined'
                ? window.confirm('Do you want to logout from technician app?')
                : true;

            if (confirmed) {
                void doLogout();
            }
            return;
        }

        Alert.alert('Logout', 'Do you want to logout from technician app?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    void doLogout();
                },
            },
        ]);
    };

    const confirmDeleteAccount = async () => {
        try {
            await profileService.deleteAccount();
            await doLogout();
        } catch (error: any) {
            const message = error?.message || 'We could not delete your account right now.';
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.alert(message);
                return;
            }
            Alert.alert('Delete Account', message);
        }
    };

    const deleteAccount = () => {
        const message = 'This will delete your account from within the app and sign you out. Some order, booking, refund, or compliance records may still be kept where required.';

        if (Platform.OS === 'web') {
            const confirmed = typeof window !== 'undefined' ? window.confirm(message) : true;
            if (confirmed) {
                void confirmDeleteAccount();
            }
            return;
        }

        Alert.alert('Delete Account', message, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete Account',
                style: 'destructive',
                onPress: () => {
                    void confirmDeleteAccount();
                },
            },
        ]);
    };

    const hasBaseLocation = me?.base_lat !== null && me?.base_lng !== null;
    const displayName = me?.full_name || 'Technician User';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'TU';

    return (
        <TechnicianScreen>
            <ScrollView contentContainerStyle={styles.content}>
                <TechnicianSectionHeader title="Profile" subtitle="Technician account settings" />

                <TechnicianCard>
                    <View style={styles.heroTop}>
                        <View style={styles.avatarBadge}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.heroCopy}>
                            <Text style={styles.name}>{displayName}</Text>
                            <Text style={styles.phone}>{me?.phone || 'Phone not available'}</Text>
                        </View>
                    </View>
                    <View style={styles.metaChips}>
                        <TechnicianChip label={me?.verification_status || 'pending'} tone={me?.verification_status === 'approved' ? 'success' : 'warning'} />
                        <TechnicianChip label={isOnline ? 'Online' : 'Offline'} tone={isOnline ? 'default' : 'dark'} />
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Service Radius</Text>
                            <Text style={styles.statValue}>{me?.service_radius_km ?? 0} km</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Base Setup</Text>
                            <Text style={styles.statValue}>{hasBaseLocation ? 'Ready' : 'Pending'}</Text>
                        </View>
                    </View>
                </TechnicianCard>

                <TechnicianCard>
                    <TechnicianSectionHeader title="Work Details" subtitle="Current account and field settings" />
                    <View style={styles.row}>
                        <Text style={styles.label}>Service Radius</Text>
                        <Text style={styles.value}>{me?.service_radius_km ?? 0} km</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Base Location</Text>
                        <Text style={styles.value}>{hasBaseLocation ? 'Configured' : 'Missing'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Last Online</Text>
                        <Text style={styles.value}>{me?.last_online_at ? new Date(me.last_online_at).toLocaleString('en-IN') : 'Not available'}</Text>
                    </View>
                </TechnicianCard>

                <TechnicianCard>
                    <TechnicianSectionHeader title="Additional Profile Info" subtitle="Profile completion placeholder" />
                    <Text style={styles.placeholderText}>
                        Emergency contact details, payout preferences, and technician-specific notes can be surfaced here without changing your existing account logic.
                    </Text>
                </TechnicianCard>

                <TechnicianCard>
                    <TechnicianSectionHeader title="Terms & Conditions" subtitle="Policy placeholder" />
                    <Text style={styles.placeholderText}>
                        Technician onboarding terms, field-service standards, and payout rules can be linked in this section when the final policy content is ready.
                    </Text>
                </TechnicianCard>

                <TechnicianButton
                    title="Logout"
                    variant="secondary"
                    onPress={logoutUser}
                    loading={isLoading}
                    disabled={isLoading}
                />
                <TechnicianButton
                    title="Delete Account"
                    variant="secondary"
                    onPress={deleteAccount}
                    disabled={isLoading}
                />
            </ScrollView>
        </TechnicianScreen>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: technicianTheme.spacing.lg,
        gap: technicianTheme.spacing.md,
        paddingBottom: technicianTheme.spacing.xxl,
    },
    name: {
        ...technicianTheme.typography.h1,
        color: technicianTheme.colors.textPrimary,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: technicianTheme.spacing.md,
    },
    avatarBadge: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#FFF1CC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...technicianTheme.typography.h2,
        color: '#7A5200',
    },
    heroCopy: {
        flex: 1,
    },
    phone: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textSecondary,
        marginTop: 4,
    },
    metaChips: {
        flexDirection: 'row',
        gap: technicianTheme.spacing.sm,
        marginTop: technicianTheme.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: technicianTheme.spacing.sm,
        marginTop: technicianTheme.spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: technicianTheme.radius.md,
        borderWidth: 1,
        borderColor: '#F0E1B8',
        backgroundColor: '#FFF7E2',
        padding: technicianTheme.spacing.sm,
    },
    statLabel: {
        ...technicianTheme.typography.caption,
        color: '#7D5A0A',
    },
    statValue: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textPrimary,
        marginTop: 4,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: technicianTheme.spacing.sm,
        gap: technicianTheme.spacing.md,
    },
    label: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textSecondary,
        flex: 1,
    },
    value: {
        ...technicianTheme.typography.caption,
        color: technicianTheme.colors.textPrimary,
        textAlign: 'right',
        flex: 1,
    },
    placeholderText: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textSecondary,
    },
});
