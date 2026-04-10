// TechnicianEarnScreen — Premium dashboard with levels + progress
// Amber/dark theme, glass cards, animated progress bar

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated, Dimensions, Easing, RefreshControl,
    ScrollView, Share, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TechnicianCampaign, TechnicianProductCommissionPreview, RootStackParamList } from '../../models/types';
import { TechnicianButton, TechnicianCard, TechnicianChip, TechnicianScreen, TechnicianSectionHeader } from '../../components/technician';
import { technicianTheme as T } from '../../theme/technicianTheme';
import { useTechnicianEarnStore, useTechnicianStore } from '../../store';
import { showTechnicianToast } from '../../utils/technicianToast';
import {
    TECHNICIAN_EARNING_SCHEME,
    getTechnicianSchemeMotivation,
    getTechnicianSchemeProgress,
} from '../../config/technicianEarningScheme';

const { width: W } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'TechnicianEarn'> };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const daysLeft = (endAt?: string): number | null => {
    if (!endAt) return null;
    const d = new Date(endAt);
    if (isNaN(d.getTime())) return null;
    const diff = d.getTime() - Date.now();
    return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
};

const getActiveCampaign = (campaigns: TechnicianCampaign[], id: number | null) =>
    (id ? campaigns.find((c) => c.id === id) : null) ?? campaigns[0] ?? null;

const commissionText = (item: TechnicianProductCommissionPreview) => {
    if (!item.commissionType || item.commissionValue === null) return 'Details soon';
    if (item.commissionType === 'flat') return `${fmt(item.commissionValue)} / unit`;
    const hint = item.commissionAmount !== null ? ` (~${fmt(item.commissionAmount)})` : '';
    return `${item.commissionValue}%${hint}`;
};

