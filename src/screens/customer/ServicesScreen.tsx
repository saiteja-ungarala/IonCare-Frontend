import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Service } from '../../models/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { catalogService } from '../../services/catalogService';

type ServicesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Icon by category
const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
        case 'Service': case 'water_purifier': return 'water';
        case 'Purifier': return 'water';
        case 'ro_service': case 'ro_plant': return 'construct';
        case 'Cleaning': return 'sparkles';
        case 'Testing': case 'testing': return 'flask';
        case 'water_softener': return 'beaker';
        case 'installation': return 'build';
        case 'ionizer': return 'flash';
        default: return 'construct';
    }
};

const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'Service': case 'water_purifier': return '#4FC3F7';
        case 'Purifier': return '#29B6F6';
        case 'ro_service': case 'ro_plant': return '#039BE5';
        case 'Cleaning': return '#26A69A';
        case 'Testing': case 'testing': return '#7E57C2';
        case 'water_softener': return '#42A5F5';
        case 'installation': return '#66BB6A';
        case 'ionizer': return '#0277BD';
        default: return '#78909C';
    }
};

export const ServicesScreen = () => {
    const navigation = useNavigation<ServicesScreenNavigationProp>();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
            try {
                const list = await catalogService.getServices();
                if (isMounted) {
                    setServices(list);
                }
            } catch (error) {
                console.error('[ServicesScreen] Failed to load services:', error);
                if (isMounted) {
                    setServices([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadServices();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleServicePress = (service: Service) => {
        navigation.navigate('ServiceDetails', { service });
    };

    const renderItem = ({ item }: { item: Service }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleServicePress(item)}
            activeOpacity={0.9}
        >
            <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(item.category) }]}>
                <Ionicons name={getCategoryIcon(item.category)} size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDuration}>{item.duration}</Text>
                <Text style={styles.cardPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Our Services</Text>
                    <Text style={styles.headerSubtitle}>Select a service to book</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Our Services</Text>
                <Text style={styles.headerSubtitle}>Select a service to book</Text>
            </View>
            <FlatList
                data={services}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                numColumns={1}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
        ...shadows.sm,
        marginBottom: spacing.md,
    },
    headerTitle: {
        ...typography.h1,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        ...typography.h2,
        fontSize: 17,
        color: colors.text,
        marginBottom: 2,
    },
    cardDuration: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    cardPrice: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
    arrowContainer: {
        padding: spacing.xs,
    },
});
