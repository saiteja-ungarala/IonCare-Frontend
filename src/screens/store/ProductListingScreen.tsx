import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, shadows, spacing, storeTheme } from '../../theme/theme';
import storeService, { StoreProduct } from '../../services/storeService';
import { useCartStore } from '../../store/cartStore';
import { getProductImageSource, resolveProductImageSources } from '../../utils/productImage';

type ProductSort = 'popular' | 'new' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: Array<{ value: ProductSort; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { value: 'popular', label: 'Popular', icon: 'flame' },
    { value: 'new', label: 'Newest', icon: 'sparkles' },
    { value: 'price_asc', label: 'Price Up', icon: 'trending-up-outline' },
    { value: 'price_desc', label: 'Price Down', icon: 'trending-down-outline' },
];

const PRODUCT_CARD_PALETTES = [
    {
        media: ['#BFECE5', '#AEE6DE'] as const,
        button: ['#00B8A4', '#009B8C'] as const,
        brand: '#009C88',
    },
    {
        media: ['#D8D2F3', '#CCC5EE'] as const,
        button: ['#6E42DE', '#5B32CA'] as const,
        brand: '#6A46DB',
    },
    {
        media: ['#F5E3AD', '#F2DB98'] as const,
        button: ['#F2A81A', '#E09200'] as const,
        brand: '#D88400',
    },
    {
        media: ['#C4EFD1', '#B4E6C4'] as const,
        button: ['#22B15A', '#159749'] as const,
        brand: '#1B9F53',
    },
];

const showAddedToCartToast = (): void => {
    if (Platform.OS === 'android') {
        ToastAndroid.show('Added to cart', ToastAndroid.SHORT);
        return;
    }

    Alert.alert('Cart', 'Added to cart');
};

