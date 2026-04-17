import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { RootStackParamList } from '../../models/types';
import { colors, spacing, typography, shadows } from '../../theme/theme';
import { useAuthStore } from '../../store';

const { width: screenWidth } = Dimensions.get('window');

type ReferralStatus = 'pending' | 'credited';

interface ReferralListItem {
    user_name: string;
    status: string;
    reward_amount: number;
}

interface ReferralApiResponse {
    total_referrals?: number;
    total_earned?: number;
    referrals?: ReferralListItem[];
}

interface ReferralSummary {
    totalReferrals: number;
    totalEarned: number;
    pendingReferrals: number;
    referrals: Array<{
        userName: string;
        status: ReferralStatus;
        rewardAmount: number;
    }>;
}

interface WalletTransactionLike {
    id?: number | string;
    txn_type?: string;
    type?: string;
    source?: string;
    amount?: number | string;
    description?: string;
    created_at?: string;
    date?: string;
}

const rewardTiers = [
    {
        level: 'Direct Referral',
        reward: '\u20B95,000',
        icon: 'person-add' as const,
        color: '#0077B6',
        description: 'When your friend places a paid order',
    },
    {
        level: 'Second Level',
        reward: '\u20B92,000',
        icon: 'people' as const,
        color: '#7C3AED',
        description: "When your friend's friend places a paid order",
    },
];

const howItWorks = [
    { step: '1', text: 'Share your unique referral code', icon: 'share-social' as const },
    { step: '2', text: 'Friend signs up using your code', icon: 'person-add' as const },
    { step: '3', text: 'Friend places a paid order', icon: 'bag-check' as const },
    { step: '4', text: 'You earn \u20B95,000 in your wallet', icon: 'wallet' as const },
];

