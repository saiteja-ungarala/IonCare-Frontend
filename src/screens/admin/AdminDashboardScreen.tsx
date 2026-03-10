import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminColors } from '../../theme/adminTheme';
import { useAuthStore } from '../../store';
import { getDashboard } from '../../services/adminService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
    id: number;
    action: string;
    entity_type: string;
    entity_id: number | null;
    created_at: string;
    admin_name: string | null;
}

interface DashboardData {
    totalCustomers: number;
    totalAgents: number;
    totalDealers: number;
    pendingAgentKyc: number;
    pendingDealerKyc: number;
    todayBookings: number;
    todayRevenue: number;
    monthlyRevenue: number;
    activeProducts: number;
    activeServices: number;
    activeBanners: number;
    recentActivity: ActivityItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatRupees(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
}

function formatAction(action: string): string {
    return action.replace(/_/g, ' ');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    badge?: boolean;
}

function StatCard({ label, value, icon, color, badge }: StatCardProps) {
    return (
        <View style={[styles.card, { borderLeftColor: color }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: color + '18' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardValueRow}>
                    <Text style={[styles.cardValue, { color }]}>{value}</Text>
                    {badge && Number(value) > 0 && (
                        <View style={[styles.badge, { backgroundColor: color }]}>
                            <Text style={styles.badgeText}>!</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.cardLabel}>{label}</Text>
            </View>
        </View>
    );
}

function ActivityRow({ item }: { item: ActivityItem }) {
    return (
        <View style={styles.activityRow}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{formatAction(item.action)}</Text>
                <Text style={styles.activityMeta}>
                    {item.admin_name ?? 'Admin'}
                    {item.entity_id ? ` · #${item.entity_id}` : ''}
                    {' · '}
                    <Text style={styles.activityTime}>{relativeTime(item.created_at)}</Text>
                </Text>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
    const { logout, user } = useAuthStore();
    const [data, setData]       = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Log out of admin panel?')) logout();
        } else {
            Alert.alert('Log Out', 'Log out of admin panel?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: logout },
            ]);
        }
    };

    const load = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true); else setLoading(true);
            setError(null);
            const result = await getDashboard();
            setData(result);
        } catch (e: any) {
            setError('Failed to load dashboard. Pull down to retry.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={adminColors.primary} />
            </SafeAreaView>
        );
    }

    if (error || !data) {
        return (
            <SafeAreaView style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={adminColors.error} />
                <Text style={styles.errorText}>{error ?? 'No data'}</Text>
            </SafeAreaView>
        );
    }

    const rows: StatCardProps[][] = [
        [
            { label: 'Total Customers', value: data.totalCustomers,   icon: 'people-outline',       color: '#2563EB' },
            { label: 'Total Agents',    value: data.totalAgents,       icon: 'person-outline',       color: '#16A34A' },
        ],
        [
            { label: 'Pending Agent KYC',  value: data.pendingAgentKyc,  icon: 'document-text-outline', color: '#F59E0B', badge: true },
            { label: 'Pending Dealer KYC', value: data.pendingDealerKyc, icon: 'storefront-outline',    color: '#F59E0B', badge: true },
        ],
        [
            { label: "Today's Bookings",   value: data.todayBookings,    icon: 'calendar-outline',      color: '#14B8A6' },
            { label: "Today's Revenue",    value: formatRupees(data.todayRevenue), icon: 'cash-outline', color: '#14B8A6' },
        ],
        [
            { label: 'Monthly Revenue',  value: formatRupees(data.monthlyRevenue), icon: 'stats-chart-outline', color: '#7C3AED' },
            { label: 'Active Products',  value: data.activeProducts, icon: 'cube-outline',            color: '#6B7280' },
        ],
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerBrand}>AquaCare</Text>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => load(true)}
                        tintColor={adminColors.accent}
                        colors={[adminColors.accent]}
                    />
                }
            >
                {/* Stat Cards Grid */}
                <Text style={styles.sectionTitle}>Overview</Text>
                {rows.map((pair, ri) => (
                    <View key={ri} style={styles.cardRow}>
                        {pair.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </View>
                ))}

                {/* Recent Activity */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Activity</Text>
                {data.recentActivity.length === 0 ? (
                    <Text style={styles.emptyText}>No activity yet.</Text>
                ) : (
                    <View style={styles.activityList}>
                        {data.recentActivity.map((item) => (
                            <ActivityRow key={item.id} item={item} />
                        ))}
                    </View>
                )}
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: adminColors.background,
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: adminColors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 32,
    },

    // Header
    header: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLeft: { flex: 1 },
    headerBrand: {
        fontSize: 11,
        fontWeight: '700',
        color: adminColors.accent,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },
    logoutBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

    // Section
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: adminColors.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },

    // Stat Card
    cardRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    card: {
        flex: 1,
        backgroundColor: adminColors.surface,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: { flex: 1 },
    cardValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
    },
    cardLabel: {
        fontSize: 11,
        color: adminColors.textMuted,
        fontWeight: '500',
        marginTop: 2,
    },
    badge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // Activity
    activityList: {
        backgroundColor: adminColors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: adminColors.border,
        gap: 12,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: adminColors.accent,
        marginTop: 5,
    },
    activityContent: { flex: 1 },
    activityAction: {
        fontSize: 13,
        fontWeight: '600',
        color: adminColors.text,
        textTransform: 'capitalize',
    },
    activityMeta: {
        fontSize: 11,
        color: adminColors.textMuted,
        marginTop: 2,
    },
    activityTime: {
        color: adminColors.accent,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 13,
        color: adminColors.textMuted,
        textAlign: 'center',
        paddingVertical: 20,
    },
});
