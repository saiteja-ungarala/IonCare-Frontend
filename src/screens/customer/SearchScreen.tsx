
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
import { catalogService } from '../../services/catalogService';
import storeService, { StoreProduct } from '../../services/storeService';
import { Service } from '../../models/types';
import { useDebounce } from 'use-debounce';
import { resolveProductImageSource } from '../../utils/productImage';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="construct" size={20} color={colors.primary} />
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
                <View style={[styles.iconBox, { backgroundColor: colors.secondary + '20' }]}>
                    {imageSource ? (
                        <Image source={imageSource} style={styles.productThumb} resizeMode="cover" />
                    ) : (
                        <Ionicons name="cube" size={20} color={colors.secondary} />
                    )}
                </View>
                <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    <Text style={styles.resultSub}>₹{item.price}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search services & products..."
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        placeholderTextColor={colors.textSecondary}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={handleClear}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={colors.primary} />
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
                                    <Ionicons name="search-outline" size={64} color={colors.border} />
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { marginRight: spacing.sm, padding: 4 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    input: { flex: 1, marginLeft: spacing.sm, fontSize: 16, color: colors.text, paddingVertical: 4 },
    list: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl * 2 },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    section: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
    iconBox: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, overflow: 'hidden' },
    productThumb: { width: '100%', height: '100%' },
    resultInfo: { flex: 1 },
    resultTitle: { ...typography.body, fontWeight: '600', color: colors.text },
    resultSub: { ...typography.caption, color: colors.textSecondary },
});
