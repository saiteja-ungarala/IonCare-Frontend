// Customer Home Screen - Premium Modern Dashboard
// Clean, vibrant, high-contrast with responsive layout

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import {
    AppBar,
    CategoryChip,
    ServiceCard,
    ProductCard,
    FadeInView,
    BubbleCelebration,
    BannerCarousel,
    type CategoryItem,
    type BannerItem,
} from '../../components';
import { useCartStore, useAuthStore } from '../../store';
import { catalogService } from '../../services/catalogService';
import api from '../../services/api';
import { Product, Service } from '../../models/types';

const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api').replace(/\/api$/, '');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = spacing.md;
const GRID_PAD = spacing.lg;

type CustomerHomeScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

// Category data for horizontal scroll
const categories: CategoryItem[] = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'purifier', name: 'Purifiers', icon: 'water' },
    { id: 'softener', name: 'Softeners', icon: 'beaker' },
    { id: 'ionizer', name: 'Ionizers', icon: 'flash' },
    { id: 'spares', name: 'Spares', icon: 'construct' },
];

const homeBanners: BannerItem[] = [
    {
        id: '1',
        title: 'Complete Care',
        subtitle: 'Annual maintenance plan starting @ Rs 2999',
        image: require('../../../assets/b1.jpg'),
        backgroundColor: customerColors.primary,
        ctaText: 'View Plans',
    },
    {
        id: '2',
        title: 'New Alkalisers',
        subtitle: 'Upgrade your water quality today',
        image: require('../../../assets/b2.jpg'),
        backgroundColor: customerColors.primaryDark,
        ctaText: 'Shop Now',
    },
    {
        id: '3',
        title: 'Refer & Earn',
        subtitle: 'Get Rs 500 for every friend you invite',
        image: require('../../../assets/b3.jpg'),
        backgroundColor: '#7FA650',
        ctaText: 'Invite',
    },
    {
        id: '4',
        title: 'Free Water Test',
        subtitle: 'Check your TDS level at home for free',
        image: require('../../../assets/b4.webp'),
        backgroundColor: customerColors.secondary,
        ctaText: 'Book Now',
    },
];

// Feature colors - each feature gets a unique icon tint
const FEATURE_COLORS = ['#00B8D9', '#7FA650', '#FF7043', '#7C4DFF'];