const formatPrice = (value: number): string => {
    const normalized = Number(value) || 0;
    const showDecimals = normalized % 1 !== 0;
    return `₹${normalized.toLocaleString('en-IN', {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
};

export function ProductListingScreen({ route, navigation }: any) {
    const { categoryId, brandId, categoryName, brandName, themeColor, themeDark } = route.params || {};
    const [products, setProducts] = React.useState<StoreProduct[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');
    const [appliedSearch, setAppliedSearch] = React.useState('');
    const [appliedSort, setAppliedSort] = React.useState<ProductSort>('popular');
    const [addingToCartId, setAddingToCartId] = React.useState<number | null>(null);
    const [failedImages, setFailedImages] = React.useState<Record<number, boolean>>({});
    const [imageAttempts, setImageAttempts] = React.useState<Record<number, number>>({});
    const { addProductToCart, totalItems, fetchCart } = useCartStore();
    const insets = useSafeAreaInsets();

    const loadProducts = React.useCallback(async () => {
        if (!categoryId || !brandId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await storeService.getProducts({
                category_id: Number(categoryId),
                brand_id: Number(brandId),
                search: appliedSearch.trim() || undefined,
                sort: appliedSort,
                page: 1,
                limit: 100,
            });
            setProducts(response.items);
            setFailedImages({});
            setImageAttempts({});
        } catch (err: any) {
            console.error('[StoreProductList] load failed:', err);
            setError(err?.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
        }
    }, [categoryId, brandId, appliedSearch, appliedSort]);

    React.useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useFocusEffect(
        React.useCallback(() => {
            fetchCart();
        }, [fetchCart]),
    );

    const handleAddToCart = async (product: StoreProduct) => {
        setAddingToCartId(product.id);
        try {
            await addProductToCart(product.id, 1);
            showAddedToCartToast();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to add product to cart');
        } finally {
            setAddingToCartId(null);
        }
    };

    const renderProduct = ({ item, index }: { item: StoreProduct; index: number }) => {
        const productImage = item.imageUrl
            || item.imageUrl1
            || item.imageUrl2
            || item.imageUrl3
            || item.imageUrl4
            || item.imageUrl5
            || item.image_url
            || item.image_url1
            || item.image_url2
            || item.image_url3
            || item.image_url4
            || item.image_url5
            || item.image_url_full
            || item.imageUrlFull;
        const imageSources = resolveProductImageSources(productImage);
        const sourceCount = imageSources.length;
        const attemptIndex = Math.max(0, Math.min(imageAttempts[item.id] || 0, Math.max(sourceCount - 1, 0)));
        const imageSource = sourceCount > 0 ? imageSources[attemptIndex] : getProductImageSource(productImage);
        const shouldShowImage = !failedImages[item.id];
        const showMrp = item.mrp != null && item.mrp > item.price;
        const discountPercent = showMrp ? Math.max(1, Math.round(((item.mrp! - item.price) / item.mrp!) * 100)) : 0;
        const isOutOfStock = item.stockQty <= 0;
        const savingsAmount = showMrp ? item.mrp! - item.price : 0;
        const palette = PRODUCT_CARD_PALETTES[index % PRODUCT_CARD_PALETTES.length];

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.93}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
            >
                <View style={styles.mediaWrap}>
                    <LinearGradient
                        colors={palette.media}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />

                    <View style={styles.badgeRow}>
                        {discountPercent > 0 ? (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                            </View>
                        ) : (
                            <View />
                        )}
                        <View style={[styles.stockBadge, isOutOfStock ? styles.stockBadgeMuted : null]}>
                            <Text style={[styles.stockText, isOutOfStock ? styles.stockTextMuted : null]}>
                                {isOutOfStock ? 'Out of stock' : 'In stock'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.wishlistGhost}
                        activeOpacity={0.8}
                        onPress={(event) => event.stopPropagation()}
                    >
                        <Ionicons name="heart" size={14} color="#D2B7DC" />
                    </TouchableOpacity>

                    <View style={styles.imageStage}>
                        {shouldShowImage ? (
                            <Image
                                source={imageSource}
                                style={styles.productImage}
                                resizeMode="contain"
                                onError={() => {
                                    if (attemptIndex < sourceCount - 1) {
                                        setImageAttempts((prev) => ({ ...prev, [item.id]: attemptIndex + 1 }));
                                        return;
                                    }

                                    if (__DEV__) {
                                        const candidateUris = imageSources
                                            .map((source) => (source as any)?.uri)
                                            .filter(Boolean);
                                        console.warn('[StoreProductList] image failed after all candidates', {
                                            productId: item.id,
                                            rawImage: productImage,
                                            candidateUris,
                                        });
                                    }

                                    setFailedImages((prev) => {
                                        if (prev[item.id]) {
                                            return prev;
                                        }
                                        return { ...prev, [item.id]: true };
                                    });
                                }}
                            />
                        ) : (
                            <View style={styles.imageFallback}>
                                <Ionicons name="image-outline" size={22} color={storeTheme.textSecondary} />
                                <Text style={styles.imageFallbackText}>No image</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.bodyWrap}>
                    <Text style={[styles.brandTag, { color: palette.brand }]} numberOfLines={1}>
                        {(item.brand?.name || brandName || 'Brand').toUpperCase()}
                    </Text>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
                        {showMrp ? (
                            <Text style={styles.mrpText}>{formatPrice(item.mrp!)}</Text>
                        ) : null}
                    </View>

                    {showMrp ? (
                        <Text style={styles.savingsText}>Save {formatPrice(savingsAmount)}</Text>
                    ) : (
                        <View style={styles.savingsSpacer} />
                    )}

                    {isOutOfStock ? (
                        <View style={[styles.addButton, styles.outOfStockButton]}>
                            <Text style={styles.outOfStockText}>Out of stock</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={(event) => {
                                event.stopPropagation();
                                handleAddToCart(item);
                            }}
                            disabled={addingToCartId === item.id}
                        >
                            <LinearGradient
                                colors={palette.button}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.addButtonGradient}
                            >
                                {addingToCartId === item.id ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <View style={styles.addButtonContent}>
                                        <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                                        <Text style={styles.addButtonText}>Add to Cart</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={themeDark && themeColor ? [themeDark, themeColor] : ['#0D7C5A', '#15A67A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.xs }]}
            >
                <View style={styles.headerTopRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{brandName || 'Products'}</Text>
                        <Text style={styles.headerSubtitle}>Browse products & offers</Text>
                    </View>
                    <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
                        {totalItems > 0 ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                </View>

                {/* Integrated Translucent Search Bar */}
                <View style={styles.integratedSearchBar}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.8)" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search products..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        style={styles.searchInputCustom}
                        returnKeyType="search"
                        onSubmitEditing={() => setAppliedSearch(search)}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => { setSearch(''); setAppliedSearch(''); }}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </LinearGradient>

            <View style={styles.controlsPanel}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sortRow}
                >
                    {SORT_OPTIONS.map(option => {
                        const isActive = option.value === appliedSort;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setAppliedSort(option.value)}
                                style={[styles.sortChip, isActive ? styles.sortChipActive : null]}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={14}
                                    color={isActive ? '#FFFFFF' : storeTheme.textSecondary}
                                />
                                <Text style={[styles.sortChipText, isActive ? styles.sortChipTextActive : null]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
                    <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {!isLoading && !error ? (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderProduct}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrap}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="cube-outline" size={52} color={storeTheme.textSecondary} />
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptySubtitle}>Try a different search term.</Text>
                        </View>
                    }
                />
            ) : null}
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
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    integratedSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 24,
        paddingHorizontal: spacing.md,
        height: 48,
        marginTop: spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    searchInputCustom: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: spacing.sm,
    },
    backButton: {
        padding: spacing.xs,
        marginLeft: -spacing.xs,
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: spacing.sm,
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
    controlsPanel: {
        paddingVertical: spacing.md,
        backgroundColor: '#FFFFFF',
        ...shadows.sm,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#D7E3EA',
        paddingHorizontal: spacing.md,
        minHeight: 48,
    },
    searchInput: {
        flex: 1,
        marginHorizontal: spacing.sm,
        color: storeTheme.text,
        fontSize: 13,
    },
    sortRow: {
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
        gap: spacing.sm,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        minHeight: 40,
        borderRadius: borderRadius.md,
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#D7E3EA',
        paddingHorizontal: spacing.md,
    },
    sortChipActive: {
        backgroundColor: '#11263D',
        borderColor: '#11263D',
    },
    sortChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6A7E92',
    },
    sortChipTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    columnWrap: {
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48.4%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#D4E1E8',
        overflow: 'hidden',
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    mediaWrap: {
        height: 148,
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.xl + 2,
        paddingBottom: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badgeRow: {
        position: 'absolute',
        left: spacing.sm,
        right: spacing.sm,
        top: spacing.sm,
        zIndex: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    discountBadge: {
        paddingHorizontal: spacing.sm,
        minHeight: 24,
        borderRadius: borderRadius.full,
        backgroundColor: '#FF5B5B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    stockBadge: {
        paddingHorizontal: spacing.sm,
        minHeight: 24,
        borderRadius: borderRadius.full,
        backgroundColor: '#1FB55D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stockBadgeMuted: {
        backgroundColor: '#8C9BA8',
    },
    stockText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    stockTextMuted: {
        color: '#FFFFFF',
    },
    wishlistGhost: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.88)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        zIndex: 6,
    },
    imageStage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.78)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
    },
    productImage: {
        width: '97%',
        height: '97%',
    },
    imageFallback: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageFallbackText: {
        marginTop: 4,
        fontSize: 11,
        color: storeTheme.textSecondary,
    },
    bodyWrap: {
        paddingHorizontal: spacing.sm + 2,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm + 2,
    },
    brandTag: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.25,
    },
    productName: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '600',
        color: '#132336',
        minHeight: 40,
    },
    priceRow: {
        marginTop: spacing.xs,
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#132336',
        letterSpacing: -0.15,
    },
    mrpText: {
        marginLeft: spacing.xs,
        fontSize: 11,
        color: '#7F92A4',
        textDecorationLine: 'line-through',
    },
    savingsText: {
        marginTop: 2,
        fontSize: 11,
        color: '#1A9E50',
        fontWeight: '600',
    },
    savingsSpacer: {
        height: 17,
    },
    addButton: {
        marginTop: spacing.sm,
        minHeight: 44,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    addButtonGradient: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    outOfStockButton: {
        backgroundColor: '#E5EDF2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    outOfStockText: {
        color: '#6A7E92',
        fontSize: 12,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        minHeight: 320,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
        marginTop: spacing.sm,
        fontSize: 15,
        fontWeight: '600',
        color: storeTheme.text,
    },
    emptySubtitle: {
        marginTop: spacing.xs,
        fontSize: 13,
        color: storeTheme.textSecondary,
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
