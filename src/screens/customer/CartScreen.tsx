// Cart Screen - Backend-aware, handles both product and service items

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { Button } from '../../components';
import { useCartStore } from '../../store';
import { BackendCartItem } from '../../store/cartStore';
import ordersService from '../../services/ordersService';
import { profileService } from '../../services/profileService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type CartScreenProps = { navigation: NativeStackNavigationProp<any> };

// Normalized cart item for safe rendering
interface NormalizedCartItem {
    cartItemId: number;
    itemType: 'product' | 'service';
    qty: number;
    unitPrice: number;
    title: string;
    productId?: number;
    serviceId?: number;
    bookingDate?: string;
    bookingTime?: string;
}

const REFERRAL_CODE_STORAGE_KEY = 'checkout_referral_code';
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{3,32}$/;

// Normalize backend cart item to UI-safe shape with safe defaults
const normalizeCartItem = (item: BackendCartItem): NormalizedCartItem => ({
    cartItemId: item.id ?? 0,
    itemType: item.itemType ?? 'product',
    qty: item.qty ?? 1,
    unitPrice: item.unitPrice ?? 0,
    title: item.itemType === 'product'
        ? (item.productName || 'Product')
        : (item.serviceName || 'Service'),
    productId: item.productId,
    serviceId: item.serviceId,
    bookingDate: item.bookingDate,
    bookingTime: item.bookingTime,
});

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { items, totalAmount, isLoading, fetchCart, updateCartItemQty, removeCartItem, clearLocalCart } = useCartStore();

    // Local State for Checkout
    const [checkoutModalVisible, setCheckoutModalVisible] = React.useState(false);
    const [isCheckingOut, setIsCheckingOut] = React.useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);
    const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
    const [orderId, setOrderId] = React.useState<string | null>(null);
    const [referralCode, setReferralCode] = React.useState('');

    const deliveryFee = totalAmount > 0 ? 99 : 0;
    const finalTotal = totalAmount + deliveryFee;

    const isReferralCodeValid = referralCode.length === 0 || REFERRAL_CODE_REGEX.test(referralCode);
    const referralCodeError = referralCode.length > 0 && !isReferralCodeValid ? 'Invalid code format' : null;

    // Fetch cart on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    useEffect(() => {
        const loadReferralCode = async () => {
            try {
                const storedCode = await AsyncStorage.getItem(REFERRAL_CODE_STORAGE_KEY);
                if (storedCode && REFERRAL_CODE_REGEX.test(storedCode)) {
                    setReferralCode(storedCode);
                }
            } catch (error) {
                console.warn('[CartScreen] Failed to load referral code:', error);
            }
        };

        loadReferralCode();
    }, []);

    // Normalize items safely
    const cartItemsRaw = items ?? [];
    const cartItems: NormalizedCartItem[] = cartItemsRaw
        .filter(Boolean)
        .map(normalizeCartItem);

    const getIcon = (itemType: 'product' | 'service'): keyof typeof Ionicons.glyphMap => {
        return itemType === 'service' ? 'construct' : 'cube';
    };

    const handleUpdateQty = async (cartItemId: number, newQty: number) => {
        try {
            await updateCartItemQty(cartItemId, newQty);
        } catch (error: any) {
            setCheckoutError(error.response?.data?.message || 'Failed to update quantity');
            setTimeout(() => setCheckoutError(null), 3000);
        }
    };

    const handleRemoveItem = async (cartItemId: number) => {
        try {
            await removeCartItem(cartItemId);
        } catch (error: any) {
            setCheckoutError(error.response?.data?.message || 'Failed to remove item');
            setTimeout(() => setCheckoutError(null), 3000);
        }
    };

    const handleCheckoutButton = () => {
        if (cartItems.length === 0) return;
        setCheckoutModalVisible(true);
    };

    const handleReferralCodeChange = (value: string) => {
        const normalized = value
            .toUpperCase()
            .replace(/\s+/g, '')
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 32);

        setReferralCode(normalized);
    };

    const handleClearReferralCode = async () => {
        setReferralCode('');
        try {
            await AsyncStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
        } catch (error) {
            console.warn('[CartScreen] Failed to clear referral code:', error);
        }
    };

    const resolveCheckoutAddressId = async (): Promise<number | null> => {
        const addresses = await profileService.getAddresses();
        if (addresses.length === 0) {
            setCheckoutError('Please add a delivery address before checkout.');
            setTimeout(() => setCheckoutError(null), 3000);
            setCheckoutModalVisible(false);
            Alert.alert(
                'Address Required',
                'Please add a delivery address to continue checkout.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Add Address',
                        onPress: () => navigation.navigate('Addresses'),
                    },
                ]
            );
            return null;
        }

        const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
        return Number(defaultAddress.id);
    };

    const confirmCheckout = async () => {
        setIsCheckingOut(true);
        setCheckoutError(null);
        try {
            const addressId = await resolveCheckoutAddressId();
            if (!addressId) {
                setIsCheckingOut(false);
                return;
            }

            const validReferralCode = isReferralCodeValid && referralCode.length > 0 ? referralCode : undefined;

            const result = await ordersService.checkout({
                addressId,
                paymentMethod: 'cod',
                referralCode: validReferralCode,
            });

            if (validReferralCode) {
                await AsyncStorage.setItem(REFERRAL_CODE_STORAGE_KEY, validReferralCode);
            }

            const createdOrderId = result.orderId;
            setOrderId(String(createdOrderId));
            setCheckoutModalVisible(false);
            clearLocalCart();
            fetchCart();

            // Go to payment screen to complete payment
            navigation.navigate('PaymentScreen', {
                amount: finalTotal,
                entityType: 'order',
                entityId: createdOrderId,
                description: 'AquaCare Order',
            });
        } catch (error: any) {
            console.error(error);
            setCheckoutError(error.response?.data?.message || 'Checkout failed');
            setTimeout(() => setCheckoutError(null), 3000);
            setCheckoutModalVisible(false);
        } finally {
            setIsCheckingOut(false);
        }
    };

    // Loading state
    if (isLoading && cartItems.length === 0) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[customerColors.primary, customerColors.primaryDark]}
                    style={[styles.header, { paddingTop: insets.top + spacing.md }]}
                >
                    <Ionicons name="cart" size={100} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Shopping Cart</Text>
                            <Text style={styles.headerSubtitle}>Items ready for checkout</Text>
                        </View>
                    </View>
                </LinearGradient>
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading cart...</Text>
                </View>
            </View>
        );
    }

    // Empty cart
    if (cartItems.length === 0) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[customerColors.primary, customerColors.primaryDark]}
                    style={[styles.header, { paddingTop: insets.top + spacing.md }]}
                >
                    <Ionicons name="cart" size={100} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Shopping Cart</Text>
                            <Text style={styles.headerSubtitle}>Your cart is currently empty</Text>
                        </View>
                    </View>
                </LinearGradient>
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Button title="Browse Products" onPress={() => navigation.navigate('CustomerTabs', { screen: 'Store' })} style={{ marginTop: 16, backgroundColor: customerColors.primaryDark }} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="cart" size={100} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Shopping Cart</Text>
                            <Text style={styles.headerSubtitle}>{cartItems.length} items ready for checkout</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => { clearLocalCart(); fetchCart(); }} style={styles.refreshButton}>
                        <Ionicons name="refresh" size={20} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView}>
                {cartItems.map((item) => (
                    <View key={String(item.cartItemId)} style={styles.cartItem}>
                        <View style={styles.itemImage}>
                            <Ionicons name={getIcon(item.itemType)} size={40} color={customerColors.primaryDark} />
                        </View>
                        <View style={styles.itemContent}>
                            <Text style={styles.itemName} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.itemPrice}>₹{item.unitPrice.toLocaleString()}</Text>
                            {item.itemType === 'service' && item.bookingDate && (
                                <View style={styles.bookingInfo}>
                                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.bookingText}>{item.bookingDate} at {item.bookingTime}</Text>
                                </View>
                            )}
                            <View style={styles.quantityRow}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => handleUpdateQty(item.cartItemId, item.qty - 1)}
                                >
                                    <Ionicons name="remove" size={18} color={customerColors.primaryDark} />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{item.qty}</Text>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => handleUpdateQty(item.cartItemId, item.qty + 1)}
                                >
                                    <Ionicons name="add" size={18} color={customerColors.primaryDark} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveItem(item.cartItemId)}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Price Details</Text>
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text>₹{totalAmount.toLocaleString()}</Text></View>
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery Fee</Text><Text>₹{deliveryFee}</Text></View>
                    <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{finalTotal.toLocaleString()}</Text></View>
                </View>
            </ScrollView>

            {/* Error Banner in Cart */}
            {checkoutError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color={colors.error} />
                    <Text style={styles.errorBannerText}>{checkoutError}</Text>
                </View>
            )}

            <View style={styles.bottomBar}>
                <View><Text style={styles.bottomLabel}>Total</Text><Text style={styles.bottomPrice}>₹{finalTotal.toLocaleString()}</Text></View>
                <Button title="Checkout" onPress={handleCheckoutButton} style={{ paddingHorizontal: 32, backgroundColor: customerColors.primaryDark }} />
            </View>

            {/* Checkout Confirmation Modal */}
            <Modal
                transparent
                visible={checkoutModalVisible}
                animationType="fade"
                onRequestClose={() => setCheckoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Ionicons name="cart-outline" size={48} color={colors.primary} />
                        <Text style={styles.confirmTitle}>Confirm Order</Text>
                        <Text style={styles.confirmDesc}>
                            Total Amount: ₹{finalTotal.toLocaleString()}
                        </Text>
                        <View style={styles.paymentMethod}>
                            <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
                            <Text style={styles.paymentText}>Cash on Delivery</Text>
                        </View>

                        <View style={styles.referralSection}>
                            <View style={styles.referralHeader}>
                                <Text style={styles.referralLabel}>Referral Code (optional)</Text>
                                {referralCode.length > 0 ? (
                                    <TouchableOpacity onPress={handleClearReferralCode}>
                                        <Text style={styles.referralClearText}>Clear</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <TextInput
                                value={referralCode}
                                onChangeText={handleReferralCodeChange}
                                placeholder="Enter agent code"
                                autoCapitalize="characters"
                                autoCorrect={false}
                                style={[styles.referralInput, referralCodeError ? styles.referralInputError : null]}
                                placeholderTextColor={colors.textLight}
                                maxLength={32}
                            />
                            <Text style={styles.referralHelperText}>Enter agent code to support them and unlock offers.</Text>
                            {referralCodeError ? (
                                <Text style={styles.referralErrorText}>{referralCodeError}</Text>
                            ) : null}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setCheckoutModalVisible(false)}
                            >
                                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={confirmCheckout}
                                disabled={isCheckingOut}
                            >
                                {isCheckingOut ? (
                                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                                ) : (
                                    <Text style={styles.modalBtnTextConfirm}>Place Order</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Overlay */}
            {
                checkoutSuccess && (
                    <View style={styles.successOverlay}>
                        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                        <Text style={styles.successTitle}>Order Placed! 🎉</Text>
                        <Text style={styles.successDesc}>Order #{orderId} has been placed successfully.</Text>
                    </View>
                )
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerIconBg: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
        marginLeft: -spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        ...typography.headerTitle,
        color: colors.textOnPrimary,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },
    refreshButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearText: { ...typography.bodySmall, color: colors.primary },
    scrollView: { flex: 1, padding: spacing.md },
    cartItem: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm, alignItems: 'center' },
    itemImage: { width: 70, height: 70, borderRadius: borderRadius.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    itemContent: { flex: 1, marginLeft: spacing.md },
    itemName: { ...typography.body, fontWeight: '600', color: colors.text },
    itemPrice: { ...typography.body, color: customerColors.primaryDark, fontWeight: '700' },
    bookingInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    bookingText: { ...typography.caption, color: colors.textSecondary },
    quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
    quantityButton: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: customerColors.primaryDark, alignItems: 'center', justifyContent: 'center' },
    quantityText: { ...typography.body, fontWeight: '600', minWidth: 24, textAlign: 'center' },
    summaryCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.xl, ...shadows.sm },
    summaryTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    summaryLabel: { color: colors.textSecondary },
    totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.sm },
    totalLabel: { fontWeight: '600' },
    totalValue: { ...typography.h3, color: customerColors.primaryDark, fontWeight: '700' },
    bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    bottomLabel: { ...typography.caption, color: colors.textSecondary },
    bottomPrice: { ...typography.h3, fontWeight: '700' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    emptyTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg },
    loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    confirmModal: { backgroundColor: colors.surface, width: '100%', maxWidth: 320, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', ...shadows.md },
    confirmTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
    confirmDesc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', marginBottom: spacing.sm },
    paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSecondary, padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.xl },
    paymentText: { ...typography.body, color: colors.text },
    referralSection: { width: '100%', marginBottom: spacing.lg },
    referralHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    referralLabel: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
    referralClearText: { ...typography.caption, color: customerColors.primaryDark, fontWeight: '600' },
    referralInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        color: colors.text,
        ...typography.body,
    },
    referralInputError: {
        borderColor: colors.error,
    },
    referralHelperText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    referralErrorText: { ...typography.caption, color: colors.error, marginTop: 2 },
    modalActions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: colors.surfaceSecondary },
    modalBtnConfirm: { backgroundColor: customerColors.primaryDark },
    modalBtnTextCancel: { ...typography.body, fontWeight: '600', color: colors.text },
    modalBtnTextConfirm: { ...typography.body, fontWeight: '600', color: colors.textOnPrimary },
    // Success Overlay
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: spacing.xl },
    successTitle: { ...typography.h2, color: colors.success, marginTop: spacing.md, textAlign: 'center' },
    successDesc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    // Error Banner
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.error + '15', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.error + '30', position: 'absolute', bottom: 80, left: spacing.md, right: spacing.md, borderRadius: borderRadius.md },
    errorBannerText: { ...typography.bodySmall, color: colors.error, flex: 1, fontWeight: '600' },
});