export const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = ({
    navigation,
}) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>(homeBanners);
    const { showLoginCelebration, setShowLoginCelebration } = useAuthStore();
    const { items: cartItems } = useCartStore();

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                const [serviceList, productList] = await Promise.all([
                    catalogService.getServices(),
                    catalogService.getProducts(),
                ]);
                setServices(serviceList);
                setProducts(productList);
            } catch (error) {
                console.error('[CustomerHome] Failed to load data:', error);
                setServices([]);
                setProducts([]);
            }
        };

        const loadBanners = async () => {
            try {
                const res = await api.get('/banners/active');
                const data: any[] = res.data?.data ?? [];
                if (data.length > 0) {
                    setBanners(data.map((b: any) => ({
                        id: String(b.id),
                        title: b.title,
                        subtitle: b.subtitle ?? undefined,
                        image: b.image_url
                            ? { uri: SERVER_BASE + b.image_url }
                            : require('../../../assets/b1.jpg'),
                        backgroundColor: customerColors.primary,
                        ctaText: b.link_type && b.link_type !== 'none' ? 'View' : undefined,
                    })));
                }
            } catch {
                // keep default homeBanners on failure
            }
        };

        loadHomeData();
        loadBanners();
    }, []);

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={customerColors.primary} />
            <View style={styles.mainContent}>
                {/* Premium Teal Header */}
                <LinearGradient
                    colors={[customerColors.primary, customerColors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.premiumHeader, { paddingTop: insets.top + spacing.xs }]}
                >
                    {/* Background Decor */}
                    <Ionicons name="water" size={180} color="rgba(255,255,255,0.06)" style={styles.headerBgDecor} />
                    <Ionicons name="sparkles" size={50} color="rgba(255,255,255,0.06)" style={styles.headerBgDecor2} />

                    <View style={styles.headerTopRow}>
                        <TouchableOpacity style={styles.headerLocationBtn} activeOpacity={0.7} onPress={() => Alert.alert('Location', 'Location selector coming soon!')}>
                            <View style={styles.headerLocationIcon}>
                                <Ionicons name="location" size={20} color={customerColors.primaryDark} />
                            </View>
                            <View style={styles.headerLocationTextWrap}>
                                <Text style={styles.headerLocationLabel}>DELIVER TO</Text>
                                <View style={styles.headerLocationRow}>
                                    <Text style={styles.headerLocationText} numberOfLines={1}>Select Location</Text>
                                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 4, marginTop: 1 }} />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Profile')}>
                                <Ionicons name="person-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert('Notifications', 'No new notifications')}>
                                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                                {/* Notification Badge */}
                                <View style={styles.headerBadge}>
                                    <Text style={styles.headerBadgeText}>2</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.headerGreeting}>
                        <Text style={styles.headerGreetingTitle}>Our Services</Text>
                        <Text style={styles.headerGreetingSub}>Select a service to book</Text>
                    </View>

                    {/* Integrated Translucent Search Bar */}
                    <TouchableOpacity style={styles.integratedSearchBar} activeOpacity={0.8} onPress={() => navigation.navigate('Search')}>
                        <View style={styles.searchIconCustom}>
                            <Ionicons name="search" size={18} color="#FFFFFF" />
                        </View>
                        <Text style={styles.searchPlaceholderCustom}>Search services, filters, spares...</Text>
                        <View style={styles.searchMicCustom}>
                            <Ionicons name="mic" size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </LinearGradient>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >

                    {/* Category Chips */}
                    <CategoryChip
                        categories={categories}
                        selectedId={selectedCategory}
                        onSelect={setSelectedCategory}
                        customColors={customerColors}
                    />

                    {/* Promotional Banners */}
                    <BannerCarousel
                        banners={banners}
                        onBannerPress={(banner) => Alert.alert('Banner', `Pressed: ${banner.title}`)}
                    />

                    {/* Book Service Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleWrap}>
                                <View style={[styles.sectionAccent, { backgroundColor: customerColors.primary }]} />
                                <Text style={styles.sectionTitle}>Popular Services</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Services')} style={styles.viewAllBtn}>
                                <Text style={styles.viewAll}>View All</Text>
                                <Ionicons name="arrow-forward" size={14} color={customerColors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.serviceGrid}>
                            {services.slice(0, 4).map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    onPress={() =>
                                        navigation.navigate('ServiceDetails', { service })
                                    }
                                    compact
                                    customColors={customerColors}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Referral Banner */}
                    <TouchableOpacity style={styles.referralBanner} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#E8F5E9', '#F1F8E9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.referralGradient}
                        >
                            <View style={styles.referralIconWrap}>
                                <Ionicons name="gift" size={24} color={'#7FA650'} />
                            </View>
                            <View style={styles.referralContent}>
                                <Text style={styles.referralTitle}>Refer & Earn ₹500</Text>
                                <Text style={styles.referralDesc}>Invite friends to AquaCare</Text>
                            </View>
                            <View style={styles.referralArrow}>
                                <Ionicons name="arrow-forward" size={18} color={'#7FA650'} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Water Products Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleWrap}>
                                <View style={[styles.sectionAccent, { backgroundColor: '#FF7043' }]} />
                                <Text style={styles.sectionTitle}>Water Products</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Store')} style={styles.viewAllBtn}>
                                <Text style={styles.viewAll}>View All</Text>
                                <Ionicons name="arrow-forward" size={14} color={customerColors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.productGrid}>
                            {products.slice(0, 4).map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onPress={() => navigation.navigate('Store')}
                                    onAddToCart={() => navigation.navigate('Store')}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Why Choose Us Section */}
                    <View style={styles.whyChooseSection}>
                        <View style={styles.sectionTitleWrap}>
                            <View style={[styles.sectionAccent, { backgroundColor: '#7C4DFF' }]} />
                            <Text style={styles.sectionTitle}>Why Choose AquaCare?</Text>
                        </View>

                        <View style={styles.featuresGrid}>
                            {[
                                { icon: 'shield-checkmark', title: 'Verified Experts', desc: 'Background checked' },
                                { icon: 'time', title: 'On-Time Service', desc: '30 mins or refund' },
                                { icon: 'pricetag', title: 'Best Prices', desc: 'Transparent pricing' },
                                { icon: 'headset', title: '24/7 Support', desc: 'Always here to help' },
                            ].map((feature, index) => (
                                <View key={index} style={styles.featureItem}>
                                    <View style={[styles.featureIcon, { backgroundColor: FEATURE_COLORS[index] + '15' }]}>
                                        <Ionicons
                                            name={feature.icon as any}
                                            size={22}
                                            color={FEATURE_COLORS[index]}
                                        />
                                    </View>
                                    <Text style={styles.featureTitle} numberOfLines={1}>{feature.title}</Text>
                                    <Text style={styles.featureDesc} numberOfLines={1}>{feature.desc}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Bottom spacer */}
                    <View style={{ height: spacing.xl }} />
                </ScrollView>

                {/* Login Celebration Animation Overlay */}
                {showLoginCelebration && (
                    <BubbleCelebration
                        onComplete={() => setShowLoginCelebration(false)}
                    />
                )}
            </View>
        </View>
    );
};

