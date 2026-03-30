import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TechnicianJob, RootStackParamList } from '../../models/types';
import { technicianTheme } from '../../theme/technicianTheme';
import { TechnicianButton, TechnicianCard, TechnicianChip, TechnicianScreen, TechnicianSectionHeader } from '../../components/technician';
import { useTechnicianEarnStore, useTechnicianStore } from '../../store';
import { showTechnicianToast } from '../../utils/technicianToast';

type TechnicianJobsScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'TechnicianJobs'>;
};

type FilterType = 'all' | 'nearby' | 'today' | 'urgent';

const FILTERS: Array<{ id: FilterType; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'nearby', label: 'Nearby' },
    { id: 'today', label: 'Today' },
    { id: 'urgent', label: 'Urgent' },
];

const toDateTimeValue = (date: string, time: string) => {
    const parsed = new Date(`${date}T${time || '00:00:00'}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatSlot = (date: string, time: string) => {
    const parsed = toDateTimeValue(date, time);
    if (!parsed) return `${date} ${time}`.trim();
    return parsed.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const isTodayDate = (date: string, time: string): boolean => {
    const parsed = toDateTimeValue(date, time);
    if (!parsed) return false;
    const now = new Date();
    return parsed.getDate() === now.getDate() && parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
};

const statusTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    if (status === 'completed') return 'success';
    if (status === 'in_progress' || status === 'assigned') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'default';
};

export const TechnicianJobsScreen: React.FC<TechnicianJobsScreenProps> = ({ navigation }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [refreshing, setRefreshing] = useState(false);

    const {
        me,
        isOnline,
        jobs,
        jobsMeta,
        loading,
        error,
        fetchMe,
        fetchJobs,
        toggleOnline,
        accept,
        reject,
        clearError,
    } = useTechnicianStore();
    const {
        campaigns,
        activeCampaignId,
        progress,
        fetchSummary,
        fetchCampaigns,
    } = useTechnicianEarnStore();

    const loadData = useCallback(async () => {
        const profile = await fetchMe();
        if (!profile) return;

        if (profile.profile.verification_status !== 'approved') {
            navigation.reset({ index: 0, routes: [{ name: 'TechnicianEntry' }] });
            return;
        }

        await fetchJobs();
        await Promise.all([fetchSummary(), fetchCampaigns()]);
    }, [fetchCampaigns, fetchJobs, fetchMe, fetchSummary, navigation]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    useFocusEffect(
        useCallback(() => {
            if (!isOnline) return;

            const interval = setInterval(() => {
                fetchJobs();
            }, 50000);

            return () => clearInterval(interval);
        }, [isOnline, fetchJobs])
    );

    useEffect(() => {
        if (!error) return;
        showTechnicianToast(error);
        clearError();
    }, [clearError, error]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const hasActiveJob = useMemo(
        () => jobs.some((j) => j.status === 'assigned' || j.status === 'in_progress'),
        [jobs]
    );

    const filteredJobs = useMemo(() => {
        const availableJobs = jobs.filter((job) => job.status === 'pending' || job.status === 'confirmed');

        return availableJobs.filter((job) => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'nearby') return job.distance_km !== null;
            if (activeFilter === 'today') return isTodayDate(job.scheduled_date, job.scheduled_time);
            if (activeFilter === 'urgent') {
                const slot = toDateTimeValue(job.scheduled_date, job.scheduled_time);
                if (!slot) return true;
                return slot.getTime() - Date.now() <= 6 * 60 * 60 * 1000;
            }
            return true;
        });
    }, [activeFilter, jobs]);

    const activeCampaign = useMemo(() => {
        if (activeCampaignId) {
            const campaign = campaigns.find((item) => item.id === activeCampaignId);
            if (campaign) return campaign;
        }
        return campaigns[0] || null;
    }, [activeCampaignId, campaigns]);

    const nextTier = useMemo(() => {
        if (!activeCampaign || !progress || progress.nextThreshold === null) return null;
        return activeCampaign.tiers.find((tier) => tier.thresholdQty === progress.nextThreshold) || null;
    }, [activeCampaign, progress]);

    const emptyStateContent = useMemo(() => {
        if (!isOnline) {
            return { title: 'You are offline', subtitle: 'Go online to see available jobs.' };
        }
        if (jobsMeta && !jobsMeta.distance_filter_applied && jobsMeta.note) {
            return { title: 'No jobs visible', subtitle: jobsMeta.note };
        }
        if (jobsMeta?.distance_filter_applied && jobsMeta.service_radius_km !== undefined) {
            return {
                title: 'No nearby jobs',
                subtitle: `No available jobs within ${jobsMeta.service_radius_km} km of your location. Pull to refresh.`,
            };
        }
        return { title: 'No jobs right now', subtitle: 'Pull to refresh to check for new requests.' };
    }, [isOnline, jobsMeta]);

    const earnBannerMessage = useMemo(() => {
        if (activeCampaign && progress && nextTier) {
            return `Sell ${progress.remainingToNextThreshold} more to earn Rs ${nextTier.bonusAmount.toLocaleString('en-IN')} bonus`;
        }
        if (activeCampaign && progress) {
            return `Campaign progress: ${progress.soldQty} sold so far`;
        }
        return 'Track referral earnings and campaign bonuses';
    }, [activeCampaign, progress, nextTier]);

    const handleAccept = async (bookingId: string) => {
        const ok = await accept(bookingId);
        if (!ok) return;
        showTechnicianToast('Job accepted');
        await fetchJobs();
        navigation.navigate('TechnicianActiveJob');
    };

    const handleReject = async (bookingId: string) => {
        const ok = await reject(bookingId);
        if (!ok) return;
        showTechnicianToast('Job rejected');
        await fetchJobs();
    };

    const handleOnlineToggle = (nextValue: boolean) => {
        void toggleOnline(nextValue);
    };

    const renderJob = ({ item }: { item: TechnicianJob }) => {
        const location = [item.address_city, item.address_line1].filter(Boolean).join(', ');

        return (
            <TechnicianCard style={styles.jobCard}>
                <View style={styles.topRow}>
                    <Text style={styles.serviceName}>{item.service_name || 'Service job'}</Text>
                    <TechnicianChip label={item.status.replace('_', ' ')} tone={statusTone(item.status)} />
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={14} color={technicianTheme.colors.textSecondary} />
                    <Text style={styles.infoText}>{formatSlot(item.scheduled_date, item.scheduled_time)}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={technicianTheme.colors.textSecondary} />
                    <Text style={styles.infoText} numberOfLines={1}>{location || 'Address not available'}</Text>
                </View>

                <View style={styles.actions}>
                    <TechnicianButton
                        title="Reject"
                        variant="secondary"
                        onPress={() => handleReject(item.id)}
                        disabled={loading.action}
                        style={styles.actionBtn}
                    />
                    <TechnicianButton
                        title="Accept"
                        onPress={() => handleAccept(item.id)}
                        disabled={loading.action || hasActiveJob}
                        style={styles.actionBtn}
                    />
                </View>
            </TechnicianCard>
        );
    };

    return (
        <TechnicianScreen>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Jobs</Text>
                    <Text style={styles.headerSubtitle}>Find and accept nearby service requests</Text>
                </View>
                <View style={styles.onlineWrap}>
                    <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
                    <Switch
                        value={isOnline}
                        onValueChange={handleOnlineToggle}
                        trackColor={{ false: '#D1D7DE', true: technicianTheme.colors.agentPrimary }}
                        thumbColor={isOnline ? '#3D2A00' : '#6B7885'}
                        disabled={loading.online}
                    />
                </View>
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[styles.filterPill, activeFilter === filter.id ? styles.filterPillActive : null]}
                        onPress={() => setActiveFilter(filter.id)}
                    >
                        <Text style={[styles.filterText, activeFilter === filter.id ? styles.filterTextActive : null]}>{filter.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {hasActiveJob && (
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.activeJobBanner}
                    onPress={() => navigation.navigate('TechnicianActiveJob')}
                >
                    <Ionicons name="flash" size={14} color="#FFFFFF" />
                    <Text style={styles.activeJobBannerText}>You have an active job — tap to manage it</Text>
                    <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.earnBanner}
                onPress={() => navigation.navigate('TechnicianEarn')}
            >
                <View style={styles.earnBannerLeft}>
                    <Text style={styles.earnBannerTitle}>{activeCampaign?.name || 'Earn More'}</Text>
                    <Text style={styles.earnBannerText}>{earnBannerMessage}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={technicianTheme.colors.agentPrimary} />
            </TouchableOpacity>

            <FlatList
                data={filteredJobs}
                keyExtractor={(item) => item.id}
                renderItem={renderJob}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing || loading.jobs} onRefresh={onRefresh} tintColor={technicianTheme.colors.agentPrimary} />}
                ListHeaderComponent={<TechnicianSectionHeader title="Available Jobs" subtitle={`${filteredJobs.length} jobs`} />}
                ListEmptyComponent={
                    <TechnicianCard style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>{emptyStateContent.title}</Text>
                        <Text style={styles.emptySubtitle}>{emptyStateContent.subtitle}</Text>
                    </TechnicianCard>
                }
            />
        </TechnicianScreen>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: technicianTheme.colors.agentDark,
        paddingHorizontal: technicianTheme.spacing.lg,
        paddingTop: technicianTheme.spacing.md,
        paddingBottom: technicianTheme.spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        ...technicianTheme.typography.h1,
        color: technicianTheme.colors.textOnDark,
    },
    headerSubtitle: {
        ...technicianTheme.typography.bodySmall,
        color: '#AAB6C2',
        marginTop: 2,
    },
    onlineWrap: {
        alignItems: 'center',
        gap: 6,
    },
    onlineText: {
        ...technicianTheme.typography.caption,
        color: technicianTheme.colors.agentPrimary,
    },
    filterRow: {
        flexDirection: 'row',
        gap: technicianTheme.spacing.sm,
        paddingHorizontal: technicianTheme.spacing.lg,
        marginTop: -14,
    },
    activeJobBanner: {
        marginTop: technicianTheme.spacing.md,
        marginHorizontal: technicianTheme.spacing.lg,
        borderRadius: technicianTheme.radius.md,
        backgroundColor: '#2563EB',
        paddingHorizontal: technicianTheme.spacing.md,
        paddingVertical: technicianTheme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: technicianTheme.spacing.sm,
    },
    activeJobBannerText: {
        ...technicianTheme.typography.bodySmall,
        color: '#FFFFFF',
        flex: 1,
        fontWeight: '600',
    },
    earnBanner: {
        marginTop: technicianTheme.spacing.md,
        marginHorizontal: technicianTheme.spacing.lg,
        borderRadius: technicianTheme.radius.md,
        borderWidth: 1,
        borderColor: '#F6D485',
        backgroundColor: '#FFF4D6',
        paddingHorizontal: technicianTheme.spacing.md,
        paddingVertical: technicianTheme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: technicianTheme.spacing.sm,
    },
    earnBannerLeft: {
        flex: 1,
    },
    earnBannerTitle: {
        ...technicianTheme.typography.caption,
        color: '#6E4C00',
    },
    earnBannerText: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textPrimary,
        marginTop: 2,
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: technicianTheme.radius.full,
        backgroundColor: technicianTheme.colors.agentSurface,
        borderWidth: 1,
        borderColor: technicianTheme.colors.border,
    },
    filterPillActive: {
        borderColor: technicianTheme.colors.agentPrimary,
        backgroundColor: '#FFEBC1',
    },
    filterText: {
        ...technicianTheme.typography.caption,
        color: technicianTheme.colors.textSecondary,
    },
    filterTextActive: {
        color: '#815900',
    },
    listContent: {
        paddingHorizontal: technicianTheme.spacing.lg,
        paddingTop: technicianTheme.spacing.md,
        paddingBottom: technicianTheme.spacing.xxl,
        gap: technicianTheme.spacing.md,
    },
    jobCard: {
        gap: 8,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: technicianTheme.spacing.sm,
    },
    serviceName: {
        ...technicianTheme.typography.h2,
        color: technicianTheme.colors.textPrimary,
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textSecondary,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: technicianTheme.spacing.sm,
        marginTop: technicianTheme.spacing.sm,
    },
    actionBtn: {
        flex: 1,
    },
    emptyCard: {
        marginTop: technicianTheme.spacing.md,
    },
    emptyTitle: {
        ...technicianTheme.typography.h2,
        color: technicianTheme.colors.textPrimary,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...technicianTheme.typography.bodySmall,
        color: technicianTheme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
    },
});