const formatCurrency = (value: number): string =>
    `\u20B9${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const normalizeStatus = (status: string): ReferralStatus =>
    String(status).trim().toLowerCase() === 'credited' ? 'credited' : 'pending';

const extractInitials = (value: string): string =>
    value
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'NA';

const mapReferralResponse = (payload?: ReferralApiResponse | null): ReferralSummary => {
    const safePayload = payload || {};

    const referrals = Array.isArray(safePayload.referrals)
        ? safePayload.referrals.map((item) => ({
            userName: item.user_name || 'Unnamed User',
            status: normalizeStatus(item.status),
            rewardAmount: Number(item.reward_amount || 0),
        }))
        : [];

    return {
        totalReferrals: Number(safePayload.total_referrals || referrals.length),
        totalEarned: Number(safePayload.total_earned || 0),
        pendingReferrals: referrals.filter((item) => item.status === 'pending').length,
        referrals,
    };
};

const extractNameFromReferralDescription = (description: string): string => {
    const normalized = description.trim();
    if (!normalized) {
        return 'Referral reward';
    }

    const patterns = [
        /referral bonus\s*-\s*([a-zA-Z\s.'-]+?)\s+(joined|using|placed)/i,
        /from\s+([a-zA-Z\s.'-]+?)$/i,
    ];

    for (const pattern of patterns) {
        const match = normalized.match(pattern);
        const name = match?.[1]?.trim();
        if (name) {
            return name;
        }
    }

    return 'Referral reward';
};

const mapWalletFallbackResponse = (payload: unknown): ReferralSummary => {
    const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { transactions?: unknown[] })?.transactions)
            ? ((payload as { transactions: unknown[] }).transactions)
            : [];

    const referralItems = rawList
        .map((row) => row as WalletTransactionLike)
        .filter((item) => {
            const source = String(item.source || '').toLowerCase();
            const type = String(item.txn_type || item.type || '').toLowerCase();
            const description = String(item.description || '');
            const referralBySource = source.includes('referral');
            const referralByDescription = /referral/i.test(description);
            const isCredit = type === 'credit' || type.length === 0;
            return isCredit && (referralBySource || referralByDescription);
        })
        .map((item) => {
            const description = String(item.description || '').trim();
            return {
                userName: extractNameFromReferralDescription(description),
                status: 'credited' as const,
                rewardAmount: Number(item.amount || 0),
            };
        });

    const totalEarned = referralItems.reduce((sum, item) => sum + Number(item.rewardAmount || 0), 0);

    return {
        totalReferrals: referralItems.length,
        totalEarned,
        pendingReferrals: 0,
        referrals: referralItems,
    };
};

export const ReferralScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Referral'>>();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const referralCode = user?.referralCode?.trim() || '';
    const code = referralCode || '\u2014';
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const [copied, setCopied] = useState(false);
    const [summary, setSummary] = useState<ReferralSummary>({
        totalReferrals: 0,
        totalEarned: 0,
        pendingReferrals: 0,
        referrals: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const loadReferralData = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'initial') {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }

        try {
            setErrorMessage('');
            const response = await api.get('/user/referrals');
            const data = response?.data?.data ?? response?.data?.result ?? null;
            setSummary(mapReferralResponse(data as ReferralApiResponse | null));
        } catch (error) {
            const statusCode = (error as { response?: { status?: number } })?.response?.status;

            if (statusCode === 404) {
                try {
                    const fallbackResponse = await api.get('/wallet/transactions', {
                        params: { page: 1, pageSize: 100 },
                    });
                    const fallbackData = fallbackResponse?.data?.data ?? fallbackResponse?.data ?? [];
                    setSummary(mapWalletFallbackResponse(fallbackData));
                    setErrorMessage('');
                    return;
                } catch (fallbackError) {
                    console.warn('[ReferralScreen] Fallback referral load failed:', fallbackError);
                }
            }

            console.warn('[ReferralScreen] Failed to load referrals:', error);
            setErrorMessage('Unable to load referral activity right now.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadReferralData();
    }, [loadReferralData]);

    const handleCopy = async () => {
        if (!referralCode) {
            return;
        }

        await Clipboard.setStringAsync(referralCode);
        setCopied(true);
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!referralCode) {
            return;
        }

        await Share.share({
            message: `Join IonoraCare and get \u20B910,000 welcome bonus! Use my referral code: ${referralCode}\nDownload now: https://ionoracare.com`,
            title: 'Join IonoraCare',
        });
    };

    const handleRefresh = async () => {
        await loadReferralData('refresh');
    };

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={['#03045E', '#0077B6', '#00B4D8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
            >
                <View style={styles.ringPrimary} />
                <View style={styles.ringSecondary} />

                <View style={styles.heroNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.heroTitle}>Refer & Earn</Text>
                    <View style={styles.heroSpacer} />
                </View>

                <Text style={styles.heroHeadline}>Earn up to{'\n'}\u20B95,000 per referral</Text>
                <Text style={styles.heroSub}>Share your code. Track rewards. Earn when friends order.</Text>

                <Animated.View style={[styles.codeCard, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                    <Text style={styles.codeValue}>{code}</Text>
                    <View style={styles.codeActions}>
                        <TouchableOpacity style={styles.codeBtn} onPress={handleCopy} activeOpacity={0.8}>
                            <Ionicons
                                name={copied ? 'checkmark' : 'copy-outline'}
                                size={18}
                                color={copied ? '#059669' : '#0077B6'}
                            />
                            <Text style={[styles.codeBtnText, copied && styles.codeBtnTextSuccess]}>
                                {copied ? 'Copied!' : 'Copy'}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.codeDivider} />
                        <TouchableOpacity style={styles.codeBtn} onPress={handleShare} activeOpacity={0.8}>
                            <Ionicons name="share-social-outline" size={18} color="#0077B6" />
                            <Text style={styles.codeBtnText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                    {!referralCode ? (
                        <Text style={styles.codeHint}>
                            Referral code will appear here after your profile finishes loading.
                        </Text>
                    ) : null}
                </Animated.View>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => void handleRefresh()}
                        tintColor="#0077B6"
                    />
                }
            >
                <Text style={styles.sectionTitle}>Referral Summary</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIconWrap, { backgroundColor: '#0077B618' }]}>
                            <Ionicons name="people" size={18} color="#0077B6" />
                        </View>
                        <Text style={styles.summaryValue}>{summary.totalReferrals}</Text>
                        <Text style={styles.summaryLabel}>Total referrals</Text>
                    </View>

                    <View style={[styles.summaryCard, styles.summaryCardHighlight]}>
                        <View style={[styles.summaryIconWrap, { backgroundColor: '#05966918' }]}>
                            <Ionicons name="wallet" size={18} color="#059669" />
                        </View>
                        <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
                            {formatCurrency(summary.totalEarned)}
                        </Text>
                        <Text style={styles.summaryLabel}>Total earned</Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIconWrap, { backgroundColor: '#F59E0B18' }]}>
                            <Ionicons name="time-outline" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.summaryValue}>{summary.pendingReferrals}</Text>
                        <Text style={styles.summaryLabel}>Pending referrals</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Referral Activity</Text>
                {isLoading ? (
                    <View style={styles.stateCard}>
                        <ActivityIndicator color="#0077B6" />
                        <Text style={styles.stateText}>Loading your referral activity...</Text>
                    </View>
                ) : errorMessage ? (
                    <View style={styles.stateCard}>
                        <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
                        <Text style={styles.stateError}>{errorMessage}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => void loadReferralData()}>
                            <Text style={styles.retryBtnText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                ) : summary.referrals.length === 0 ? (
                    <View style={styles.stateCard}>
                        <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
                        <Text style={styles.stateText}>No referrals yet. Share your code to get started.</Text>
                    </View>
                ) : (
                    <View style={styles.referralList}>
                        {summary.referrals.map((item, index) => {
                            const credited = item.status === 'credited';
                            return (
                                <View key={`${item.userName}-${index}`} style={styles.referralCard}>
                                    <View style={styles.referralTopRow}>
                                        <View style={styles.avatarWrap}>
                                            <Text style={styles.avatarText}>{extractInitials(item.userName)}</Text>
                                        </View>
                                        <View style={styles.referralMeta}>
                                            <Text style={styles.referralName}>{item.userName}</Text>
                                            <Text style={styles.referralReward}>
                                                Reward: {formatCurrency(item.rewardAmount)}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusPill, credited ? styles.statusCredited : styles.statusPending]}>
                                            <Text style={[styles.statusText, credited ? styles.statusTextCredited : styles.statusTextPending]}>
                                                {credited ? 'Credited' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Reward Tiers</Text>
                <View style={styles.tiersRow}>
                    {rewardTiers.map((tier) => (
                        <View key={tier.level} style={[styles.tierCard, { borderTopColor: tier.color }]}>
                            <View style={[styles.tierIconWrap, { backgroundColor: `${tier.color}18` }]}>
                                <Ionicons name={tier.icon} size={22} color={tier.color} />
                            </View>
                            <Text style={[styles.tierReward, { color: tier.color }]}>{tier.reward}</Text>
                            <Text style={styles.tierLevel}>{tier.level}</Text>
                            <Text style={styles.tierDesc}>{tier.description}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.stepsCard}>
                    {howItWorks.map((item, index) => (
                        <View key={item.step} style={styles.stepRow}>
                            <View style={styles.stepLeft}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepNum}>{item.step}</Text>
                                </View>
                                {index < howItWorks.length - 1 ? <View style={styles.stepLine} /> : null}
                            </View>
                            <View style={styles.stepContent}>
                                <View style={styles.stepIconWrap}>
                                    <Ionicons name={item.icon} size={18} color="#0077B6" />
                                </View>
                                <Text style={styles.stepText}>{item.text}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.shareCta, !referralCode && styles.shareCtaDisabled]}
                    onPress={handleShare}
                    activeOpacity={0.88}
                    disabled={!referralCode}
                >
                    <LinearGradient
                        colors={referralCode ? ['#0077B6', '#00B4D8'] : ['#94A3B8', '#CBD5E1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shareCtaGradient}
                    >
                        <Ionicons name="share-social" size={20} color="#FFFFFF" />
                        <Text style={styles.shareCtaText}>Share with Friends</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
};

const glassBackground = 'rgba(255,255,255,0.13)';
const glassBorder = 'rgba(255,255,255,0.26)';

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F0F7FF',
    },
    hero: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl + 16,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    ringPrimary: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 44,
        borderColor: 'rgba(255,255,255,0.05)',
        top: -100,
        right: -80,
    },
    ringSecondary: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 28,
        borderColor: 'rgba(255,255,255,0.05)',
        bottom: 0,
        left: -40,
    },
    heroNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: glassBackground,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: glassBorder,
    },
    heroTitle: {
        ...typography.h2,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    heroSpacer: {
        width: 40,
    },
    heroHeadline: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 36,
        marginBottom: spacing.xs,
    },
    heroSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        marginBottom: spacing.lg,
    },
    codeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadows.lg,
    },
    codeLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: spacing.sm,
    },
    codeValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#03045E',
        letterSpacing: 4,
        marginBottom: spacing.md,
    },
    codeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    codeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
    },
    codeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0077B6',
    },
    codeBtnTextSuccess: {
        color: '#059669',
    },
    codeDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
    },
    codeHint: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: 18,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: spacing.md,
        ...shadows.sm,
    },
    summaryCardHighlight: {
        backgroundColor: '#ECFDF5',
    },
    summaryIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    summaryValueHighlight: {
        color: '#059669',
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
        fontWeight: '600',
    },
    stateCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.sm,
    },
    stateText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '600',
    },
    stateError: {
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '600',
    },
    retryBtn: {
        marginTop: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
    },
    retryBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0369A1',
    },
    referralList: {
        gap: spacing.md,
    },
    referralCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: spacing.md,
        ...shadows.sm,
    },
    referralTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrap: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0369A1',
    },
    referralMeta: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    referralName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    referralReward: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    statusPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
    },
    statusCredited: {
        backgroundColor: '#DCFCE7',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    statusTextPending: {
        color: '#B45309',
    },
    statusTextCredited: {
        color: '#15803D',
    },
    tiersRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    tierCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: spacing.md,
        borderTopWidth: 3,
        ...shadows.sm,
    },
    tierIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    tierReward: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    tierLevel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    tierDesc: {
        fontSize: 11,
        color: colors.textSecondary,
        lineHeight: 16,
    },
    stepsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.lg,
        ...shadows.sm,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    stepLeft: {
        alignItems: 'center',
        marginRight: spacing.md,
        width: 32,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0077B6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNum: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E0F0FF',
        marginVertical: 4,
        minHeight: 24,
    },
    stepContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingBottom: spacing.lg,
    },
    stepIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E0F0FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        lineHeight: 20,
    },
    shareCta: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: spacing.lg,
        ...shadows.md,
    },
    shareCtaDisabled: {
        opacity: 0.8,
    },
    shareCtaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md + 4,
    },
    shareCtaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bottomSpacer: {
        height: spacing.xl,
    },
});