const CARD_WIDTH = (SCREEN_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: customerColors.primary,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#F5F8FA',
    },
    premiumHeader: {
        paddingHorizontal: GRID_PAD,
        paddingTop: spacing.xs,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    headerBgDecor: {
        position: 'absolute',
        right: -40,
        top: -30,
        transform: [{ rotate: '-10deg' }],
    },
    headerBgDecor2: {
        position: 'absolute',
        left: -10,
        top: '40%',
        transform: [{ rotate: '25deg' }],
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Allows children to align independently
        justifyContent: 'space-between',
        marginBottom: spacing.xs, // Reduced margin significantly
    },
    headerLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        maxWidth: '65%',
    },
    headerLocationIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    headerLocationTextWrap: {
        flex: 1,
    },
    headerLocationLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    headerLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLocationText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: 10, // Nudges the icons down inside the flex-start container
    },
    headerIconBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF7043', // Customer accent red/orange
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: customerColors.primaryDark,
    },
    headerBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerGreeting: {
        marginTop: spacing.xs,
        paddingLeft: spacing.xs,
        paddingBottom: spacing.xs,
    },
    headerGreetingTitle: {
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
    },
    headerGreetingSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 2,
    },
    integratedSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    searchIconCustom: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    searchPlaceholderCustom: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '400',
    },
    searchMicCustom: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.xs,
    },
    scrollView: {
        flex: 1,
        marginTop: spacing.sm,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
        paddingTop: spacing.xs,
    },
    section: {
        marginTop: spacing.lg + 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: GRID_PAD,
    },
    sectionTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionAccent: {
        width: 4,
        height: 20,
        borderRadius: 2,
        marginRight: spacing.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAll: {
        fontSize: 13,
        color: customerColors.primary,
        fontWeight: '600',
    },
    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
        paddingHorizontal: GRID_PAD,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
        paddingHorizontal: GRID_PAD,
    },
    referralBanner: {
        marginHorizontal: GRID_PAD,
        marginTop: spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: 'rgba(127, 166, 80, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    referralGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    referralIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(127, 166, 80, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    referralContent: {
        flex: 1,
    },
    referralTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D5016',
        marginBottom: 2,
    },
    referralDesc: {
        fontSize: 12,
        color: '#5B7A3D',
        fontWeight: '500',
    },
    referralArrow: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(127, 166, 80, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    whyChooseSection: {
        marginTop: spacing.lg + 4,
        marginHorizontal: GRID_PAD,
        padding: spacing.lg,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 2,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    featureItem: {
        width: (SCREEN_WIDTH - GRID_PAD * 2 - spacing.lg * 2 - spacing.sm) / 2,
        alignItems: 'center',
        padding: spacing.sm,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    featureTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
});
