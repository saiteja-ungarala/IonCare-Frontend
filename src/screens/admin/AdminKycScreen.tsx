import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDebounce } from 'use-debounce';
import { adminColors } from '../../theme/adminTheme';
import { getKycAgents, getKycDealers, getKycStats } from '../../services/adminService';

const STATUS_TABS   = ['pending', 'approved', 'rejected'] as const;
const STATUS_LABELS = ['Pending', 'Approved', 'Rejected'];
const ENTITY_TABS   = ['Agents', 'Dealers'] as const;
const PAGE_LIMIT    = 20;

type KycUser = {
    id: number;
    name: string;
    email: string;
    phone: string;
    verification_status: string;
    document_count: number;
    submitted_at: string | null;
    review_notes: string | null;
    reviewed_at: string | null;
    reviewed_by_name: string | null;
};

type KycStats = {
    agents:  { pending: number; approved: number; rejected: number };
    dealers: { pending: number; approved: number; rejected: number };
};

function relativeTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
    pending:    { bg: 'rgba(245,158,11,0.15)',  text: '#B45309' },
    approved:   { bg: 'rgba(22,163,74,0.15)',   text: '#15803D' },
    rejected:   { bg: 'rgba(239,68,68,0.15)',   text: '#DC2626' },
    unverified: { bg: 'rgba(113,128,150,0.15)', text: '#4A5568' },
};

