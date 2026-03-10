import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { adminColors } from '../../theme/adminTheme';
import {
    getProducts, toggleProduct,
    getAdminCategories, toggleCategory,
    getAdminBrands, toggleBrand,
    getAdminServices, toggleService,
} from '../../services/adminService';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminProductsNavProp = NativeStackNavigationProp<{
    AdminProductsList: undefined;
    AdminProductForm: { mode: 'create' | 'edit'; type: ItemType; id?: number; item?: any };
}>;

type ItemType = 'product' | 'category' | 'brand' | 'service';

const TABS: { label: string; type: ItemType }[] = [
    { label: 'Products',   type: 'product' },
    { label: 'Categories', type: 'category' },
    { label: 'Brands',     type: 'brand' },
    { label: 'Services',   type: 'service' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusChip({
    active,
    onPress,
}: {
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.chip, { backgroundColor: active ? '#D1FAE5' : '#FEE2E2' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons
                name={active ? 'eye-outline' : 'eye-off-outline'}
                size={11}
                color={active ? '#065F46' : '#991B1B'}
            />
            <Text style={[styles.chipText, { color: active ? '#065F46' : '#991B1B', marginLeft: 3 }]}>
                {active ? 'Active' : 'Inactive'}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Row renderers ────────────────────────────────────────────────────────────

function ProductRow({ item, onToggle, onEdit }: { item: any; onToggle: (id: number, active: boolean) => void; onEdit: (item: any) => void }) {
    return (
        <TouchableOpacity style={styles.row} onPress={() => onEdit(item)} activeOpacity={0.7}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="cube-outline" size={24} color={adminColors.textMuted} />
                </View>
            )}
            <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub}>
                    ₹{item.price}
                    {item.mrp ? <Text style={styles.rowMrp}>  ₹{item.mrp}</Text> : null}
                    {'  ·  '}Stock: {item.stock_qty ?? 0}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>{item.category_name ?? '—'}</Text>
            </View>
            <View style={styles.rowRight}>
                <StatusChip active={!!item.is_active} onPress={() => onToggle(item.id, !!item.is_active)} />
                <Ionicons name="chevron-forward" size={16} color={adminColors.textMuted} style={{ marginTop: 4 }} />
            </View>
        </TouchableOpacity>
    );
}

function CategoryRow({ item, onToggle, onEdit }: { item: any; onToggle: (id: number, active: boolean) => void; onEdit: (item: any) => void }) {
    return (
        <TouchableOpacity style={styles.row} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="folder-outline" size={24} color={adminColors.accent} />
            </View>
            <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.slug}</Text>
                {item.parent_name ? (
                    <Text style={styles.rowMeta}>Parent: {item.parent_name}</Text>
                ) : (
                    <Text style={styles.rowMeta}>Root  ·  Order: {item.sort_order ?? 0}</Text>
                )}
            </View>
            <View style={styles.rowRight}>
                <StatusChip active={!!item.is_active} onPress={() => onToggle(item.id, !!item.is_active)} />
                <Ionicons name="chevron-forward" size={16} color={adminColors.textMuted} style={{ marginTop: 4 }} />
            </View>
        </TouchableOpacity>
    );
}

function BrandRow({ item, onToggle, onEdit }: { item: any; onToggle: (id: number, active: boolean) => void; onEdit: (item: any) => void }) {
    return (
        <TouchableOpacity style={styles.row} onPress={() => onEdit(item)} activeOpacity={0.7}>
            {item.logo_url ? (
                <Image source={{ uri: item.logo_url }} style={styles.thumb} />
            ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="ribbon-outline" size={24} color={adminColors.textMuted} />
                </View>
            )}
            <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.slug}</Text>
            </View>
            <View style={styles.rowRight}>
                <StatusChip active={!!item.is_active} onPress={() => onToggle(item.id, !!item.is_active)} />
                <Ionicons name="chevron-forward" size={16} color={adminColors.textMuted} style={{ marginTop: 4 }} />
            </View>
        </TouchableOpacity>
    );
}

