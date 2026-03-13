import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, Service } from '../../models/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { catalogService } from '../../services/catalogService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const renderItem = ({ item }: { item: Service }) => {
        const catColor = getCategoryColor(item.category);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleServicePress(item)}
                activeOpacity={0.85}
            >
                {/* Left accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: catColor }]} />
                <View style={[styles.iconContainer, { backgroundColor: catColor + '18' }]}>
                    <Ionicons name={getCategoryIcon(item.category)} size={28} color={catColor} />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardDuration} numberOfLines={1}>{item.duration}</Text>
                    <Text style={styles.cardPrice}>₹{item.price}</Text>
                </View>
                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
            </TouchableOpacity>
        );
    };

    const insets = useSafeAreaInsets();

    const renderHeader = () => (
        <LinearGradient
            colors={[customerColors.primary, customerColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Our Services</Text>
                <Text style={styles.headerSubtitle}>Select a service to book</Text>
            </View>
            <View style={styles.headerDecor}>
                <Ionicons name="construct" size={80} color="rgba(255,255,255,0.25)" />
            </View>
        </LinearGradient>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={customerColors.primary} />
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={customerColors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={customerColors.primary} />
            {renderHeader()}
            <FlatList
                data={services}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                numColumns={1}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8FA',
    },
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        ...typography.headerTitle,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    headerDecor: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.md,
        opacity: 0.8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: spacing.md,
        paddingLeft: 0,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardAccent: {
        width: 4,
        alignSelf: 'stretch',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        marginRight: spacing.md,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardContent: {
        flex: 1,
        flexShrink: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    cardDuration: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
        fontWeight: '500',
    },
    cardPrice: {
        fontSize: 15,
        color: customerColors.primary,
        fontWeight: '700',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
});
