// Product Details Screen - API-backed with real cart integration

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { Button } from '../../components';
import { useCartStore } from '../../store/cartStore';
import storeService, { StoreProduct } from '../../services/storeService';
import { resolveProductImageSource } from '../../utils/productImage';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icon mapping for product categories
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    'water-cans': 'water',
    'dispensers': 'cube',
    'filters': 'filter',
    'accessories': 'construct',
    'pumps': 'hardware-chip',
    'coolers': 'snow',
};

export const ProductDetailsScreen = ({ navigation, route }: any) => {
    const { productId } = route.params;
    const [product, setProduct] = useState<StoreProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { addProductToCart, totalItems, fetchCart } = useCartStore();

    useEffect(() => {
        loadProduct();
        fetchCart();
    }, [productId]);

    const loadProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await storeService.getProductById(productId);
            setProduct(data);
        } catch (err: any) {
            console.error('[ProductDetails] Error loading product:', err);
            setError(err.message || 'Failed to load product');
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        const slug = product?.category?.slug || '';
        return ICON_MAP[slug] || 'cube';
    };

    const handleAddToCart = async () => {
        if (!product) return;
        setAddingToCart(true);
        try {
            await addProductToCart(product.id, 1);
            console.log('[ProductDetails] Added to cart');
        } catch (err: any) {
            console.error('[ProductDetails] Add to cart error:', err);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!product) return;
        setAddingToCart(true);
        try {
            await addProductToCart(product.id, 1);
            navigation.navigate('Cart');
        } catch (err: any) {
            console.error('[ProductDetails] Buy now error:', err);
        } finally {
            setAddingToCart(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading product...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
                    <Text style={styles.errorText}>{error || 'Product not found'}</Text>
                    <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
                </View>
            </SafeAreaView>
        );
    }

    const inStock = product.stockQty > 0;
    const mrp = product.mrp ?? product.price;
    const hasDiscount = mrp > product.price;
    const discount = hasDiscount
        ? Math.round(((mrp - product.price) / mrp) * 100)
        : 0;
    const imageSource = resolveProductImageSource(product.imageUrl);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cartButton}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Ionicons name="cart-outline" size={24} color={colors.text} />
                        {totalItems > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Product Image */}
                <View style={styles.imageContainer}>
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                    )}
                    {imageSource ? (
                        <Image source={imageSource} style={styles.productImage} resizeMode="contain" />
                    ) : (
                        <Ionicons name={getIcon()} size={120} color={colors.primary} />
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.content}>
                    <Text style={styles.productName}>{product.name}</Text>

                    {/* Category & Stock */}
                    <View style={styles.ratingRow}>
                        <View style={styles.categoryChip}>
                            <Ionicons name={getIcon()} size={14} color={colors.primary} />
                            <Text style={styles.categoryText}>{product.category?.name || 'Product'}</Text>
                        </View>
                        {inStock ? (
                            <View style={styles.stockBadge}>
                                <Text style={styles.stockText}>In Stock ({product.stockQty})</Text>
                            </View>
                        ) : (
                            <View style={[styles.stockBadge, styles.outOfStock]}>
                                <Text style={[styles.stockText, styles.outOfStockText]}>Out of Stock</Text>
                            </View>
                        )}
                    </View>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{Number(product.price).toLocaleString()}</Text>
                        {hasDiscount && (
                            <Text style={styles.originalPrice}>₹{Number(mrp).toLocaleString()}</Text>
                        )}
                        {discount > 0 && (
                            <Text style={styles.saveText}>You save ₹{(mrp - product.price).toLocaleString()}</Text>
                        )}
                    </View>

                    {/* Free Installation Banner */}
                    <View style={styles.offerBanner}>
                        <Ionicons name="gift" size={24} color={colors.success} />
                        <View style={styles.offerContent}>
                            <Text style={styles.offerTitle}>Free Installation</Text>
                            <Text style={styles.offerDesc}>Professional installation by our experts</Text>
                        </View>
                    </View>

                    {/* Description */}
                    {product.description ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    ) : null}

                    {/* SKU */}
                    {product.sku && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Product Details</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>SKU</Text>
                                <Text style={styles.detailValue}>{product.sku}</Text>
                            </View>
                        </View>
                    )}

                    {/* Delivery Info */}
                    <View style={styles.deliveryCard}>
                        <View style={styles.deliveryRow}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={styles.deliveryText}>Delivery available to your location</Text>
                        </View>
                        <View style={styles.deliveryRow}>
                            <Ionicons name="time" size={20} color={colors.primary} />
                            <Text style={styles.deliveryText}>Estimated delivery in 3-5 days</Text>
                        </View>
                        <View style={styles.deliveryRow}>
                            <Ionicons name="reload" size={20} color={colors.primary} />
                            <Text style={styles.deliveryText}>7-day return policy</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            {inStock && (
                <View style={styles.bottomBar}>
                    <Button
                        title={addingToCart ? 'Adding...' : 'Add to Cart'}
                        onPress={handleAddToCart}
                        variant="outline"
                        style={styles.addToCartButton}
                        disabled={addingToCart}
                    />
                    <Button
                        title="Buy Now"
                        onPress={handleBuyNow}
                        style={styles.buyNowButton}
                        disabled={addingToCart}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    errorText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    cartButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    imageContainer: {
        height: 250,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    discountBadge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        backgroundColor: colors.error,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    discountText: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.textOnPrimary,
    },
    content: {
        padding: spacing.md,
    },
    productName: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    categoryText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    stockBadge: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    stockText: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.success,
    },
    outOfStock: {
        backgroundColor: colors.error + '20',
    },
    outOfStockText: {
        color: colors.error,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    price: {
        ...typography.h1,
        color: colors.primary,
        fontWeight: '700',
    },
    originalPrice: {
        ...typography.h3,
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    saveText: {
        ...typography.bodySmall,
        color: colors.success,
        fontWeight: '600',
    },
    offerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '15',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    offerContent: {
        flex: 1,
    },
    offerTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.success,
    },
    offerDesc: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.md,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    detailLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    detailValue: {
        ...typography.body,
        color: colors.text,
        fontWeight: '600',
    },
    deliveryCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
        gap: spacing.md,
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    deliveryText: {
        ...typography.bodySmall,
        color: colors.text,
    },
    bottomBar: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.md,
    },
    addToCartButton: {
        flex: 1,
    },
    buyNowButton: {
        flex: 1,
    },
});