// ── Level config ──────────────────────────────────────────────────────────────
// ── Animated progress bar ─────────────────────────────────────────────────────
const ProgressBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, {
            toValue: Math.min(pct, 1),
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [pct]);

    return (
        <View style={pb.track}>
            <Animated.View style={[pb.fill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
        </View>
    );
};
const pb = StyleSheet.create({
    track: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
    fill:  { height: '100%', borderRadius: 5 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export const TechnicianEarnScreen: React.FC<Props> = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const {
        referralCode, summary, campaigns, activeCampaignId,
        progress, productsWithCommissionPreview, loading, error,
        refreshAll, fetchSummary, clearError,
    } = useTechnicianEarnStore();
    const { isOnline } = useTechnicianStore();

    const activeCampaign = useMemo(() => getActiveCampaign(campaigns, activeCampaignId), [campaigns, activeCampaignId]);
    const sold = progress?.soldQty ?? 0;
    const nextThreshold = progress?.nextThreshold ?? null;
    const schemeProgress = useMemo(() => getTechnicianSchemeProgress(sold), [sold]);
    const currentLevel = schemeProgress.currentLevel;
    const nextLevel = schemeProgress.nextLevel;
    const progressPct = schemeProgress.normalizedProgress;
    const motivationText = useMemo(() => getTechnicianSchemeMotivation(sold), [sold]);

    useFocusEffect(useCallback(() => { void refreshAll(); }, [refreshAll]));
    useFocusEffect(useCallback(() => {
        if (!isOnline) return;
        const id = setInterval(() => void fetchSummary(), 60_000);
        return () => clearInterval(id);
    }, [isOnline, fetchSummary]));

    useEffect(() => {
        if (!error) return;
        showTechnicianToast(error);
        clearError();
    }, [error, clearError]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshAll();
        setRefreshing(false);
    }, [refreshAll]);

    const copyCode = async () => {
        if (!referralCode) { showTechnicianToast('Code not available yet.'); return; }
        await Clipboard.setStringAsync(referralCode);
        showTechnicianToast('Referral code copied');
    };

    const shareCode = async () => {
        if (!referralCode) { showTechnicianToast('Code not available yet.'); return; }
        await Share.share({ message: `Get IONORA CARE products — use my code ${referralCode} at checkout.` });
    };

    const shareProduct = async (item: TechnicianProductCommissionPreview) => {
        if (!referralCode) { showTechnicianToast('Code not available yet.'); return; }
        await Share.share({ message: `Recommended: ${item.name}. Use my code ${referralCode} to support me.` });
    };

    const days = daysLeft(activeCampaign?.endAt);

    return (
        <TechnicianScreen>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing || loading.refresh}
                        onRefresh={onRefresh}
                        tintColor={T.colors.agentPrimary}
                    />
                }
            >
                {/* ── Hero earnings card ── */}
                <LinearGradient
                    colors={['#031930', '#0A2745', '#0D3460']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroRing} />

                    {/* Level badge */}
                    <View style={[styles.levelBadge, { backgroundColor: (currentLevel?.color || T.colors.agentPrimary) + '22', borderColor: (currentLevel?.color || T.colors.agentPrimary) + '55' }]}>
                        <Ionicons name={currentLevel?.icon || 'medal'} size={14} color={currentLevel?.color || T.colors.agentPrimary} />
                        <Text style={[styles.levelBadgeText, { color: currentLevel?.color || T.colors.agentPrimary }]}>
                            {(currentLevel?.label || 'Silver')} Level
                        </Text>
                    </View>

                    <Text style={styles.heroLabel}>Total Earnings</Text>
                    <Text style={styles.heroAmount}>{fmt(summary.totalsPaid + summary.totalsApproved)}</Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        {[
                            { label: 'Pending',  value: fmt(summary.totalsPending),  color: '#FFD166' },
                            { label: 'Approved', value: fmt(summary.totalsApproved), color: '#06D6A0' },
                            { label: 'Paid',     value: fmt(summary.totalsPaid),     color: '#90E0EF' },
                        ].map((s) => (
                            <View key={s.label} style={styles.statPill}>
                                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Referral code row */}
                    <View style={styles.codeRow}>
                        <View style={styles.codePill}>
                            <Text style={styles.codeText}>{referralCode || '—'}</Text>
                        </View>
                        <TouchableOpacity style={styles.codeAction} onPress={copyCode}>
                            <Ionicons name="copy-outline" size={16} color={T.colors.agentPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.codeAction} onPress={shareCode}>
                            <Ionicons name="share-social-outline" size={16} color={T.colors.agentPrimary} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* ── Level progress card ── */}
                <View style={styles.levelCard}>
                    <View style={styles.levelHeader}>
                        <View style={[styles.levelIconWrap, { backgroundColor: (currentLevel?.color || T.colors.agentPrimary) + '18' }]}>
                            <Ionicons name={currentLevel?.icon || 'medal'} size={20} color={currentLevel?.color || T.colors.agentPrimary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.levelTitle}>{currentLevel ? `${currentLevel.label} Level` : 'Scheme Progress'}</Text>
                            <Text style={styles.levelSub}>
                                {nextLevel
                                    ? `${sold} / ${nextLevel.minSales} products sold`
                                    : `${sold} products sold - Diamond unlocked`}
                            </Text>
                        </View>
                        {nextLevel && (
                            <Text style={styles.levelRemaining}>
                                {schemeProgress.remainingSales} to next
                            </Text>
                        )}
                    </View>
                    <Text style={styles.schemeHeadline}>{motivationText}</Text>
                    <Text style={styles.schemeSubline}>
                        {nextLevel
                            ? `Current commission: ${currentLevel?.commissionPercent || 0}% | Next unlock: ${nextLevel.commissionPercent}%`
                            : 'Current commission: 40% | Diamond level unlocked'}
                    </Text>

                    {/* Level track */}
                    <View style={styles.levelTrack}>
                        {TECHNICIAN_EARNING_SCHEME.map((l, i) => {
                            const active = sold >= l.minSales;
                            return (
                                <React.Fragment key={l.label}>
                                    <View style={[styles.levelDot, { backgroundColor: active ? l.color : T.colors.border }]}>
                                        {active && <Ionicons name="checkmark" size={10} color="#fff" />}
                                    </View>
                                    {i < TECHNICIAN_EARNING_SCHEME.length - 1 && (
                                        <View style={[styles.levelConnector, { backgroundColor: sold >= TECHNICIAN_EARNING_SCHEME[i + 1].minSales ? TECHNICIAN_EARNING_SCHEME[i + 1].color : T.colors.border }]} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>

                    <View style={styles.levelLabels}>
                        {TECHNICIAN_EARNING_SCHEME.map((l) => (
                            <Text key={l.label} style={[styles.levelDotLabel, sold >= l.minSales && { color: l.color }]}>{l.label}</Text>
                        ))}
                    </View>

                    <View style={styles.schemeGrid}>
                        {TECHNICIAN_EARNING_SCHEME.map((levelItem) => (
                            <View key={levelItem.id} style={styles.schemeTile}>
                                <Text style={styles.schemeTileTitle}>{levelItem.label}</Text>
                                <Text style={styles.schemeTileMeta}>{levelItem.minSales} sales</Text>
                                <Text style={[styles.schemeTilePct, { color: levelItem.color }]}>{levelItem.commissionPercent}% commission</Text>
                            </View>
                        ))}
                    </View>

                    {/* Withdrawal unlock */}
                    <View style={styles.withdrawRow}>
                        <Ionicons name="lock-closed" size={14} color={sold >= 20 ? T.colors.success : T.colors.agentMuted} />
                        <Text style={[styles.withdrawText, sold >= 20 && { color: T.colors.success }]}>
                            {sold >= 20
                                ? 'Withdrawal unlocked this month'
                                : `Complete ${20 - Math.min(sold, 20)} more services to unlock withdrawal`}
                        </Text>
                    </View>
                </View>

                {/* ── Campaign card ── */}
                {activeCampaign && (
                    <View style={styles.campaignCard}>
                        <View style={styles.campaignHeader}>
                            <View>
                                <Text style={styles.campaignName}>{activeCampaign.name}</Text>
                                <Text style={styles.campaignMeta}>
                                    {days !== null ? `${days} day${days === 1 ? '' : 's'} left` : 'Ongoing'}
                                </Text>
                            </View>
                            <View style={styles.campaignBadge}>
                                <Ionicons name="gift-outline" size={18} color={T.colors.agentPrimary} />
                                <Text style={styles.campaignBadgeText}>Active</Text>
                            </View>
                        </View>

                        <LinearGradient
                            colors={['#031930', '#0A2745']}
                            style={styles.campaignProgress}
                        >
                            <View style={styles.campaignProgressHeader}>
                                <Text style={styles.campaignProgressLabel}>Campaign Progress</Text>
                                <Text style={styles.campaignProgressPct}>{`${Math.round(progressPct * 100)}%`}</Text>
                            </View>
                            <ProgressBar pct={progressPct} color={T.colors.agentPrimary} />
                            <View style={styles.campaignProgressMeta}>
                                <Text style={styles.campaignMetaText}>Sold: {sold}</Text>
                                <Text style={styles.campaignMetaText}>Next: {nextThreshold ?? nextLevel?.minSales ?? '—'}</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.bonusRow}>
                            <Text style={styles.bonusText}>Bonuses pending: {fmt(summary.bonusPending)}</Text>
                            <Text style={styles.bonusText}>Bonuses paid: {fmt(summary.bonusPaid)}</Text>
                        </View>

                        <TechnicianButton
                            title="View milestones"
                            variant="secondary"
                            onPress={() => {
                                if (!activeCampaign) return;
                                navigation.navigate('TechnicianCampaignMilestones', { campaignId: activeCampaign.id });
                            }}
                        />
                    </View>
                )}

                {/* ── Products ── */}
                <TechnicianSectionHeader
                    title="Top Products to Sell"
                    subtitle={`${productsWithCommissionPreview.length} products`}
                />

                {productsWithCommissionPreview.length === 0 ? (
                    <TechnicianCard>
                        <Text style={styles.emptyTitle}>No products right now</Text>
                        <Text style={styles.emptySub}>Pull to refresh for the latest commission previews.</Text>
                    </TechnicianCard>
                ) : (
                    productsWithCommissionPreview.map((item) => (
                        <TechnicianCard key={item.id} style={styles.productCard}>
                            <View style={styles.productTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{item.name}</Text>
                                    <Text style={styles.productPrice}>{fmt(item.price)}</Text>
                                </View>
                                <TechnicianChip
                                    label={item.commissionType ? commissionText(item) : 'No rule'}
                                    tone={item.commissionType ? 'success' : 'dark'}
                                />
                            </View>
                            <View style={styles.productActions}>
                                <TechnicianButton title="Share" variant="secondary" style={{ flex: 1 }} onPress={() => void shareProduct(item)} />
                                <TechnicianButton title="Copy Code" style={{ flex: 1 }} onPress={() => void copyCode()} />
                            </View>
                        </TechnicianCard>
                    ))
                )}
            </ScrollView>
        </TechnicianScreen>
    );
};

const styles = StyleSheet.create({
    content: { padding: T.spacing.lg, gap: T.spacing.md, paddingBottom: T.spacing.xxl },

    // Hero
    heroCard: {
        borderRadius: T.radius.lg, padding: T.spacing.lg,
        overflow: 'hidden', ...T.shadows.card,
    },
    heroRing: {
        position: 'absolute', width: 240, height: 240, borderRadius: 120,
        borderWidth: 40, borderColor: 'rgba(255,255,255,0.04)', top: -80, right: -60,
    },
    levelBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start', borderRadius: T.radius.full,
        borderWidth: 1, paddingHorizontal: T.spacing.sm, paddingVertical: 4,
        marginBottom: T.spacing.sm,
    },
    levelBadgeText: { fontSize: 12, fontWeight: '700' },
    heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
    heroAmount: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: T.spacing.md },
    statsRow: { flexDirection: 'row', gap: T.spacing.sm, marginBottom: T.spacing.md },
    statPill: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: T.radius.md, padding: T.spacing.sm, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    statValue: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.sm },
    codePill: {
        flex: 1, backgroundColor: 'rgba(255,176,0,0.12)',
        borderRadius: T.radius.md, paddingVertical: T.spacing.sm,
        paddingHorizontal: T.spacing.md, borderWidth: 1, borderColor: 'rgba(255,176,0,0.3)',
    },
    codeText: { fontSize: 15, fontWeight: '800', color: T.colors.agentPrimary, letterSpacing: 2 },
    codeAction: {
        width: 40, height: 40, borderRadius: T.radius.md,
        backgroundColor: 'rgba(255,176,0,0.1)', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,176,0,0.2)',
    },

    // Level card
    levelCard: {
        backgroundColor: '#fff', borderRadius: T.radius.lg,
        padding: T.spacing.lg, ...T.shadows.card,
    },
    levelHeader: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.md, marginBottom: T.spacing.lg },
    levelIconWrap: { width: 44, height: 44, borderRadius: T.radius.md, alignItems: 'center', justifyContent: 'center' },
    levelTitle: { fontSize: 16, fontWeight: '700', color: T.colors.textPrimary },
    levelSub: { fontSize: 12, color: T.colors.textSecondary, marginTop: 2 },
    levelRemaining: { fontSize: 12, fontWeight: '700', color: T.colors.agentPrimary },
    schemeHeadline: { fontSize: 14, fontWeight: '700', color: T.colors.textPrimary, marginBottom: 4 },
    schemeSubline: { fontSize: 12, color: T.colors.textSecondary, marginBottom: T.spacing.md },
    levelTrack: { flexDirection: 'row', alignItems: 'center', marginBottom: T.spacing.xs },
    levelDot: {
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    levelConnector: { flex: 1, height: 3, borderRadius: 2 },
    levelLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: T.spacing.md },
    levelDotLabel: { fontSize: 10, fontWeight: '600', color: T.colors.agentMuted, textAlign: 'center', flex: 1 },
    schemeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing.sm, marginBottom: T.spacing.md },
    schemeTile: {
        width: ((W - (T.spacing.lg * 2) - T.spacing.lg - T.spacing.sm) / 2),
        borderRadius: T.radius.md,
        borderWidth: 1,
        borderColor: T.colors.border,
        backgroundColor: '#FCFAF4',
        paddingVertical: T.spacing.sm,
        paddingHorizontal: T.spacing.sm,
    },
    schemeTileTitle: { fontSize: 12, fontWeight: '700', color: T.colors.textPrimary },
    schemeTileMeta: { fontSize: 11, color: T.colors.textSecondary, marginTop: 2 },
    schemeTilePct: { fontSize: 12, fontWeight: '800', marginTop: 4 },
    withdrawRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#F7F4EE', borderRadius: T.radius.md, padding: T.spacing.sm,
    },
    withdrawText: { fontSize: 12, color: T.colors.textSecondary, fontWeight: '600', flex: 1 },

    // Campaign
    campaignCard: {
        backgroundColor: '#fff', borderRadius: T.radius.lg,
        padding: T.spacing.lg, gap: T.spacing.md, ...T.shadows.card,
    },
    campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    campaignName: { fontSize: 16, fontWeight: '700', color: T.colors.textPrimary },
    campaignMeta: { fontSize: 12, color: T.colors.textSecondary, marginTop: 2 },
    campaignBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: T.colors.agentPrimary + '18', borderRadius: T.radius.full,
        paddingHorizontal: T.spacing.sm, paddingVertical: 4,
        borderWidth: 1, borderColor: T.colors.agentPrimary + '40',
    },
    campaignBadgeText: { fontSize: 12, fontWeight: '700', color: T.colors.agentPrimary },
    campaignProgress: { borderRadius: T.radius.md, padding: T.spacing.md },
    campaignProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: T.spacing.sm },
    campaignProgressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    campaignProgressPct: { fontSize: 12, fontWeight: '800', color: T.colors.agentPrimary },
    campaignProgressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: T.spacing.sm },
    campaignMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
    bonusRow: { gap: 4 },
    bonusText: { fontSize: 13, color: T.colors.textSecondary },

    // Products
    productCard: { gap: T.spacing.sm },
    productTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: T.spacing.sm },
    productName: { ...T.typography.h2, color: T.colors.textPrimary },
    productPrice: { ...T.typography.bodySmall, color: T.colors.textSecondary, marginTop: 2 },
    productActions: { flexDirection: 'row', gap: T.spacing.sm, marginTop: 4 },

    // Empty
    emptyTitle: { ...T.typography.h2, color: T.colors.textPrimary, textAlign: 'center' },
    emptySub: { ...T.typography.bodySmall, color: T.colors.textSecondary, textAlign: 'center', marginTop: 6 },
});
