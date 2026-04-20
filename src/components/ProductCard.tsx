// ProductCard component for displaying products
// Premium design with responsive sizing

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../theme/theme';
import { Product } from '../models/types';
import { getProductImageSource } from '../utils/productImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_HORIZONTAL_PAD = spacing.lg * 2;
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - CARD_HORIZONTAL_PAD - CARD_GAP) / 2;

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    onAddToCart?: () => void;
    customColors?: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onPress,
    onAddToCart,
    customColors,
}) => {
    const theme = customColors || colors;
    const [imageError, setImageError] = useState(false);

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (product.category) {
            case 'water_purifier': return 'water';
            case 'water_softener': return 'beaker';
            case 'water_ionizer': return 'flash';
            default: return 'cube';
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, { width: PRODUCT_CARD_WIDTH }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {discount > 0 && (
                <View style={[styles.discountBadge, { backgroundColor: '#FF7043' }]}>
                    <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
            )}

            <View style={[styles.imageContainer, { backgroundColor: theme.surfaceSecondary || '#F3F4F6' }]}>
                {!imageError ? (
                    <View style={styles.imageStage}>
                        <Image
                            source={getProductImageSource((product as any).image_url || product.image)}
                            style={styles.productImage}
                            resizeMode="contain"
                            onError={() => setImageError((prev) => (prev ? prev : true))}
                        />
                    </View>
                ) : (
                    <View style={styles.iconCircle}>
                        <Ionicons name={getIcon()} size={36} color={theme.primary} />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
                    {product.name}
                </Text>

                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.rating, { color: theme.text }]}>{product.rating}</Text>
                    <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>({product.reviewCount})</Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: theme.primary }]} numberOfLines={1}>
                        ₹{product.price.toLocaleString()}
                    </Text>
                    {product.originalPrice && (
                        <Text style={[styles.originalPrice, { color: theme.textSecondary }]} numberOfLines={1}>
                            ₹{product.originalPrice.toLocaleString()}
                        </Text>
                    )}
                </View>

                {onAddToCart && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onAddToCart();
                        }}
                    >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: 0,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    discountBadge: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
        zIndex: 1,
    },
    discountText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    imageContainer: {
        height: 128,
        padding: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageStage: {
        width: '100%',
        height: '100%',
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.78)',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
    },
    productImage: {
        width: '97%',
        height: '97%',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: spacing.md,
        paddingTop: spacing.sm,
    },
    name: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
        lineHeight: 18,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        marginLeft: 3,
    },
    reviewCount: {
        fontSize: 11,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flexWrap: 'nowrap',
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
        flexShrink: 0,
    },
    originalPrice: {
        fontSize: 12,
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
        flexShrink: 1,
    },
    addButton: {
        position: 'absolute',
        right: spacing.sm,
        bottom: spacing.sm,
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
