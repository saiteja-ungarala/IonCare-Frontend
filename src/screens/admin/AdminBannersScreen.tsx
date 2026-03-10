import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { adminColors } from '../../theme/adminTheme';
import { deleteBanner, getBanners, reorderBanners } from '../../services/adminService';

const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api').replace(/\/api$/, '');

type AdminBanner = {
    id: number;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    link_type: string;
    link_value: string | null;
    is_active: number;
    display_order: number;
    starts_at: string | null;
    expires_at: string | null;
};

export default function AdminBannersScreen() {
    const navigation = useNavigation<any>();
    const [banners, setBanners]     = useState<AdminBanner[]>([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const data = await getBanners();
            setBanners(data ?? []);
        } catch (e) {
            console.error('[AdminBanners] load error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = (item: AdminBanner) => {
        Alert.alert(
            'Delete Banner',
            `Delete "${item.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBanner(item.id);
                            setBanners(prev => prev.filter(b => b.id !== item.id));
                        } catch {
                            Alert.alert('Error', 'Failed to delete banner.');
                        }
                    },
                },
            ],
        );
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const next = [...banners];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= next.length) return;
        [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
        setBanners(next);
        try {
            await reorderBanners(next.map(b => b.id));
        } catch {
            // revert on failure
            setBanners(banners);
            Alert.alert('Error', 'Failed to reorder banners.');
        }
    };

    const renderItem = ({ item, index }: { item: AdminBanner; index: number }) => (
        <View style={styles.card}>
            {/* Image thumbnail */}
            <View style={styles.thumb}>
                {item.image_url ? (
                    <Image
                        source={{ uri: SERVER_BASE + item.image_url }}
                        style={styles.thumbImg}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.thumbPlaceholder}>
                        <Ionicons name="image-outline" size={28} color={adminColors.textMuted} />
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, item.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>
                {item.subtitle ? (
                    <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
                ) : null}
                <Text style={styles.cardMeta}>
                    Order: {item.display_order}
                    {item.link_type && item.link_type !== 'none' ? `  ·  ${item.link_type}` : ''}
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.orderBtns}>
                    <TouchableOpacity
                        onPress={() => handleMove(index, 'up')}
                        style={[styles.orderBtn, index === 0 && styles.orderBtnDisabled]}
                        disabled={index === 0}
                    >
                        <Ionicons name="chevron-up" size={16} color={index === 0 ? adminColors.textLight : adminColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleMove(index, 'down')}
                        style={[styles.orderBtn, index === banners.length - 1 && styles.orderBtnDisabled]}
                        disabled={index === banners.length - 1}
                    >
                        <Ionicons name="chevron-down" size={16} color={index === banners.length - 1 ? adminColors.textLight : adminColors.primary} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('AdminBannerForm', { mode: 'edit', id: item.id, item })}
                >
                    <Ionicons name="pencil" size={16} color={adminColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={16} color={adminColors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Banners</Text>
                <Text style={styles.headerSub}>{banners.length} banner{banners.length !== 1 ? 's' : ''}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={banners}
                    keyExtractor={b => String(b.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => load(true)}
                            tintColor={adminColors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="image-outline" size={48} color={adminColors.textMuted} />
                            <Text style={styles.emptyText}>No banners yet</Text>
                            <Text style={styles.emptySub}>Tap + to add the first banner</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AdminBannerForm', { mode: 'create' })}
                activeOpacity={0.85}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: adminColors.background },
    header:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerTitle:     { fontSize: 24, fontWeight: '700', color: adminColors.text },
    headerSub:       { fontSize: 13, color: adminColors.textMuted, marginTop: 2 },
    center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list:            { paddingHorizontal: 16, paddingBottom: 100 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.surface,
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    thumb:           { width: 80, height: 72 },
    thumbImg:        { width: 80, height: 72 },
    thumbPlaceholder: {
        width: 80, height: 72,
        backgroundColor: adminColors.backgroundAlt,
        alignItems: 'center', justifyContent: 'center',
    },
    cardBody:        { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
    cardTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    cardTitle:       { flex: 1, fontSize: 14, fontWeight: '600', color: adminColors.text },
    badge:           { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    badgeActive:     { backgroundColor: adminColors.successBg },
    badgeInactive:   { backgroundColor: adminColors.errorBg },
    badgeText:       { fontSize: 11, fontWeight: '600' },
    badgeTextActive: { color: adminColors.success },
    badgeTextInactive: { color: adminColors.error },
    cardSub:         { fontSize: 12, color: adminColors.textSecondary, marginBottom: 2 },
    cardMeta:        { fontSize: 11, color: adminColors.textMuted },
    actions:         { flexDirection: 'column', alignItems: 'center', paddingRight: 8, gap: 4 },
    orderBtns:       { flexDirection: 'column', gap: 0 },
    orderBtn:        { padding: 4 },
    orderBtnDisabled: { opacity: 0.3 },
    editBtn:         { padding: 6 },
    deleteBtn:       { padding: 6 },
    empty:           { alignItems: 'center', paddingTop: 80 },
    emptyText:       { fontSize: 16, fontWeight: '600', color: adminColors.textSecondary, marginTop: 12 },
    emptySub:        { fontSize: 13, color: adminColors.textMuted, marginTop: 4 },
    fab: {
        position: 'absolute', bottom: 28, right: 24,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: adminColors.accent,
        alignItems: 'center', justifyContent: 'center',
        elevation: 6,
        shadowColor: adminColors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
});
