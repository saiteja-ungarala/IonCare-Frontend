import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Keyboard,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { catalogService } from '../../services/catalogService';
import storeService, { StoreProduct } from '../../services/storeService';
import { Service } from '../../models/types';
import { useDebounce } from 'use-debounce';
import { resolveProductImageSource } from '../../utils/productImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type SearchScreenProps = { navigation: NativeStackNavigationProp<any> };

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500);

    // Results
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<StoreProduct[]>([]);

    // Loading states
    const [isLoading, setIsLoading] = useState(false);

    // Fetch all services initially to filter locally (since list is small)
    const [allServices, setAllServices] = useState<Service[]>([]);

    useEffect(() => {
        // Load initial catalog data for client-side filtering
        catalogService.getServices().then(setAllServices).catch(console.error);
    }, []);

    // Perform search
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setServices([]);
            setProducts([]);
            return;
        }

        const handleSearch = async () => {
            setIsLoading(true);
            try {
                // 1. Filter Services locally
                const q = debouncedQuery.toLowerCase();
                const filteredServices = allServices.filter(s =>
                    s.name.toLowerCase().includes(q) ||
                    s.category.toLowerCase().includes(q)
                ).slice(0, 5); // Limit to 5
                setServices(filteredServices);

                // 2. Search Products via API
                const productRes = await storeService.getProducts({ q: debouncedQuery.trim(), limit: 5 });
                setProducts(productRes.items);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        handleSearch();
    }, [debouncedQuery, allServices]);

    const handleClear = () => {
        setQuery('');
        setServices([]);
        setProducts([]);
        Keyboard.dismiss();
    };

    const renderServiceItem = ({ item }: { item: Service }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => navigation.navigate('ServiceDetails', { service: item })}
        >
            <View style={[styles.iconBox, { backgroundColor: customerColors.primaryDark + '20' }]}>
                <Ionicons name="construct" size={20} color={customerColors.primaryDark} />
            </View>
            <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultSub}>{item.duration} • ₹{item.price}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    const renderProductItem = ({ item }: { item: StoreProduct }) => {
        const imageSource = resolveProductImageSource(item.imageUrl);

        return (
            <TouchableOpacity
                style={styles.resultItem}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
            >
                <View style={[styles.iconBox, { backgroundColor: customerColors.secondary + '20' }]}>
                    {imageSource ? (
                        <Image source={imageSource} style={styles.productThumb} resizeMode="cover" />
                    ) : (
                        <Ionicons name="cube" size={20} color={customerColors.secondary} />
                    )}
                </View>
                <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    <Text style={styles.resultSub}>₹{item.price}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={customerColors.textSecondary} />
            </TouchableOpacity>
        );
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={customerColors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
                        <TextInput
                            style={styles.input}
                            placeholder="Search services & products..."
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            selectionColor={customerColors.textOnPrimary}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={handleClear}>
                                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>

            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={customerColors.primaryDark} />
                </View>
            ) : (
                <FlatList
                    style={styles.list}
                    data={[]}
                    renderItem={null}
                    ListHeaderComponent={
                        <View>
                            {!query.trim() ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="search-outline" size={64} color={customerColors.border} />
                                    <Text style={styles.emptyText}>Find services, purifiers, and spares</Text>
                                </View>
                            ) : (
                                <>
                                    {/* Services Section */}
                                    {services.length > 0 && (
                                        <View style={styles.section}>
                                            <Text style={styles.sectionTitle}>Services</Text>
                                            {services.map(s => <View key={s.id}>{renderServiceItem({ item: s })}</View>)}
                                        </View>
                                    )}

                                    {/* Products Section */}
                                    {products.length > 0 && (
                                        <View style={styles.section}>
                                            <Text style={styles.sectionTitle}>Products</Text>
                                            {products.map(p => <View key={p.id}>{renderProductItem({ item: p })}</View>)}
                                        </View>
                                    )}

                                    {/* No results */}
                                    {debouncedQuery && services.length === 0 && products.length === 0 && (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>No results found for "{query}"</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: customerColors.background },
    header: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
        marginLeft: -spacing.xs,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    input: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 16,
        color: customerColors.textOnPrimary,
        paddingVertical: 8,
    },
    list: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl * 2 },
    emptyText: { ...typography.body, color: customerColors.textSecondary, marginTop: spacing.md },
    section: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
    sectionTitle: { ...typography.h3, color: customerColors.text, marginBottom: spacing.sm },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: customerColors.surface, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
    iconBox: { width: 44, height: 44, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, overflow: 'hidden' },
    productThumb: { width: '100%', height: '100%' },
    resultInfo: { flex: 1 },
    resultTitle: { ...typography.body, fontWeight: '600', color: customerColors.text },
    resultSub: { ...typography.caption, color: customerColors.textSecondary },
});
