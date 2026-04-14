// WalletScreen — Premium glassmorphism redesign
// Water + technology theme: blue/teal gradient, glass cards, smooth layout

import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useWalletStore, useAuthStore } from '../../store';

const { width: W } = Dimensions.get('window');

// ── Source label map ──────────────────────────────────────────────────────────
const SOURCE_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    referral_bonus:   { label: 'Referral Reward',   icon: 'people',          color: '#7C3AED' },
    join_bonus:       { label: 'Welcome Bonus',      icon: 'gift',            color: '#059669' },
    join_bonus_usage: { label: 'Bonus Used',         icon: 'cart',            color: '#D97706' },
    refund:           { label: 'Refund',             icon: 'refresh-circle',  color: '#0284C7' },
    order_payment:    { label: 'Order Payment',      icon: 'bag-handle',      color: '#DC2626' },
    welcome_bonus:    { label: 'Welcome Bonus',      icon: 'star',            color: '#059669' },
    commission:       { label: 'Commission',         icon: 'trending-up',     color: '#7C3AED' },
};

const getSourceMeta = (source: string, type: string) => {
    const meta = SOURCE_META[source];
    if (meta) return meta;
    return type === 'credit'
        ? { label: 'Credit',  icon: 'arrow-down-circle' as const, color: '#059669' }
        : { label: 'Debit',   icon: 'arrow-up-circle'   as const, color: '#DC2626' };
};

const formatDate = (raw: string) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Component ─────────────────────────────────────────────────────────────────
export const WalletScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { balance, transactions, isLoading, error, fetchWallet, fetchTransactions } = useWalletStore();
    const user = useAuthStore((s) => s.user);
    const [refreshing, setRefreshing] = React.useState(false);

    useFocusEffect(React.useCallback(() => {
        void Promise.all([fetchWallet(), fetchTransactions()]);
    }, [fetchWallet, fetchTransactions]));

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchWallet(), fetchTransactions()]);
        setRefreshing(false);
    }, [fetchWallet, fetchTransactions]);

    return (
        <View style={styles.root}>
            {/* ── Hero gradient header ── */}
            <LinearGradient
                colors={['#0077B6', '#00B4D8', '#48CAE4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
            >
                {/* decorative water rings */}
                <View style={styles.ring1} />
                <View style={styles.ring2} />

                <View style={styles.heroNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.heroTitle}>My Wallet</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Glass balance card */}
                <View style={styles.balanceGlass}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>
                        ₹{Number(balance).toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceStat}>
                            <Ionicons name="arrow-down-circle" size={16} color="#90E0EF" />
                            <Text style={styles.balanceStatLabel}>Credits</Text>
                        </View>
                        <View style={styles.balanceStat}>
                            <Ionicons name="arrow-up-circle" size={16} color="#FFB4A2" />
                            <Text style={styles.balanceStatLabel}>Debits</Text>
                        </View>
                        <View style={styles.balanceStat}>
                            <Ionicons name="gift" size={16} color="#B5EAD7" />
                            <Text style={styles.balanceStatLabel}>Bonuses</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {isLoading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={customerColors.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                            colors={[customerColors.primary]} tintColor={customerColors.primary} />
                    }
                >
                    {error ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle" size={16} color={colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* ── Referral card ── */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.referralCard}
                    >
                        <LinearGradient
                            colors={['#023E8A', '#0077B6']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.referralGradient}
                        >
                            <View style={styles.referralLeft}>
                                <View style={styles.referralIconWrap}>
                                    <Ionicons name="people" size={22} color="#90E0EF" />
                                </View>
                                <View>
                                    <Text style={styles.referralTitle}>Refer & Earn</Text>
                                    <Text style={styles.referralSub}>₹5,000 per referral</Text>
                                </View>
                            </View>
                            <View style={styles.referralCodePill}>
                                <Text style={styles.referralCodeText}>{user?.referralCode || '—'}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ── Join bonus banner ── */}
                    <View style={styles.bonusBanner}>
                        <LinearGradient
                            colors={['#D8F3DC', '#B7E4C7']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.bonusGradient}
                        >
                            <Ionicons name="gift" size={28} color="#1B4332" />
                            <View style={styles.bonusText}>
                                <Text style={styles.bonusTitle}>₹10,000 Welcome Bonus</Text>
                                <Text style={styles.bonusSub}>Use on Ionizers above ₹4,00,000</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#1B4332" />
                        </LinearGradient>
                    </View>

                    {/* ── Transaction history ── */}
                    <Text style={styles.sectionTitle}>Transaction History</Text>

                    {transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((txn) => {
                            const meta = getSourceMeta(txn.source, txn.type);
                            const isCredit = txn.type === 'credit';
                            return (
                                <View key={txn.id} style={styles.txnCard}>
                                    <View style={[styles.txnIconWrap, { backgroundColor: meta.color + '18' }]}>
                                        <Ionicons name={meta.icon} size={20} color={meta.color} />
                                    </View>
                                    <View style={styles.txnBody}>
                                        <Text style={styles.txnLabel}>{meta.label}</Text>
                                        <Text style={styles.txnDesc} numberOfLines={1}>{txn.description || meta.label}</Text>
                                        <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                                    </View>
                                    <Text style={[styles.txnAmount, { color: isCredit ? '#059669' : '#DC2626' }]}>
                                        {isCredit ? '+' : '−'}₹{Number(txn.amount).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const GLASS_BG = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F0F7FF' },

    // Hero
    hero: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl + 8,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    ring1: {
        position: 'absolute', width: 260, height: 260, borderRadius: 130,
        borderWidth: 40, borderColor: 'rgba(255,255,255,0.06)',
        top: -80, right: -80,
    },
    ring2: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        borderWidth: 28, borderColor: 'rgba(255,255,255,0.05)',
        bottom: 20, left: -50,
    },
    heroNav: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: spacing.lg,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: GLASS_BG, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: GLASS_BORDER,
    },
    heroTitle: { ...typography.h2, color: '#fff', fontWeight: '700' },

    // Balance glass card
    balanceGlass: {
        backgroundColor: GLASS_BG,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        padding: spacing.lg,
    },
    balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 4 },
    balanceAmount: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1 },
    balanceDivider: { height: 1, backgroundColor: GLASS_BORDER, marginVertical: spacing.md },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
    balanceStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    balanceStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        backgroundColor: colors.error + '12', borderRadius: borderRadius.md,
        padding: spacing.sm, marginBottom: spacing.md,
    },
    errorText: { ...typography.caption, color: colors.error, flex: 1 },

    // Referral card
    referralCard: { borderRadius: 20, overflow: 'hidden', marginBottom: spacing.md, ...shadows.md },
    referralGradient: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: spacing.md + 4,
    },
    referralLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    referralIconWrap: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    referralTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
    referralSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    referralCodePill: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    },
    referralCodeText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },

    // Bonus banner
    bonusBanner: { borderRadius: 16, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.sm },
    bonusGradient: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.md, gap: spacing.md,
    },
    bonusText: { flex: 1 },
    bonusTitle: { fontSize: 14, fontWeight: '700', color: '#1B4332' },
    bonusSub: { fontSize: 12, color: '#2D6A4F', marginTop: 2 },

    // Section
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
    emptyText: { ...typography.body, color: colors.textMuted },

    // Transaction card
    txnCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16,
        padding: spacing.md, marginBottom: spacing.sm,
        ...shadows.sm,
    },
    txnIconWrap: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    },
    txnBody: { flex: 1 },
    txnLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
    txnDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    txnDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    txnAmount: { fontSize: 15, fontWeight: '800' },
});
