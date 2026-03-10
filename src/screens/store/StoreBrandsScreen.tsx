import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { borderRadius, shadows, spacing, storeTheme } from '../../theme/theme';
import storeService, { StoreBrand } from '../../services/storeService';
import { useCartStore } from '../../store/cartStore';
import { resolveStoreMediaSource } from '../../utils/productImage';

const toInitials = (name: string): string => {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0]?.toUpperCase() || '')
        .join('');
};

const BRAND_CARD_PALETTES = [
    {
        stripBg: '#BEEBE7',
        stripText: '#0D8A80',
        chipBg: '#08C6B1',
        chipText: '#FFFFFF',
        logoBg: '#D8F7F3',
        surfaceStart: '#F2FFFD',
    },
    {
        stripBg: '#D7D1F6',
        stripText: '#6A46DB',
        chipBg: '#7342E0',
        chipText: '#FFFFFF',
        logoBg: '#E5E0FA',
        surfaceStart: '#F8F6FF',
    },
    {
        stripBg: '#F6E7B9',
        stripText: '#A46A00',
        chipBg: '#F3A919',
        chipText: '#FFFFFF',
        logoBg: '#FFF0CC',
        surfaceStart: '#FFFBEF',
    },
    {
        stripBg: '#F4D0E6',
        stripText: '#B6327E',
        chipBg: '#E949A1',
        chipText: '#FFFFFF',
        logoBg: '#F9E0EF',
        surfaceStart: '#FFF6FB',
    },
];

const resolveBrandLogoSource = (value: string | null | undefined): ImageSourcePropType | null => {
    return resolveStoreMediaSource(value, {
        defaultUploadDir: 'brands',
        allowKnownProductAliases: false,
    });
};

const resolveBrandBannerSource = (value: string | null | undefined): ImageSourcePropType | null => {
    return resolveStoreMediaSource(value, {
        defaultUploadDir: 'brands',
        allowKnownProductAliases: false,
    });
};

export function StoreBrandsScreen({ route, navigation }: any) {
    const { categoryId, categoryName } = route.params || {};
    const [brands, setBrands] = React.useState<StoreBrand[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [failedLogos, setFailedLogos] = React.useState<Record<number, boolean>>({});
    const [failedBanners, setFailedBanners] = React.useState<Record<number, boolean>>({});
    const { totalItems, fetchCart } = useCartStore();

    const loadBrands = React.useCallback(async () => {
        if (!categoryId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await storeService.getBrandsByCategory(Number(categoryId));
            setBrands(response);
        } catch (err: any) {
            console.error('[StoreBrands] load failed:', err);
            setError(err?.message || 'Failed to load brands');
        } finally {
            setIsLoading(false);
        }
    }, [categoryId]);

    React.useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    useFocusEffect(
        React.useCallback(() => {
            fetchCart();
        }, [fetchCart])
    );

    const renderBrand = ({ item, index }: { item: StoreBrand; index: number }) => {
        const logoUrl = item.logo_url || item.logoUrl;
        const bannerUrl = item.banner_url || item.bannerUrl;
        const logoSource = resolveBrandLogoSource(logoUrl);
        const bannerSource = resolveBrandBannerSource(bannerUrl);
        const hasLogo = !!logoSource && !failedLogos[item.id];
        const hasBanner = !!bannerSource && !failedBanners[item.id];
        const palette = BRAND_CARD_PALETTES[index % BRAND_CARD_PALETTES.length];

        return (
            <TouchableOpacity
                style={styles.brandCard}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('ProductListing', {
                    categoryId: Number(categoryId),
                    brandId: item.id,
                    categoryName: categoryName || 'Category',
                    brandName: item.name,
                    themeColor: palette.chipBg,
                    themeDark: palette.stripText,
                })}
            >
                <LinearGradient
                    colors={[palette.surfaceStart, '#FFFFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.brandCardSurface}
                >
                    <View style={[styles.brandStrip, { backgroundColor: palette.stripBg }]}>
                        <View style={styles.stripLabelWrap}>
                            <Ionicons name="star" size={11} color={palette.stripText} />
                            <Text style={[styles.stripLabel, { color: palette.stripText }]}>FEATURED BRAND</Text>
                        </View>
                        <View style={[styles.stripChip, { backgroundColor: palette.chipBg }]}>
                            <Text style={[styles.stripChipText, { color: palette.chipText }]}>Shop now</Text>
                        </View>
                    </View>

                    <View style={styles.brandBody}>
                        <View style={[styles.logoWrap, { backgroundColor: palette.logoBg, borderColor: `${palette.chipBg}3A` }]}>
                            {hasLogo ? (
                                <Image
                                    source={logoSource}
                                    style={styles.logo}
                                    resizeMode="contain"
                                    onError={() => setFailedLogos(prev => ({ ...prev, [item.id]: true }))}
                                />
                            ) : (
                                <Text style={[styles.logoFallback, { color: palette.stripText }]}>
                                    {toInitials(item.name) || 'BR'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.brandContent}>
                            <Text style={styles.brandName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.brandHint}>Tap to view products</Text>
                        </View>

                        <View style={styles.trailingWrap}>
                            {hasBanner ? (
                                <Image
                                    source={bannerSource}
                                    style={styles.bannerThumb}
                                    resizeMode="cover"
                                    onError={() => setFailedBanners(prev => ({ ...prev, [item.id]: true }))}
                                />
                            ) : (
                                <View style={[styles.bannerThumbFallback, { backgroundColor: palette.logoBg }]}>
                                    <Ionicons name="pricetag-outline" size={14} color={palette.stripText} />
                                </View>
                            )}
                            <Ionicons name="chevron-forward" size={17} color={storeTheme.textSecondary} />
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#5B32CA', '#7E4FE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.titleWrap}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{categoryName || 'Brands'}</Text>
                    <Text style={styles.headerSubtitle}>Select a brand to browse products</Text>
                </View>
                <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
                    <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
                    {totalItems > 0 ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.sheet}>
                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={storeTheme.primary} />
                    </View>
                ) : null}

                {!isLoading && error ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle-outline" size={48} color={storeTheme.error || '#ef4444'} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadBrands}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {!isLoading && !error ? (
                    <FlatList
                        data={brands}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderBrand}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                        ListEmptyComponent={
                            <View style={styles.centered}>
                                <Ionicons name="ribbon-outline" size={48} color={storeTheme.textSecondary} />
                                <Text style={styles.emptyText}>No brands available in this category.</Text>
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
        backgroundColor: '#F5F8FA',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        marginRight: spacing.sm,
    },
    titleWrap: {
        flex: 1,
        marginRight: spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    cartButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        zIndex: 1,
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
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
    },
    brandCard: {
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#D9E8EE',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        ...shadows.sm,
    },
    brandCardSurface: {
        width: '100%',
    },
    brandStrip: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    stripLabelWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    stripLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    stripChip: {
        borderRadius: borderRadius.full,
        minHeight: 28,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stripChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    brandBody: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    logoWrap: {
        width: 58,
        height: 58,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    logo: {
        width: '78%',
        height: '78%',
    },
    logoFallback: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    brandContent: {
        flex: 1,
        marginHorizontal: spacing.md,
    },
    brandName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#17283B',
        letterSpacing: -0.1,
    },
    brandHint: {
        marginTop: 3,
        fontSize: 12,
        color: '#6A7E92',
    },
    trailingWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    bannerThumb: {
        width: 42,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    bannerThumbFallback: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    centered: {
        minHeight: 280,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
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
    emptyText: {
        marginTop: spacing.sm,
        color: storeTheme.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
});