function ServiceRow({ item, onToggle, onEdit }: { item: any; onToggle: (id: number, active: boolean) => void; onEdit: (item: any) => void }) {
    return (
        <TouchableOpacity style={styles.row} onPress={() => onEdit(item)} activeOpacity={0.7}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="construct-outline" size={24} color={adminColors.textMuted} />
                </View>
            )}
            <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub}>₹{item.base_price}  ·  {item.duration_minutes ?? '—'} min</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>{item.category ?? '—'}</Text>
            </View>
            <View style={styles.rowRight}>
                <StatusChip active={!!item.is_active} onPress={() => onToggle(item.id, !!item.is_active)} />
                <Ionicons name="chevron-forward" size={16} color={adminColors.textMuted} style={{ marginTop: 4 }} />
            </View>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminProductsScreen() {
    const navigation = useNavigation<AdminProductsNavProp>();

    const [activeTab, setActiveTab] = useState(0);
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [products,   setProducts]   = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands,     setBrands]     = useState<any[]>([]);
    const [services,   setServices]   = useState<any[]>([]);

    const currentType = TABS[activeTab].type;

    const loadTab = useCallback(async (tab: number, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true); else setLoading(true);
            const type = TABS[tab].type;
            if (type === 'product') {
                const res = await getProducts({ limit: 200 });
                setProducts(res?.items ?? []);
            } else if (type === 'category') {
                const res = await getAdminCategories();
                setCategories(Array.isArray(res) ? res : []);
            } else if (type === 'brand') {
                const res = await getAdminBrands();
                setBrands(Array.isArray(res) ? res : []);
            } else if (type === 'service') {
                const res = await getAdminServices();
                setServices(Array.isArray(res) ? res : []);
            }
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadTab(activeTab); }, [activeTab, loadTab]);

    const handleToggle = useCallback(async (
        id: number,
        currentActive: boolean,
        type: ItemType
    ) => {
        try {
            if (type === 'product')  await toggleProduct(id);
            if (type === 'category') await toggleCategory(id);
            if (type === 'brand')    await toggleBrand(id);
            if (type === 'service')  await toggleService(id);

            const flip = (arr: any[]) =>
                arr.map((i) => i.id === id ? { ...i, is_active: currentActive ? 0 : 1 } : i);

            if (type === 'product')  setProducts(flip);
            if (type === 'category') setCategories(flip);
            if (type === 'brand')    setBrands(flip);
            if (type === 'service')  setServices(flip);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Toggle failed');
        }
    }, []);

    const goToForm = useCallback((mode: 'create' | 'edit', item?: any) => {
        navigation.navigate('AdminProductForm', {
            mode,
            type: currentType,
            id: item?.id,
            item,
        });
    }, [navigation, currentType]);

    const rawList: any[] = useMemo(() => {
        if (currentType === 'product')  return products;
        if (currentType === 'category') return categories;
        if (currentType === 'brand')    return brands;
        return services;
    }, [currentType, products, categories, brands, services]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rawList;
        const q = search.toLowerCase();
        return rawList.filter((i) =>
            (i.name ?? '').toLowerCase().includes(q) ||
            (i.slug ?? '').toLowerCase().includes(q) ||
            (i.sku  ?? '').toLowerCase().includes(q)
        );
    }, [rawList, search]);

    const renderItem = useCallback(({ item }: { item: any }) => {
        if (currentType === 'product') {
            return <ProductRow item={item} onToggle={(id, a) => handleToggle(id, a, 'product')} onEdit={(i) => goToForm('edit', i)} />;
        }
        if (currentType === 'category') {
            return <CategoryRow item={item} onToggle={(id, a) => handleToggle(id, a, 'category')} onEdit={(i) => goToForm('edit', i)} />;
        }
        if (currentType === 'brand') {
            return <BrandRow item={item} onToggle={(id, a) => handleToggle(id, a, 'brand')} onEdit={(i) => goToForm('edit', i)} />;
        }
        return <ServiceRow item={item} onToggle={(id, a) => handleToggle(id, a, 'service')} onEdit={(i) => goToForm('edit', i)} />;
    }, [currentType, handleToggle, goToForm]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Product Management</Text>
            </View>

            {/* Segment Tabs */}
            <View style={styles.segmentWrap}>
                {TABS.map((tab, i) => (
                    <TouchableOpacity
                        key={tab.type}
                        style={[styles.segmentTab, activeTab === i && styles.segmentTabActive]}
                        onPress={() => { setSearch(''); setActiveTab(i); }}
                    >
                        <Text style={[styles.segmentText, activeTab === i && styles.segmentTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={adminColors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${TABS[activeTab].label.toLowerCase()}...`}
                    placeholderTextColor={adminColors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={adminColors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {search ? 'No results found.' : `No ${TABS[activeTab].label.toLowerCase()} yet.`}
                        </Text>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadTab(activeTab, true)}
                            tintColor={adminColors.accent}
                            colors={[adminColors.accent]}
                        />
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => goToForm('create')}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea:    { flex: 1, backgroundColor: adminColors.background },
    centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },

    segmentWrap: {
        flexDirection: 'row',
        backgroundColor: adminColors.surface,
        borderBottomWidth: 1,
        borderBottomColor: adminColors.border,
    },
    segmentTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    segmentTabActive: {
        borderBottomColor: adminColors.accent,
    },
    segmentText: {
        fontSize: 12,
        fontWeight: '600',
        color: adminColors.textMuted,
    },
    segmentTextActive: {
        color: adminColors.primary,
    },

    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.surface,
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderWidth: 1,
        borderColor: adminColors.border,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: adminColors.text,
        padding: 0,
    },

    listContent:   { paddingBottom: 100 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyText:      { fontSize: 14, color: adminColors.textMuted },
    separator:      { height: StyleSheet.hairlineWidth, backgroundColor: adminColors.border, marginLeft: 88 },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    thumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: adminColors.surface3,
    },
    thumbPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowBody:    { flex: 1 },
    rowName:    { fontSize: 14, fontWeight: '600', color: adminColors.text, marginBottom: 3 },
    rowSub:     { fontSize: 12, color: adminColors.textSecondary, marginBottom: 2 },
    rowMrp:     { textDecorationLine: 'line-through', color: adminColors.textMuted },
    rowMeta:    { fontSize: 11, color: adminColors.textMuted },
    rowRight:   { alignItems: 'flex-end', gap: 4 },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    chipText: { fontSize: 11, fontWeight: '700' },

    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: adminColors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
});
