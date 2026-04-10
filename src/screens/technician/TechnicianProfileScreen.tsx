import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { technicianTheme } from '../../theme/technicianTheme';
import { TechnicianButton, TechnicianCard, TechnicianChip, TechnicianScreen, TechnicianSectionHeader } from '../../components/technician';
import { RootStackParamList } from '../../models/types';
import { useTechnicianStore, useAuthStore, useTechnicianEarnStore } from '../../store';
import { profileService } from '../../services/profileService';
import {
    TECHNICIAN_EARNING_SCHEME,
    getTechnicianSchemeProgress,
} from '../../config/technicianEarningScheme';
import { showTechnicianToast } from '../../utils/technicianToast';

export const TechnicianProfileScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { me, isOnline, fetchMe, reset } = useTechnicianStore();
    const { summary, progress, fetchSummary } = useTechnicianEarnStore();
    const { logout, isLoading } = useAuthStore();

    useFocusEffect(
        React.useCallback(() => {
            void fetchMe();
            void fetchSummary();
        }, [fetchMe, fetchSummary])
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

    const soldCount = progress?.soldQty ?? 0;
    const levelProgress = getTechnicianSchemeProgress(soldCount);
    const currentLevel = levelProgress.currentLevel || TECHNICIAN_EARNING_SCHEME[0];
    const nextLevel = levelProgress.nextLevel;

    const totalEarnings = (summary.totalsPaid || 0) + (summary.totalsApproved || 0);
    const ratingValue = Number(me?.rating_avg || 0);
    const ratingCount = Number(me?.rating_count || 0);
    const completedJobs = Number(me?.completed_jobs || 0);
    const activeJobs = Number(me?.active_jobs || 0);
    const kycLabel = me?.verification_status || 'pending';

    return (
        <TechnicianScreen>
            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={['#031930', '#0B2948', '#0E355F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroGlow} />
                    <View style={styles.heroTopRow}>
                        <View style={styles.avatarWrap}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.heroIdentity}>
                            <Text style={styles.heroName}>{displayName}</Text>
                            <Text style={styles.heroPhone}>{me?.phone || 'Phone not available'}</Text>
                            <View style={styles.heroBadges}>
                                <View
                                    style={[
                                        styles.levelBadge,
                                        {
                                            borderColor: `${currentLevel.color}66`,
                                            backgroundColor: `${currentLevel.color}1E`,
                                        },
                                    ]}
                                >
                                    <Ionicons name={currentLevel.icon} size={13} color={currentLevel.color} />
                                    <Text style={[styles.levelBadgeText, { color: currentLevel.color }]}>{currentLevel.label}</Text>
                                </View>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={12} color="#F2C94C" />
                                    <Text style={styles.ratingText}>
                                        {ratingCount > 0 ? `${ratingValue.toFixed(1)} (${ratingCount})` : 'New'}
                                    </Text>
                                </View>
                                <TechnicianChip label={isOnline ? 'Online' : 'Offline'} tone={isOnline ? 'default' : 'dark'} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.heroLine} />
                    <Text style={styles.heroHint}>
                        {nextLevel
                            ? `Sell ${levelProgress.remainingSales} more products to unlock ${nextLevel.label} (${nextLevel.commissionPercent}%)`
                            : 'Diamond level unlocked. You are on elite earnings.'}
                    </Text>
                </LinearGradient>

                <TechnicianSectionHeader title="Performance Snapshot" subtitle="Your technician stats at a glance" />
                <View style={styles.statsGrid}>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>Jobs Completed</Text>
                        <Text style={styles.statValue}>{completedJobs}</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>Total Earnings</Text>
                        <Text style={styles.statValue}>Rs {totalEarnings.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>Current Level</Text>
                        <Text style={styles.statValue}>{currentLevel.label}</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>Active Jobs</Text>
                        <Text style={styles.statValue}>{activeJobs}</Text>
                    </View>
                </View>

                <TechnicianSectionHeader title="Quick Actions" subtitle="Manage your profile and work quickly" />
                <View style={styles.actionGrid}>
                    <View style={styles.actionCard}>
                        <View style={styles.actionIconWrap}>
                            <Ionicons name="create-outline" size={18} color={technicianTheme.colors.agentPrimary} />
                        </View>
                        <Text style={styles.actionTitle}>Edit Profile</Text>
                        <Text style={styles.actionMeta}>Keep your details up to date</Text>
                        <TechnicianButton
                            title="Open"
                            variant="secondary"
                            onPress={() => showTechnicianToast('Profile editing will be available soon.')}
                            style={styles.actionButton}
                        />
                    </View>

                    <View style={styles.actionCard}>
                        <View style={styles.actionIconWrap}>
                            <Ionicons name="cash-outline" size={18} color={technicianTheme.colors.agentPrimary} />
                        </View>
                        <Text style={styles.actionTitle}>View Earnings</Text>
                        <Text style={styles.actionMeta}>Track commissions and milestones</Text>
                        <TechnicianButton
                            title="Open"
                            variant="secondary"
                            onPress={() => navigation.navigate('TechnicianEarn')}
                            style={styles.actionButton}
                        />
                    </View>

                    <View style={styles.actionCard}>
                        <View style={styles.actionIconWrap}>
                            <Ionicons name="briefcase-outline" size={18} color={technicianTheme.colors.agentPrimary} />
                        </View>
                        <Text style={styles.actionTitle}>View Jobs</Text>
                        <Text style={styles.actionMeta}>Check pending and active requests</Text>
                        <TechnicianButton
                            title="Open"
                            variant="secondary"
                            onPress={() => navigation.navigate('TechnicianJobs')}
                            style={styles.actionButton}
                        />
                    </View>

                    <View style={styles.actionCard}>
                        <View style={styles.actionIconWrap}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={technicianTheme.colors.agentPrimary} />
                        </View>
                        <Text style={styles.actionTitle}>KYC Status</Text>
                        <Text style={styles.actionMeta}>Current status: {kycLabel}</Text>
                        <TechnicianButton
                            title="Review"
                            variant="secondary"
                            onPress={() => navigation.navigate('TechnicianKycUpload')}
                            style={styles.actionButton}
                        />
                    </View>
                </View>

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
    heroCard: {
        borderRadius: technicianTheme.radius.lg,
        padding: technicianTheme.spacing.lg,
        overflow: 'hidden',
        ...technicianTheme.shadows.card,
    },
    heroGlow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 30,
        top: -80,
        right: -60,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: technicianTheme.spacing.sm,
    },
    avatarWrap: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(255,176,0,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,176,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...technicianTheme.typography.h2,
        color: technicianTheme.colors.agentPrimary,
    },
    heroIdentity: {
        flex: 1,
    },
    heroName: {
        ...technicianTheme.typography.h1,
        color: technicianTheme.colors.textOnDark,
    },
    heroPhone: {
        ...technicianTheme.typography.bodySmall,
        color: '#C4D0DB',
        marginTop: 2,
    },
    heroBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: technicianTheme.spacing.md,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: technicianTheme.radius.full,
        borderWidth: 1,
        paddingHorizontal: technicianTheme.spacing.sm,
        paddingVertical: 4,
    },
    levelBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: technicianTheme.radius.full,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: technicianTheme.spacing.sm,
        paddingVertical: 4,
    },
    ratingText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    heroLine: {
        marginTop: technicianTheme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.12)',
    },
    heroHint: {
        ...technicianTheme.typography.caption,
        color: '#DCE6EF',
        marginTop: technicianTheme.spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: technicianTheme.spacing.sm,
    },
    statTile: {
        width: '48%',
        borderRadius: technicianTheme.radius.md,
        borderWidth: 1,
        borderColor: '#EFE4CB',
        backgroundColor: '#FFF9EC',
        padding: technicianTheme.spacing.sm,
    },
    statLabel: {
        ...technicianTheme.typography.caption,
        color: '#8C6510',
    },
    statValue: {
        ...technicianTheme.typography.h2,
        color: technicianTheme.colors.textPrimary,
        marginTop: 6,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: technicianTheme.spacing.sm,
    },
    actionCard: {
        width: '48%',
        borderRadius: technicianTheme.radius.md,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: technicianTheme.colors.border,
        padding: technicianTheme.spacing.sm,
        ...technicianTheme.shadows.card,
    },
    actionIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(255,176,0,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,176,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textPrimary,
        fontWeight: '700',
        marginTop: technicianTheme.spacing.sm,
    },
    actionMeta: {
        ...technicianTheme.typography.caption,
        color: technicianTheme.colors.textSecondary,
        marginTop: 4,
    },
    actionButton: {
        marginTop: technicianTheme.spacing.sm,
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
});