export default function AdminKycScreen() {
    const navigation = useNavigation<any>();

    // Tabs
    const [entityTab, setEntityTab] = useState(0);
    const [statusTab, setStatusTab] = useState(0);

    // Search
    const [search, setSearch] = useState('');
    const [debouncedSearch]   = useDebounce(search, 400);

    // Stats
    const [stats, setStats] = useState<KycStats | null>(null);

    // List
    const [items,       setItems]       = useState<KycUser[]>([]);
    const [total,       setTotal]       = useState(0);
    const [page,        setPage]        = useState(1);
    const [loading,     setLoading]     = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing,  setRefreshing]  = useState(false);

    // Refs to avoid stale closures
    const entityTabRef = useRef(entityTab);
    const statusTabRef = useRef(statusTab);
    const searchRef    = useRef(debouncedSearch);
    const pageRef      = useRef(1);
    entityTabRef.current = entityTab;
    statusTabRef.current = statusTab;
    searchRef.current    = debouncedSearch;

    const isMountedRef = useRef(false);

    // ── Load stats ────────────────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        try {
            const data = await getKycStats();
            setStats(data);
        } catch (e) {
            console.error('[KYC] stats error:', e);
        }
    }, []);

    // ── Load list ─────────────────────────────────────────────────────────────
    const loadList = useCallback(async (pageNum: number, opts: { refresh?: boolean; append?: boolean } = {}) => {
        const status = STATUS_TABS[statusTabRef.current];
        const params: Record<string, any> = { status, page: pageNum, limit: PAGE_LIMIT };
        if (searchRef.current.trim()) params.search = searchRef.current.trim();

        if (pageNum === 1) {
            if (opts.refresh) setRefreshing(true); else setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const fn   = entityTabRef.current === 0 ? getKycAgents : getKycDealers;
            const data = await fn(params);
            const newItems: KycUser[] = data?.items ?? [];
            setTotal(data?.total ?? 0);
            setItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
        } catch (e) {
            console.error('[KYC] list error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    // Ref to always hold latest loadList
    const loadListRef = useRef(loadList);
    loadListRef.current = loadList;

    // ── Re-focus: refresh stats + list ───────────────────────────────────────
    useFocusEffect(useCallback(() => {
        loadStats();
        if (isMountedRef.current) {
            pageRef.current = 1;
            setPage(1);
            setItems([]);
            loadListRef.current(1, { refresh: true });
        }
        isMountedRef.current = true;
    }, [loadStats]));

    // ── Reload list on tab/search change ─────────────────────────────────────
    useEffect(() => {
        pageRef.current = 1;
        setPage(1);
        setItems([]);
        loadListRef.current(1);
    }, [entityTab, statusTab, debouncedSearch]);

    const handleLoadMore = () => {
        if (loadingMore || items.length >= total) return;
        const next = pageRef.current + 1;
        pageRef.current = next;
        setPage(next);
        loadListRef.current(next, { append: true });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const chip = STATUS_CHIP_COLORS;

    const renderItem = ({ item }: { item: KycUser }) => {
        const st = item.verification_status || 'unverified';
        const c  = chip[st] ?? chip.unverified;
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AdminKycDetail', {
                    type: entityTab === 0 ? 'agent' : 'dealer',
                    userId: item.id,
                })}
            >
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                        <View style={[styles.statusChip, { backgroundColor: c.bg }]}>
                            <Text style={[styles.statusChipText, { color: c.text }]}>
                                {st.charAt(0).toUpperCase() + st.slice(1)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.cardPhone}>{item.phone || item.email}</Text>
                    <View style={styles.cardMeta}>
                        <View style={styles.docBadge}>
                            <Ionicons name="document-text-outline" size={12} color={adminColors.primary} />
                            <Text style={styles.docBadgeText}>
                                {item.document_count ?? 0} doc{item.document_count !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <Text style={styles.cardTime}>{relativeTime(item.submitted_at)}</Text>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={adminColors.textMuted} />
            </TouchableOpacity>
        );
    };

    const pendingAgents  = stats?.agents?.pending  ?? 0;
    const pendingDealers = stats?.dealers?.pending ?? 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>KYC Review</Text>
            </View>

            {/* Stats bar */}
            <View style={styles.statsBar}>
                <TouchableOpacity
                    style={[styles.statPill, entityTab === 0 && styles.statPillActive]}
                    onPress={() => { setEntityTab(0); setStatusTab(0); }}
                >
                    <Text style={[styles.statPillLabel, entityTab === 0 && styles.statPillLabelActive]}>
                        Agents
                    </Text>
                    {pendingAgents > 0 && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{pendingAgents}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statPill, entityTab === 1 && styles.statPillActive]}
                    onPress={() => { setEntityTab(1); setStatusTab(0); }}
                >
                    <Text style={[styles.statPillLabel, entityTab === 1 && styles.statPillLabelActive]}>
                        Dealers
                    </Text>
                    {pendingDealers > 0 && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{pendingDealers}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Status sub-tabs */}
            <View style={styles.subTabBar}>
                {STATUS_LABELS.map((label, idx) => (
                    <TouchableOpacity
                        key={label}
                        style={[styles.subTab, statusTab === idx && styles.subTabActive]}
                        onPress={() => setStatusTab(idx)}
                    >
                        <Text style={[styles.subTabText, statusTab === idx && styles.subTabTextActive]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search bar */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color={adminColors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by name or phone"
                    placeholderTextColor={adminColors.textLight}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                pageRef.current = 1;
                                setPage(1);
                                loadListRef.current(1, { refresh: true });
                                loadStats();
                            }}
                            tintColor={adminColors.primary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                size="small"
                                color={adminColors.primary}
                                style={{ marginVertical: 16 }}
                            />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="document-text-outline" size={48} color={adminColors.textMuted} />
                            <Text style={styles.emptyText}>No {STATUS_LABELS[statusTab].toLowerCase()} KYC</Text>
                            <Text style={styles.emptySub}>
                                No {ENTITY_TABS[entityTab].toLowerCase()} with {STATUS_TABS[statusTab]} status
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: adminColors.background },
    header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerTitle:  { fontSize: 24, fontWeight: '700', color: adminColors.text },

    // Stats bar
    statsBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 10,
    },
    statPill: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 9, borderRadius: 10,
        backgroundColor: adminColors.surface,
        borderWidth: 1.5, borderColor: adminColors.border,
        gap: 8,
    },
    statPillActive: {
        backgroundColor: adminColors.primaryLight,
        borderColor: adminColors.primary,
    },
    statPillLabel:       { fontSize: 14, fontWeight: '600', color: adminColors.textSecondary },
    statPillLabelActive: { color: adminColors.primary },
    pendingBadge: {
        backgroundColor: '#F59E0B',
        borderRadius: 10, minWidth: 22, height: 22,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 6,
    },
    pendingBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

    // Sub-tabs
    subTabBar: {
        flexDirection: 'row',
        marginHorizontal: 16, marginBottom: 10,
        backgroundColor: adminColors.surface,
        borderRadius: 10, padding: 3,
        borderWidth: 1, borderColor: adminColors.border,
    },
    subTab: {
        flex: 1, paddingVertical: 7, borderRadius: 8,
        alignItems: 'center',
    },
    subTabActive:     { backgroundColor: adminColors.primary },
    subTabText:       { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary },
    subTabTextActive: { color: '#FFFFFF' },

    // Search
    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 10,
        backgroundColor: adminColors.surface,
        borderRadius: 10, borderWidth: 1, borderColor: adminColors.border,
        paddingHorizontal: 12,
    },
    searchIcon:  { marginRight: 8 },
    searchInput: {
        flex: 1, paddingVertical: 10,
        fontSize: 14, color: adminColors.text,
    },

    // List
    list:   { paddingHorizontal: 16, paddingBottom: 20 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Card
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: adminColors.surface,
        borderRadius: 12, marginBottom: 10, padding: 12,
        borderWidth: 1, borderColor: adminColors.border,
        gap: 12,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: adminColors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText:   { fontSize: 18, fontWeight: '700', color: adminColors.primary },
    cardBody:     { flex: 1 },
    cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    cardName:     { flex: 1, fontSize: 15, fontWeight: '700', color: adminColors.text },
    cardPhone:    { fontSize: 13, color: adminColors.textSecondary, marginBottom: 4 },
    cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    docBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: adminColors.primaryLight,
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    },
    docBadgeText: { fontSize: 11, fontWeight: '600', color: adminColors.primary },
    cardTime:     { fontSize: 11, color: adminColors.textMuted },
    statusChip:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    statusChipText: { fontSize: 11, fontWeight: '700' },

    // Empty
    empty:    { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', color: adminColors.textSecondary, marginTop: 12 },
    emptySub:  { fontSize: 13, color: adminColors.textMuted, marginTop: 4, textAlign: 'center' },
});
