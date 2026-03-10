// ServiceCard component for displaying service options
// Premium design with responsive sizing

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../theme/theme';
import { Service } from '../models/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_HORIZONTAL_PAD = spacing.lg * 2;
const COMPACT_CARD_WIDTH = (SCREEN_WIDTH - CARD_HORIZONTAL_PAD - CARD_GAP) / 2;

interface ServiceCardProps {
    service: Service;
    onPress: () => void;
    compact?: boolean;
    customColors?: any;
}

// Category-based accent color for visual variety
const getCategoryAccent = (category: string): string => {
    switch (category) {
        case 'water_purifier': return '#4FC3F7';
        case 'ro_plant': return '#039BE5';
        case 'water_softener': return '#42A5F5';
        case 'ionizer': return '#0277BD';
        case 'installation': return '#66BB6A';
        default: return '#78909C';
    }
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
    service,
    onPress,
    compact = false,
    customColors,
}) => {
    const theme = customColors || colors;
    const accentColor = getCategoryAccent(service.category);

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (service.category) {
            case 'water_purifier': return 'water-outline';
            case 'ro_plant': return 'filter-outline';
            case 'water_softener': return 'beaker-outline';
            case 'ionizer': return 'flash-outline';
            default: return 'construct-outline';
        }
    };

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactContainer, { width: COMPACT_CARD_WIDTH }]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.compactIconContainer, { backgroundColor: theme.surfaceSecondary }]}>
                    <Ionicons name={getIcon()} size={28} color={theme.primary} />
                </View>
                <Text style={[styles.compactTitle, { color: theme.text }]} numberOfLines={2}>
                    {service.name}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
            <View style={[styles.iconContainer, { backgroundColor: accentColor + '18' }]}>
                <Ionicons name={getIcon()} size={28} color={accentColor} />
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{service.name}</Text>
                <Text style={[styles.duration, { color: theme.textSecondary }]} numberOfLines={1}>{service.duration}</Text>
                <Text style={[styles.price, { color: theme.primary }]}>₹{service.price}</Text>
            </View>
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={18} color={theme.textLight || theme.textSecondary} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        paddingLeft: 0,
        overflow: 'hidden',
        ...shadows.md,
    },
    accentBar: {
        width: 4,
        alignSelf: 'stretch',
        borderTopLeftRadius: borderRadius.lg,
        borderBottomLeftRadius: borderRadius.lg,
        marginRight: spacing.md,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        marginLeft: spacing.md,
        flexShrink: 1,
    },
    title: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    duration: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    price: {
        ...typography.body,
        fontWeight: '700',
        color: colors.primary,
        marginTop: 4,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    // Compact styles for grid layout (original design)
    compactContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
        marginBottom: spacing.md,
    },
    compactIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    compactTitle: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
});
