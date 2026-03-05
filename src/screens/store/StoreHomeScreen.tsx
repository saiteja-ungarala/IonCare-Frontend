import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { borderRadius, shadows, spacing, storeTheme } from '../../theme/theme';
import storeService, { StoreCategory } from '../../services/storeService';
import { useCartStore } from '../../store/cartStore';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    water_drop: 'water',
    droplet: 'water',
    box: 'cube',
    filter: 'filter',
    tools: 'construct',
    pump: 'hardware-chip',
    snow: 'snow',
};

const getCategoryIcon = (iconKey: string | null): keyof typeof Ionicons.glyphMap => {
    if (!iconKey) return 'cube';
    return ICON_MAP[iconKey] || 'cube';
};

const CATEGORY_HINTS: Record<string, string> = {
    ionizers: 'Alkaline water tech',
    purifier: 'RO, UV, UF filters',
    filter: 'HEPA and carbon',
    softener: 'Hard water solutions',
    tools: 'Accessories and kits',
    pump: 'Water flow support',
};

const resolveCategoryHint = (categoryName: string): string => {
    const normalized = categoryName.toLowerCase();
    const matchingKey = Object.keys(CATEGORY_HINTS).find((key) => normalized.includes(key));
    if (matchingKey) return CATEGORY_HINTS[matchingKey];
    return 'Explore products and offers';
};

const CATEGORY_CARD_PALETTES = [
    {
        card: ['#F2FFFD', '#FFFFFF'] as const,
        iconBg: '#D7F8F2',
        iconColor: '#00A898',
        accent: '#00BFA5',
        border: '#CDEEE8',
    },
    {
        card: ['#F2F8FF', '#FFFFFF'] as const,
        iconBg: '#DFECFF',
        iconColor: '#1A84E7',
        accent: '#2D9DFF',
        border: '#D8E7FA',
    },
    {
        card: ['#FFF8ED', '#FFFFFF'] as const,
        iconBg: '#FFEACC',
        iconColor: '#E58B00',
        accent: '#F2A31A',
        border: '#F6E5CB',
    },
    {
        card: ['#F5F2FF', '#FFFFFF'] as const,
        iconBg: '#E8DFFF',
        iconColor: '#7C4DFF',
        accent: '#8D63FF',
        border: '#E5DCF8',
    },
];

export function StoreHomeScreen({ navigation }: any) {
    const [categories, setCategories] = React.useState<StoreCategory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const { totalItems, fetchCart } = useCartStore();

    const loadCategories = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await storeService.getCategories();
            setCategories(response);
        } catch (err: any) {
            console.error('[StoreCategories] load failed:', err);
            setError(err?.message || 'Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useFocusEffect(
        React.useCallback(() => {
            fetchCart();
        }, [fetchCart])
    );

    const filteredCategories = React.useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (!normalizedQuery) return categories;
        return categories.filter((category) =>
            category.name.toLowerCase().includes(normalizedQuery)
        );
    }, [categories, searchQuery]);

    const renderCategory = ({ item, index }: { item: StoreCategory; index: number }) => {
        const palette = CATEGORY_CARD_PALETTES[index % CATEGORY_CARD_PALETTES.length];

        return (
            <TouchableOpacity
                style={[styles.categoryCard, { borderColor: palette.border }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('StoreBrands', { categoryId: item.id, categoryName: item.name })}
            >
                <View style={[styles.categoryAccentLine, { backgroundColor: palette.accent }]} />
                <LinearGradient
                    colors={palette.card}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryGradient}
                >
                    <View style={[styles.iconWrap, { backgroundColor: palette.iconBg, borderColor: `${palette.accent}33` }]}>
                        <Ionicons name={getCategoryIcon(item.icon_key)} size={24} color={palette.iconColor} />
                    </View>
                    <View style={styles.categoryContent}>
                        <Text style={styles.categoryName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.categoryHint} numberOfLines={2}>
                            {resolveCategoryHint(item.name)}
                        </Text>
                    </View>
                    <View style={styles.categoryFooterRow}>
                        <View style={styles.countPill}>
                            <Text style={styles.countPillText}>Shop now</Text>
                        </View>
                        <View style={styles.arrowPill}>
                            <Ionicons name="chevron-forward" size={16} color={storeTheme.textSecondary} />
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#072745', '#0C3E66', '#0A3B62']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBackground}
            />

            <View style={styles.header}>
                <View style={styles.titleWrap}>
                    <Text style={styles.headerKicker}>Shop By Category</Text>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>Store</Text>
                        <View style={styles.titleIconWrap}>
                            <Ionicons name="storefront-outline" size={16} color={storeTheme.primaryDark} />
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
                    <Ionicons name="cart-outline" size={20} color={storeTheme.primaryDark} />
                    {totalItems > 0 ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>

            <View style={styles.sheet}>
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={17} color={storeTheme.textSecondary} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search products..."
                        placeholderTextColor={storeTheme.textSecondary}
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={18} color={storeTheme.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={storeTheme.primary} />
                    </View>
                ) : null}

                {!isLoading && error ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle-outline" size={48} color={storeTheme.error || '#ef4444'} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {!isLoading && !error ? (
                    <FlatList
                        data={filteredCategories}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderCategory}
                        numColumns={2}
                        columnWrapperStyle={styles.columnWrap}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                        ListEmptyComponent={
                            <View style={styles.centered}>
                                <Ionicons name="grid-outline" size={48} color={storeTheme.textSecondary} />
                                <Text style={styles.emptyText}>No categories match your search.</Text>
                            </View>
                        }
                    />
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A3458',
    },
    heroBackground: {
        ...StyleSheet.absoluteFillObject,
        height: 210,
    },
    header: {
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleWrap: {
        flex: 1,
        marginRight: spacing.md,
    },
    headerKicker: {
        color: 'rgba(255,255,255,0.72)',
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: '600',
    },
    headerTitleRow: {
        marginTop: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: '#FFFFFF',
    },
    titleIconWrap: {
        marginLeft: spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(209, 250, 244, 0.94)',
        borderWidth: 1,
        borderColor: 'rgba(0, 168, 152, 0.2)',
    },
    cartButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(220, 252, 247, 0.88)',
        borderWidth: 1,
        borderColor: 'rgba(0, 168, 152, 0.22)',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF5B5B',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '700',
    },
    sheet: {
        flex: 1,
        backgroundColor: '#F8FBFC',
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
        paddingTop: spacing.lg,
        borderWidth: 1,
        borderColor: '#DFEBEF',
        overflow: 'hidden',
    },
    searchWrap: {
        marginHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF4F7',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#D8E4EA',
        paddingHorizontal: spacing.md,
        minHeight: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: storeTheme.text,
        marginLeft: spacing.sm,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
    },
    columnWrap: {
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '48.4%',
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        ...shadows.sm,
    },
    categoryAccentLine: {
        height: 4,
        width: '100%',
    },
    categoryGradient: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        minHeight: 176,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: spacing.sm,
    },
    categoryContent: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#15263A',
        lineHeight: 21,
        letterSpacing: -0.1,
    },
    categoryHint: {
        marginTop: spacing.xs,
        fontSize: 12,
        color: '#617487',
        lineHeight: 16,
    },
    categoryFooterRow: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    countPill: {
        borderRadius: borderRadius.full,
        paddingVertical: 5,
        paddingHorizontal: spacing.sm + 2,
        backgroundColor: '#EAF2F8',
    },
    countPillText: {
        fontSize: 11,
        color: '#6A7E92',
        fontWeight: '600',
    },
    arrowPill: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.82)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centered: {
        minHeight: 260,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    emptyText: {
        marginTop: spacing.sm,
        color: storeTheme.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    errorText: {
        marginTop: spacing.sm,
        textAlign: 'center',
        fontSize: 14,
        color: storeTheme.error || '#ef4444',
    },
    retryButton: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
        borderRadius: borderRadius.full,
        backgroundColor: storeTheme.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryText: {
        color: storeTheme.textOnPrimary,
        fontWeight: '600',
    },
});
